import base64
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials


def get_gmail_service(token_data: dict):
    creds = Credentials(
        token=token_data["access_token"],
        refresh_token=token_data.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=token_data.get("client_id"),
        client_secret=token_data.get("client_secret"),
    )
    return build("gmail", "v1", credentials=creds)


def _build_mime(to: str, subject: str, body: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["to"] = to
    msg["subject"] = subject
    msg.attach(MIMEText(body, "plain"))
    return msg


def _encode_message(msg) -> dict:
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    return {"raw": raw}


_LABEL_CATEGORY = {
    "CATEGORY_PROMOTIONS": ("Promo", "purple"),
    "CATEGORY_SOCIAL": ("Social", "blue"),
    "CATEGORY_UPDATES": ("Update", "cyan"),
    "CATEGORY_FORUMS": ("Forum", "orange"),
    "IMPORTANT": ("Important", "amber"),
}


def _get_category(label_ids: list[str]) -> dict:
    for label, (name, color) in _LABEL_CATEGORY.items():
        if label in label_ids:
            return {"label": name, "color": color}
    return {"label": "Inbox", "color": "gray"}


def fetch_inbox_preview(service, count: int = 10) -> list[dict]:
    result = service.users().messages().list(
        userId="me", maxResults=count, labelIds=["INBOX"]
    ).execute()

    emails = []
    for m in result.get("messages", []):
        full = service.users().messages().get(
            userId="me", id=m["id"], format="metadata",
            metadataHeaders=["Subject", "From", "Date"]
        ).execute()

        headers = {h["name"]: h["value"] for h in full["payload"]["headers"]}
        label_ids = full.get("labelIds", [])
        from_addr = headers.get("From", "").lower()
        needs_reply = (
            "IMPORTANT" in label_ids
            and not any(x in from_addr for x in ["noreply", "no-reply", "donotreply", "mailer-daemon"])
        )

        emails.append({
            "id": m["id"],
            "from": headers.get("From", ""),
            "subject": headers.get("Subject", "(no subject)"),
            "date": headers.get("Date", ""),
            "snippet": full.get("snippet", ""),
            "category": _get_category(label_ids),
            "needs_reply": needs_reply,
        })

    return emails


def fetch_recent_emails(service, count: int = 10, since: str = None) -> list[dict]:
    kwargs = {"userId": "me", "maxResults": count, "labelIds": ["INBOX"]}
    if since:
        kwargs["q"] = f"after:{since}"
        kwargs.pop("maxResults")  # fetch all emails from that date
    result = service.users().messages().list(**kwargs).execute()

    messages = result.get("messages", [])
    emails = []

    for m in messages:
        # fetch metadata + snippet only — avoids downloading full body for every email
        meta = service.users().messages().get(
            userId="me", id=m["id"], format="metadata",
            metadataHeaders=["Subject", "From", "Date"]
        ).execute()

        headers = {h["name"]: h["value"] for h in meta["payload"]["headers"]}
        emails.append({
            "id": m["id"],
            "from": headers.get("From", ""),
            "subject": headers.get("Subject", "(no subject)"),
            "date": headers.get("Date", ""),
            "snippet": meta.get("snippet", ""),
            "body": meta.get("snippet", ""),  # use snippet as body for AI — fast and sufficient
        })

    return emails


def _extract_body(payload: dict) -> str:
    if "parts" in payload:
        for part in payload["parts"]:
            if part["mimeType"] == "text/plain":
                data = part["body"].get("data", "")
                return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
    data = payload.get("body", {}).get("data", "")
    if data:
        return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
    return ""


def create_draft(service, to: str, subject: str, body: str) -> dict:
    msg = _build_mime(to, subject, body)
    draft = service.users().drafts().create(
        userId="me", body={"message": _encode_message(msg)}
    ).execute()
    return {"draft_id": draft["id"], "recipient": to}


def send_email(service, to: str, subject: str, body: str) -> dict:
    msg = _build_mime(to, subject, body)
    sent = service.users().messages().send(
        userId="me", body=_encode_message(msg)
    ).execute()
    return {"message_id": sent["id"], "recipient": to}
