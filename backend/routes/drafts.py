from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from dependencies import get_token_data
import gmail
import json
from openai import OpenAI
import os

router = APIRouter(prefix="/drafts", tags=["drafts"])


class GenerateRequest(BaseModel):
    prompt: str


class DraftRequest(BaseModel):
    subject: str
    body: str
    recipients: list[str]
    variables: Optional[dict] = {}


def _resolve(text: str, variables: dict) -> str:
    for key, value in variables.items():
        text = text.replace(f"{{{{{key}}}}}", str(value))
    return text


@router.post("/generate")
def generate_draft(payload: GenerateRequest, token_data: dict = Depends(get_token_data)):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an email draft assistant. Given a user's description, generate an email template. "
                    "Use {{variable}} placeholders for anything that changes between drafts (e.g. {{month}}, {{name}}, {{company}}). "
                    "Return a JSON object with exactly these keys: "
                    "subject (string), body (string), recipients (array of email strings, empty if not mentioned), "
                    "variables (object with placeholder keys and suggested example values as strings). "
                    "Return ONLY valid JSON."
                ),
            },
            {"role": "user", "content": payload.prompt},
        ],
    )
    try:
        return json.loads(response.choices[0].message.content)
    except Exception:
        raise HTTPException(status_code=500, detail="AI failed to generate a draft template.")


def _expand_variables(variables: dict) -> list[dict]:
    """
    If any variable has comma-separated values, expand into multiple variable dicts.
    e.g. {"month": "January, February"} → [{"month": "January"}, {"month": "February"}]
    Only the first multi-value variable drives expansion; others are kept as-is.
    """
    for key, value in variables.items():
        parts = [v.strip() for v in str(value).split(',') if v.strip()]
        if len(parts) > 1:
            return [{**variables, key: part} for part in parts]
    return [variables]


@router.post("/")
def create_drafts(
    payload: DraftRequest,
    token_data: dict = Depends(get_token_data),
):
    if not payload.recipients:
        raise HTTPException(status_code=400, detail="Provide at least one recipient")

    service = gmail.get_gmail_service(token_data)
    expanded = _expand_variables(payload.variables or {})

    results = []
    for var_set in expanded:
        subject = _resolve(payload.subject, var_set)
        body = _resolve(payload.body, var_set)
        for email in payload.recipients:
            try:
                result = gmail.create_draft(service, email, subject, body)
                label = var_set.get(next(iter(var_set), ''), '')
                results.append({"email": email, "status": "created", "draft_id": result["draft_id"], "label": label})
            except Exception as e:
                results.append({"email": email, "status": "failed", "error": str(e)})

    return {
        "created": len([r for r in results if r["status"] == "created"]),
        "results": results,
    }
