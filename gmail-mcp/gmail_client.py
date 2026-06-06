import base64
from email.mime.text import MIMEText
from googleapiclient.discovery import build
from auth import get_credentials


def get_service():
    return build("gmail", "v1", credentials=get_credentials())


def list_emails(count: int = 10) -> list[dict]:
    service = get_service()
    results = service.users().messages().list(
        userId="me", maxResults=count, labelIds=["INBOX"]
    ).execute()

    emails = []
    for msg in results.get("messages", []):
        full = service.users().messages().get(
            userId="me", id=msg["id"], format="metadata",
            metadataHeaders=["Subject", "From", "Date"]
        ).execute()
        headers = {h["name"]: h["value"] for h in full["payload"]["headers"]}
        emails.append({
            "id": msg["id"],
            "thread_id": full["threadId"],
            "subject": headers.get("Subject", "(no subject)"),
            "from": headers.get("From", ""),
            "date": headers.get("Date", ""),
            "snippet": full.get("snippet", ""),
        })
    return emails


def get_email_body(message_id: str) -> dict:
    service = get_service()
    full = service.users().messages().get(userId="me", id=message_id, format="full").execute()
    headers = {h["name"]: h["value"] for h in full["payload"]["headers"]}
    return {
        "id": message_id,
        "thread_id": full["threadId"],
        "subject": headers.get("Subject", "(no subject)"),
        "from": headers.get("From", ""),
        "to": headers.get("To", ""),
        "date": headers.get("Date", ""),
        "body": _extract_body(full["payload"]),
    }


def get_thread(thread_id: str) -> list[dict]:
    service = get_service()
    thread = service.users().threads().get(userId="me", id=thread_id, format="full").execute()
    messages = []
    for msg in thread["messages"]:
        headers = {h["name"]: h["value"] for h in msg["payload"]["headers"]}
        messages.append({
            "id": msg["id"],
            "from": headers.get("From", ""),
            "to": headers.get("To", ""),
            "date": headers.get("Date", ""),
            "subject": headers.get("Subject", ""),
            "body": _extract_body(msg["payload"]),
        })
    return messages


def list_emails_with_body(count: int = 10) -> list[dict]:
    service = get_service()
    results = service.users().messages().list(
        userId="me", maxResults=count, labelIds=["INBOX"]
    ).execute()
    emails = []
    for msg in results.get("messages", []):
        full = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
        headers = {h["name"]: h["value"] for h in full["payload"]["headers"]}
        emails.append({
            "id": msg["id"],
            "thread_id": full["threadId"],
            "subject": headers.get("Subject", "(no subject)"),
            "from": headers.get("From", ""),
            "date": headers.get("Date", ""),
            "snippet": full.get("snippet", ""),
            "body": _extract_body(full["payload"])[:1500],
        })
    return emails


def search_emails(query: str, count: int = 10) -> list[dict]:
    service = get_service()
    results = service.users().messages().list(userId="me", q=query, maxResults=count).execute()
    emails = []
    for msg in results.get("messages", []):
        full = service.users().messages().get(
            userId="me", id=msg["id"], format="metadata",
            metadataHeaders=["Subject", "From", "Date"]
        ).execute()
        headers = {h["name"]: h["value"] for h in full["payload"]["headers"]}
        emails.append({
            "id": msg["id"],
            "thread_id": full["threadId"],
            "subject": headers.get("Subject", "(no subject)"),
            "from": headers.get("From", ""),
            "date": headers.get("Date", ""),
            "snippet": full.get("snippet", ""),
        })
    return emails


def send_email(to: str, subject: str, body: str) -> dict:
    service = get_service()
    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()
    return {"id": sent["id"], "status": "sent", "to": to}


def create_draft(to: str, subject: str, body: str) -> dict:
    service = get_service()
    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    draft = service.users().drafts().create(
        userId="me", body={"message": {"raw": raw}}
    ).execute()
    return {"id": draft["id"], "status": "created", "to": to}


def substitute(text: str, variables: dict) -> str:
    for key, value in variables.items():
        text = text.replace(f"{{{{{key}}}}}", value)
    return text


def bulk_create_drafts(subject: str, body: str, recipients: list[str], variables: dict) -> dict:
    results = []
    for email in recipients:
        try:
            result = create_draft(email, substitute(subject, variables), substitute(body, variables))
            results.append({"email": email, "status": "created", "draft_id": result["id"]})
        except Exception as e:
            results.append({"email": email, "status": "error", "error": str(e)})
    created = sum(1 for r in results if r["status"] == "created")
    return {"created": created, "failed": len(results) - created, "results": results}


def bulk_send_emails(subject: str, body: str, recipients: list[str], variables: dict) -> dict:
    results = []
    for email in recipients:
        try:
            result = send_email(email, substitute(subject, variables), substitute(body, variables))
            results.append({"email": email, "status": "sent", "message_id": result["id"]})
        except Exception as e:
            results.append({"email": email, "status": "error", "error": str(e)})
    sent = sum(1 for r in results if r["status"] == "sent")
    return {"sent": sent, "failed": len(results) - sent, "results": results}


def _extract_body(payload: dict) -> str:
    if "body" in payload and payload["body"].get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="replace")
    if "parts" in payload:
        for part in payload["parts"]:
            if part["mimeType"] == "text/plain" and part["body"].get("data"):
                return base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="replace")
        for part in payload["parts"]:
            result = _extract_body(part)
            if result:
                return result
    return ""
