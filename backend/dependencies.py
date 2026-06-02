from fastapi import Request, HTTPException


def get_token_data(request: Request) -> dict:
    token_data = getattr(request.state, "token_data", None)
    if not token_data:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return token_data
