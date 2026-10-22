# Test that chat history is saved and reloaded

# Run: uv run python -m tests.test_chat_service
# Uses made-up test users (keycloak ids starting with "test-")
# Safe to run more than once: it deletes its own test chats at the end

# "cs" is a short nickname for chat_service
from backend.services import chat_service as cs



# 1. USERS
#-------------------------------------------------------------------------------------------
print("1. Users (as if they just logged in with Keycloak)")

# first login: creates both users
bob = cs.get_or_create_user("test-bob", "bob@example.com")
tom = cs.get_or_create_user("test-tom", "tom@example.com")

# Bob logs in again: should return the SAME user, not make a new one
again = cs.get_or_create_user("test-bob")
print(f"   bob id={bob.id}, tom id={tom.id}, same user on 2nd login: {again.id == bob.id}")



# 2. CREATE CHATS
#-------------------------------------------------------------------------------------------
print("2. Create two chats for Bob")

# Naples is created first, Tampa second (so Tampa starts as the newest)
naples = cs.create_chat(bob.id, "Naples damage check")
tampa = cs.create_chat(bob.id, "Tampa flood")
print(f"   created chat {naples.id} and {tampa.id}")



# 3. SAVE MESSAGES
#-------------------------------------------------------------------------------------------
print("3. Save messages in Bob's Naples chat")

# each message also updates Naples' last activity, so Naples becomes the newest
cs.add_message(bob.id, naples.id, "user", "How much damage is in this image?")
cs.add_message(bob.id, naples.id, "assistant", "About 35% damage. 3 of 8 buildings have major damage.")
cs.add_message(bob.id, naples.id, "user", "Which buildings should rescuers check first?")



# 4. CHAT LIST
#-------------------------------------------------------------------------------------------
print("4. Bob's chat list (newest activity first) - Naples should be on top")

# Naples was created first but has newer messages, so it should be listed first
for chat in cs.list_chats(bob.id):
    print(f"   [{chat.id}] {chat.title}")



# 5. RELOAD A CHAT
#-------------------------------------------------------------------------------------------
print("5. Reload Bob's Naples chat (as if the app restarted)")

# everything comes back from the database in the order it was sent
# (:9 pads the role so the text lines up)
for m in cs.load_chat(bob.id, naples.id):
    print(f"   {m.role:9}: {m.content}")



# 6. PRIVACY
#-------------------------------------------------------------------------------------------
print("6. Privacy: Tom can't open or write to Bob's chat")

# each lambda is a small function that tries something Tom shouldn't be allowed to do
for action in (lambda: cs.load_chat(tom.id, naples.id),                  # Tom tries to read
               lambda: cs.add_message(tom.id, naples.id, "user", "hi")):  # Tom tries to write
    try:
        action()
        # should never print
        print("   !! allowed (bug)")
    except PermissionError as e:
        # expected: Tom is blocked
        print(f"   blocked: {e}")



# 7. RENAME + DELETE (also cleans up)
#-------------------------------------------------------------------------------------------
print("7. Rename and delete")

# rename the Tampa chat
cs.rename_chat(bob.id, tampa.id, "Tampa flood - Oct 2026")
print(f"   renamed: {[c.title for c in cs.list_chats(bob.id)]}")

# delete both test chats (and their messages) so the test can run again cleanly
cs.delete_chat(bob.id, naples.id)
cs.delete_chat(bob.id, tampa.id)
print(f"   after deleting test chats: {len(cs.list_chats(bob.id))} chats left")

print("OK")