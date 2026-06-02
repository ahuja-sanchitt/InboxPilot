from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from dependencies import get_token_data
import gmail

router = APIRouter(prefix="/drafts", tags=["drafts"])


class DraftRequest(BaseModel):
    subject: str
    body: str
    recipients: list[str]
    variables: Optional[dict] = {}


def _resolve(text: str, variables: dict) -> str:
    for key, value in variables.items():
        text = text.replace(f"{{{{{key}}}}}", str(value))
    return text


@router.post("/")
def create_drafts(
    payload: DraftRequest,
    token_data: dict = Depends(get_token_data),
):
    if not payload.recipients:
        raise HTTPException(status_code=400, detail="Provide at least one recipient")

    service = gmail.get_gmail_service(token_data)
    subject = _resolve(payload.subject, payload.variables)
    body = _resolve(payload.body, payload.variables)

    results = []
    for email in payload.recipients:
        try:
            result = gmail.create_draft(service, email, subject, body)
            results.append({"email": email, "status": "created", "draft_id": result["draft_id"]})
        except Exception as e:
            results.append({"email": email, "status": "failed", "error": str(e)})

    return {
        "created": len([r for r in results if r["status"] == "created"]),
        "results": results,
    }
