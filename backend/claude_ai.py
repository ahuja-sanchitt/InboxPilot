import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


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

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=(
            "You are an email assistant. Summarize each email concisely. "
            "For each email return a JSON array where each item has: "
            "index (int), from (string), subject (string), date (string), "
            "summary (1-2 sentence summary), needs_reply (boolean), "
            "action_required (string or null). "
            "Return ONLY valid JSON, no markdown, no extra text."
        ),
        messages=[{"role": "user", "content": f"Summarize these emails:\n{email_text}"}],
    )

    import json
    try:
        return json.loads(message.content[0].text)
    except Exception:
        return [{"index": i + 1, "summary": "Could not parse summary."} for i in range(len(emails))]
