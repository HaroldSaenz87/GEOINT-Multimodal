# Saving, listing, and deleting images (map snap or uploads)

# Pictures are saved as FILE in IMAGE_DIR
# Image table stores who owns it, where it is, and where it is on the map
# Frontend will call this

import os
import uuid
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from geoalchemy2.elements import WKTElement
from PIL import Image as PILImage
from sqlalchemy import func
from sqlmodel import select

from backend.db import get_session
from backend.schema import Image, now

# load settings from env
load_dotenv()

# folder where image files are saved
IMAGE_DIR = Path(os.environ.get("IMAGE_DIR", "data/images"))

# where an image can come from
VALID_SOURCES = {"snapshot", "upload"}

# Allowed image type
ALLOWED_FORMATS = {"PNG": "png", "JPEG": "jpg", "TIFF": "tif"}

# files allowed 
MAX_UPLOAD = 20 * 1024* 1024

# thumbnail size using width and height
THUMB_SIZE = (256,256)


# SAVE
#---------------------------------------------------------------------------------------

def save_img(

        # owner
        user_id: int,

        # raw image file
        data: bytes,

        # snapshot or upload
        source: str,

        # map area: (min_lon, min_lat, max_lon, max_lat)
        bounds: Optional[tuple[float, float, float, float]] = None,

        # map zoom level (snapshots)
        zoom: Optional[int] = None,

        # which tile server (snapshots)
        tile_provider: Optional[str] = None,

        # meter per pixe
        pixel_size_m: Optional[float] = None,

        # when the imagery was taken 
        capture_date: Optional[datetime] = None,
) -> Image:

    # reject anything that isn't "snapshot" or "upload"
    if source not in VALID_SOURCES:
        raise ValueError(f"source must be one of {VALID_SOURCES}")

    # reject files that are too big
    if len(data) > MAX_UPLOAD:
        raise ValueError(f"image is larger than {MAX_UPLOAD // (1024 * 1024)} MB")

    # open the files with Pillow to prove it's a real image
    try:
        img = PILImage.open(BytesIO(data))
        img.load()
    except Exception:
        raise ValueError("file is not a readable image")

    # only allow PNG, JPEG, and TIFF
    if img.format not in ALLOWED_FORMATS:
        raise ValueError(f"unsupported format {img.format}; allowed: {', '.join(ALLOWED_FORMATS)}")

    # remember the original format and size before converting
    file_format = ALLOWED_FORMATS[img.format]

    width, height = img.size

    # make this user's folder
    user_dir = IMAGE_DIR / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)

    # random file name, so users can't guess others 
    name = uuid.uuid4().hex
    file_path = user_dir / f"{name}.png"
    thumb_path = user_dir / f"{name}_thumb.png"

    # save png copy for browser and the model
    rgb = img.convert("RGB")
    rgb.save(file_path, "PNG")

    # save a small preview for the image library 
    thumb = rgb.copy()
    thumb.thumbnail(THUMB_SIZE)
    thumb.save(thumb_path, "PNG")

    # turn the map corners into POstGIS coordinates
    area = None
    if bounds is not None:
        min_lon, min_lat, max_lon, max_lat = bounds

        area = WKTElement(

            f"POLYGON(({min_lon} {min_lat}, {max_lon} {min_lat}, {max_lon} {max_lat}, "
            f"{min_lon} {max_lat}, {min_lon} {min_lat}))",
            srid=4326,

        )

    # build the images table row
    record = Image(

        user_id=user_id,
        source=source,
        file_path=file_path.as_posix(),      
        thumb_path=thumb_path.as_posix(),
        format=file_format,
        width=width,
        height=height,
        area=area,
        zoom=zoom,
        tile_provider=tile_provider,
        pixel_size_m=pixel_size_m,
        capture_date=capture_date,
    )

    # save the row to the database
    with get_session() as session:
        session.add(record)
        session.commit()

        # reload to get record.id
        session.refresh(record)
        return record


# Read
#-----------------------------------------------------------------------------------------------------------
def get_image(user_id: int, image_id: int) -> Image:

    # get one image only if it belongs to the user
    with get_session() as session:
        image = session.get(Image, image_id)

        # same message either way 
        if image is None or image.user_id != user_id:
            raise PermissionError("Image not found")

        return image

def list_images(user_id: int, source: Optional[str] = None) -> list[Image]:

    # the image library basically user's images sorted by newest first
    with get_session() as session:
        statement = (

            # from the images table
            select(Image)

            # only this user's images
            .where(Image.user_id == user_id)

            # skip deleted images
            .where(Image.deleted_at.is_(None))

            # newest first
            .order_by(Image.created_at.desc())
        )
        # optional filter: only "snapshot" or only "upload"
        if source is not None:
            statement = statement.where(Image.source == source)

        return list(session.exec(statement).all())






# this function will find a user's images of a place without scrolling through all of them
# !!!![COME BACK TO THIS LATER]!!!! stretch goal? find older snapshots of the same spot to compare
# Only finds images that have a map area (snapshots taken from map).... UPLOADS dont have area so it'll be skipped
def find_images_at(user_id: int, lon: float, lat: float) -> list[Image]:

    # PostGIS search: this user's images whose map area covers a point and build a map point from longitude/latitude (GPS coordinates)
    point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)

    with get_session() as session:
        statement = (
            # from the images table
            select(Image)

            # only this user's images
            .where(Image.user_id == user_id)

            # skip deleted images
            .where(Image.deleted_at.is_(None))

            # this is basically a "does the image's map area touch this point?"
            .where(func.ST_Intersects(Image.area, point))

            # newest first
            .order_by(Image.created_at.desc())
        )

        # run the search and return the results as a list
        return list(session.exec(statement).all())




# DELETE
#----------------------------------------------------------------------------------------------------------------------

def delete_image(user_id: int, image_id: int) -> None:

    with get_session() as session:

        # look up the image by id
        image = session.get(Image, image_id)

        # ownership check
        if image is None or image.user_id != user_id:
            raise PermissionError("Image not found")

        # delete the image file and thumbnail from disk 
        for path in (image.file_path, image.thumb_path):
            if path:
                Path(path).unlink(missing_ok=True)

        # clear the file paths and marks it as deleted
        image.file_path = None
        image.thumb_path = None
        image.deleted_at = now()

        # save the change
        session.add(image)
        session.commit()