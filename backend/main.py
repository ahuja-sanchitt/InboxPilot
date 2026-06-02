import os
import json
import base64
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from auth import router as auth_router
from routes.summary import router as summary_router
from routes.drafts import router as drafts_router
from routes.send import router as send_router

load_dotenv()


app = FastAPI(title="InboxPilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def attach_token(request: Request, call_next):
    token_cookie = request.cookies.get("gmail_token")
    if token_cookie:
        try:
            token_data = json.loads(base64.b64decode(token_cookie).decode())
            request.state.token_data = token_data
        except Exception:
            request.state.token_data = None
    else:
        request.state.token_data = None
    return await call_next(request)


app.include_router(auth_router)
app.include_router(summary_router)
app.include_router(drafts_router)
app.include_router(send_router)


@app.get("/")
def root():
    return {"status": "ok", "message": "InboxPilot API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
