import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def summarize_emails(emails: list[dict]) -> list[dict]:
    if not emails:
        return []

    email_text = ""
    for i, email in enumerate(emails, 1):
        email_text += f"""
Email {i}:
From: {email['from']}
Date: {email['date']}
Subject: {email['subject']}
Body: {email['body'][:1000] or email['snippet']}
---
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an email assistant. Summarize each email concisely. "
                    "Return a JSON object with a single key 'emails' containing an array. "
                    "Each item must have: index (int), from (string), subject (string), "
                    "date (string), summary (1-2 sentence summary), needs_reply (boolean), "
                    "action_required (string or null)."
                ),
            },
            {"role": "user", "content": f"Summarize these emails:\n{email_text}"},
        ],
    )

    try:
        data = json.loads(response.choices[0].message.content)
        return data.get("emails", data) if isinstance(data, dict) else data
    except Exception:
        return [{"index": i + 1, "summary": "Could not parse summary."} for i in range(len(emails))]
