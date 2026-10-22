# Test that images are saved, listed, found by location, and deleted

# Run: uv run python -m tests.test_image_service
# Uses the test users from test_chat_service (test-bob, test-tom)
# Safe to run more than once: it deletes its own test images at the end

from io import BytesIO
from pathlib import Path

from PIL import Image as PILImage, ImageDraw

from backend.services import chat_service as cs
from backend.services import image_service as imgs


# makes a fake "satellite image" in memory: a colored square with gray "buildings"
def fake_satellite_image(color, fmt="PNG") -> bytes:
    img = PILImage.new("RGB", (1024, 768), color)
    draw = ImageDraw.Draw(img)
    for x in range(0, 1024, 128):
        draw.rectangle([x + 20, 300, x + 100, 380], fill=(120, 120, 120))
    buf = BytesIO()
    img.save(buf, fmt)
    # the raw file bytes, like what a browser upload sends
    return buf.getvalue()



# 1. USERS
#-------------------------------------------------------------------------------------------
print("1. Users")
bob = cs.get_or_create_user("test-bob", "bob@example.com")
tom = cs.get_or_create_user("test-tom", "tom@example.com")
print(f"   bob id={bob.id}, tom id={tom.id}")



# 2. SAVE IMAGES
#-------------------------------------------------------------------------------------------
print("2. Save a map snapshot (with location) and an upload (no location)")

# snapshot: has a map area (a small box in Naples, FL), zoom, and tile server
snap = imgs.save_img(
    bob.id, fake_satellite_image((60, 110, 60)), "snapshot",
    bounds=(-81.80, 26.12, -81.78, 26.14), zoom=18, tile_provider="test-tiles",
)

# upload: a JPEG with no location
upload = imgs.save_img(bob.id, fake_satellite_image((90, 80, 60), "JPEG"), "upload")

for im in (snap, upload):
    print(f"   image {im.id} [{im.source}] {im.format} {im.width}x{im.height} -> {im.file_path}")
print(f"   files exist on disk: {Path(snap.file_path).exists() and Path(snap.thumb_path).exists()}")



# 3. BAD FILES
#-------------------------------------------------------------------------------------------
print("3. Bad files are rejected")

# plain text pretending to be an image, and a GIF (not an allowed format)
for label, data in (("not an image", b"hello"), ("GIF format", fake_satellite_image((0, 0, 0), "GIF"))):
    try:
        imgs.save_img(bob.id, data, "upload")
        # should never print
        print(f"   !! {label} allowed (bug)")
    except ValueError as e:
        print(f"   {label}: rejected ({e})")



# 4. IMAGE LIBRARY
#-------------------------------------------------------------------------------------------
print("4. Bob's image library (newest first)")
for im in imgs.list_images(bob.id):
    print(f"   [{im.id}] {im.source}")

# filter: snapshots only
print(f"   snapshots only: {[im.id for im in imgs.list_images(bob.id, source='snapshot')]}")



# 5. LOCATION SEARCH
#-------------------------------------------------------------------------------------------
print("5. Location search (PostGIS)")

# a point inside the snapshot's box should find it; a point in Miami should find nothing
print(f"   images covering a point in Naples: {[im.id for im in imgs.find_images_at(bob.id, -81.79, 26.13)]}")
print(f"   images covering a point in Miami:  {[im.id for im in imgs.find_images_at(bob.id, -80.19, 25.76)]}")



# 6. USE IN A CHAT
#-------------------------------------------------------------------------------------------
print("6. Use the snapshot in a chat")
chat = cs.create_chat(bob.id, "Naples snapshot")
cs.add_message(bob.id, chat.id, "user", "How much damage is in this image?", image_id=snap.id)
print(f"   message saved with image {snap.id}")



# 7. PRIVACY
#-------------------------------------------------------------------------------------------
print("7. Privacy: Tom can't see, delete, or attach Bob's images")
tom_chat = cs.create_chat(tom.id, "Tom's chat")

# each lambda tries something Tom shouldn't be allowed to do
for label, action in (
    ("view", lambda: imgs.get_image(tom.id, snap.id)),
    ("delete", lambda: imgs.delete_image(tom.id, snap.id)),
    ("attach", lambda: cs.add_message(tom.id, tom_chat.id, "user", "hi", image_id=snap.id)),
):
    try:
        action()
        # should never print
        print(f"   !! {label} allowed (bug)")
    except PermissionError as e:
        print(f"   {label}: blocked ({e})")

# Tom's own library should be empty
print(f"   Tom's library: {imgs.list_images(tom.id)}")



# 8. DELETE
#-------------------------------------------------------------------------------------------
print("8. Delete the snapshot")
snap_file = snap.file_path
imgs.delete_image(bob.id, snap.id)

# the file is gone and the image is out of the library
print(f"   file still on disk: {Path(snap_file).exists()}")
print(f"   library now: {[im.id for im in imgs.list_images(bob.id)]}")

# but the old chat message still knows which image it was, so the app can show "Image deleted"
first = cs.load_chat(bob.id, chat.id)[0]
deleted = imgs.get_image(bob.id, first.image_id)
print(f"   old chat message still points to image {first.image_id}; deleted: {deleted.deleted_at is not None}")



# 9. CLEAN UP
#-------------------------------------------------------------------------------------------
print("9. Clean up")
imgs.delete_image(bob.id, upload.id)
cs.delete_chat(bob.id, chat.id)
cs.delete_chat(tom.id, tom_chat.id)
print(f"   Bob's library: {imgs.list_images(bob.id)}")

print("OK")