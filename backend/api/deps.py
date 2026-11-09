# Shared helpers ("dependencies") that routes ask FastAPI for

from typing import Annotated

from fastapi import Depends, Header


# TEMPORARY: who is making the request
# For now the frontend sends the database user id in an "X-User-Id" header
# When Keycloak is added, only this function changes (read the login token instead)
def get_current_user_id(x_user_id: Annotated[int, Header()]) -> int:
    return x_user_id


# shortcut so routes can write: user_id: CurrentUserId
CurrentUserId = Annotated[int, Depends(get_current_user_id)]
