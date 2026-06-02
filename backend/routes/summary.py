from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_token_data
import gmail
import claude_ai

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("/")
def summarize_inbox(
    count: int = 10,
    token_data: dict = Depends(get_token_data),
):
    if count < 1 or count > 50:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 50")

    service = gmail.get_gmail_service(token_data)
    emails = gmail.fetch_recent_emails(service, count)

    if not emails:
        return {"summaries": [], "message": "No emails found"}

    summaries = claude_ai.summarize_emails(emails)
    needs_reply_count = len([s for s in summaries if s.get("needs_reply")])

    return {
        "total": len(summaries),
        "needs_reply_count": needs_reply_count,
        "summaries": summaries,
    }
