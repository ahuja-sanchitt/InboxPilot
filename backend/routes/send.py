from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from dependencies import get_token_data
import gmail

router = APIRouter(prefix="/send", tags=["send"])


class SendRequest(BaseModel):
    subject: str
    body: str
    recipients: list[str]
    variables: Optional[dict] = {}


def _resolve(text: str, variables: dict) -> str:
    for key, value in variables.items():
        text = text.replace(f"{{{{{key}}}}}", str(value))
    return text


@router.post("/preview")
def preview_send(payload: SendRequest):
    if not payload.recipients:
        raise HTTPException(status_code=400, detail="Provide at least one recipient")
    subject = _resolve(payload.subject, payload.variables)
    body = _resolve(payload.body, payload.variables)
    return {
        "recipient_count": len(payload.recipients),
        "subject": subject,
        "body_preview": body[:500],
        "recipients": payload.recipients,
    }


@router.post("/")
def send_emails(
    payload: SendRequest,
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
            result = gmail.send_email(service, email, subject, body)
            results.append({"email": email, "status": "sent", "message_id": result["message_id"]})
        except Exception as e:
            results.append({"email": email, "status": "failed", "error": str(e)})

    sent = len([r for r in results if r["status"] == "sent"])
    return {"sent": sent, "failed": len(results) - sent, "results": results}
