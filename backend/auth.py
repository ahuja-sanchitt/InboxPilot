import os
import json
import base64
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from dependencies import get_token_data
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.compose",
    "openid",
    "email",
    "profile",
]

CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback")],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }
}


def _make_flow() -> Flow:
    return Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback"),
    )


@router.get("/login")
def login():
    flow = _make_flow()
    auth_url, _ = flow.authorization_url(prompt="consent", access_type="offline")
    return RedirectResponse(auth_url)


@router.get("/callback")
def callback(code: str):
    flow = _make_flow()
    flow.fetch_token(code=code)
    credentials = flow.credentials

    token_data = {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
    }

    token_str = base64.b64encode(json.dumps(token_data).encode()).decode()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    response = RedirectResponse(url=f"{frontend_url}?auth=success")
    response.set_cookie(
        key="gmail_token",
        value=token_str,
        httponly=True,
        samesite="lax",
        max_age=3600,
    )
    return response


@router.get("/logout")
def logout():
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    response = RedirectResponse(url=frontend_url)
    response.delete_cookie("gmail_token")
    return response


@router.get("/me")
def me(token_data: dict = Depends(get_token_data)):
    from gmail import get_gmail_service
    service = build("oauth2", "v2", credentials=_creds_from_token(token_data))
    user_info = service.userinfo().get().execute()
    return {
        "email": user_info.get("email"),
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
    }


def _creds_from_token(token_data: dict):
    from google.oauth2.credentials import Credentials
    return Credentials(
        token=token_data["access_token"],
        refresh_token=token_data.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=token_data.get("client_id"),
        client_secret=token_data.get("client_secret"),
    )
