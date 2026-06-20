from fastapi import APIRouter, Depends, Query
from dependencies import get_token_data
import gmail

router = APIRouter(prefix="/emails", tags=["emails"])


@router.get("/")
def get_inbox_preview(
    count: int = Query(default=10, ge=1, le=50),
    token_data: dict = Depends(get_token_data),
):
    service = gmail.get_gmail_service(token_data)
    return {"emails": gmail.fetch_inbox_preview(service, count)}
