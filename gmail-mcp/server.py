import json
from mcp.server.fastmcp import FastMCP
import gmail_client

mcp = FastMCP("Gmail InboxPilot")


@mcp.tool()
def list_emails(count: int = 10) -> str:
    """List recent emails from your inbox, rendered as a clean visual table."""
    emails = gmail_client.list_emails(count)
    return json.dumps({
        "emails": emails,
        "render_instructions": (
            "Render this as a clean markdown table — no raw JSON:\n\n"
            "## 📧 Recent Inbox\n"
            "| # | From | Subject | Date | Preview |\n"
            "|---|------|---------|------|---------|\n"
            "Fill in each row. Truncate subject at 45 chars, preview (snippet) at 60 chars. "
            "Format date as 'Jun 6' style. "
            "End with: `[count] emails shown`"
        ),
    }, indent=2)


@mcp.tool()
def get_email(message_id: str) -> str:
    """Get the full content of an email by its message ID."""
    return json.dumps(gmail_client.get_email_body(message_id), indent=2)


@mcp.tool()
def get_thread(thread_id: str) -> str:
    """Get all messages in an email thread. Use this before drafting a reply so you have full context."""
    return json.dumps(gmail_client.get_thread(thread_id), indent=2)


@mcp.tool()
def search_emails(query: str, count: int = 10) -> str:
    """Search emails using Gmail search syntax. Examples: 'from:boss@co.com is:unread', 'subject:invoice after:2024/01/01'"""
    return json.dumps(gmail_client.search_emails(query, count), indent=2)


@mcp.tool()
def triage_inbox(count: int = 20) -> str:
    """
    Fetch recent emails and return a beautifully formatted inbox triage report.
    Claude will categorize emails and render a visual dashboard with priority indicators,
    action items, and a summary — not raw JSON.
    """
    emails = gmail_client.list_emails(count)
    return json.dumps({
        "emails": emails,
        "render_instructions": (
            "Present this as a visual inbox triage report using markdown. "
            "Structure it exactly like this:\n\n"
            "---\n"
            "## 📬 Inbox Triage — [today's date]\n"
            "`[count] emails scanned`\n\n"
            "### 🔴 Needs Reply\n"
            "| # | From | Subject | Suggested Action |\n"
            "|---|------|---------|------------------|\n"
            "| 1 | name@email.com | Subject line | Reply with X |\n\n"
            "### 🟡 Action Required\n"
            "| # | From | Subject | Action |\n"
            "|---|------|---------|--------|\n"
            "| 1 | name@email.com | Subject line | Do X by [date] |\n\n"
            "### 🟢 FYI Only\n"
            "| # | From | Subject |\n"
            "|---|------|---------|--\n"
            "| 1 | name@email.com | Subject line |\n\n"
            "---\n"
            "**Summary:** X need replies · X need action · X are FYI\n"
            "💡 _Tip: Say 'draft a reply to #1' to get started._\n"
            "---\n\n"
            "Use emojis in the section headers. Keep subject lines short (truncate at 50 chars). "
            "Infer action deadlines from the email snippet where possible. "
            "Do NOT output raw JSON — only output the formatted report."
        ),
    }, indent=2)


@mcp.tool()
def summarize_emails(count: int = 10) -> str:
    """
    Fetch the last N emails with full body and return a visual summary of each one.
    Great for a quick morning catch-up — one paragraph per email, key points only.
    """
    emails = gmail_client.list_emails_with_body(count)
    return json.dumps({
        "emails": emails,
        "render_instructions": (
            "Render a visual email summary report — no raw JSON:\n\n"
            "## 🗞️ Email Summary\n"
            "`[count] emails · [today's date]`\n\n"
            "For each email, output a card like this:\n\n"
            "---\n"
            "**[#] [Subject]**  \n"
            "📨 From: [sender name] · 🗓️ [date in 'Jun 6' format]\n\n"
            "> [2-3 sentence summary of the email content. Be specific — mention names, numbers, deadlines if present.]\n\n"
            "End with a one-line **TL;DR** in bold.\n\n"
            "---\n\n"
            "After all cards, add:\n"
            "**Overall:** [1-2 sentences on the general theme of the inbox today]\n\n"
            "Keep each summary tight. No filler. Prioritize actionable info."
        ),
    }, indent=2)


@mcp.tool()
def categorize_emails(count: int = 10) -> str:
    """
    Fetch the last N emails and split them into Important and Not Important.
    Important = anything requiring attention, decisions, replies, or time-sensitive info.
    Not Important = newsletters, promos, automated notifications, receipts.
    """
    emails = gmail_client.list_emails(count)
    return json.dumps({
        "emails": emails,
        "render_instructions": (
            "Categorize these emails into Important and Not Important — render as markdown, no raw JSON:\n\n"
            "## 📊 Email Categorization\n"
            "`[count] emails scanned · [today's date]`\n\n"
            "### ⭐ Important\n"
            "| # | From | Subject | Why it matters |\n"
            "|---|------|---------|----------------|\n"
            "Fill rows. 'Why it matters' = one short reason (e.g. 'Deadline Friday', 'From your manager', 'Payment due').\n\n"
            "### 🗑️ Not Important\n"
            "| # | From | Subject |\n"
            "|---|------|---------|--\n"
            "Fill rows.\n\n"
            "---\n"
            "**[X] important · [Y] not important**  \n"
            "💡 _Say 'summarize the important ones' or 'draft a reply to #1' to continue._\n\n"
            "Be decisive — if something could go either way, put it in Important."
        ),
    }, indent=2)


@mcp.tool()
def send_email(to: str, subject: str, body: str) -> str:
    """Send a single email."""
    return json.dumps(gmail_client.send_email(to, subject, body))


@mcp.tool()
def create_draft(to: str, subject: str, body: str) -> str:
    """Create a single draft email in Gmail."""
    return json.dumps(gmail_client.create_draft(to, subject, body))


@mcp.tool()
def create_bulk_drafts(subject: str, body: str, recipients: list[str], variables: dict = {}) -> str:
    """
    Create one draft per recipient. Supports {{variable}} placeholders in subject and body.
    Example: subject='Hi {{name}}', variables={'name': 'Alice'} — substitutes for every recipient.
    """
    return json.dumps(gmail_client.bulk_create_drafts(subject, body, recipients, variables), indent=2)


@mcp.tool()
def preview_bulk_send(subject: str, body: str, recipients: list[str], variables: dict = {}) -> str:
    """
    Preview a bulk send without sending anything. Always call this before send_bulk_emails to confirm.
    Returns resolved subject, body preview, and full recipient list.
    """
    resolved_subject = gmail_client.substitute(subject, variables)
    resolved_body = gmail_client.substitute(body, variables)
    return json.dumps({
        "subject": resolved_subject,
        "body_preview": resolved_body[:400] + ("..." if len(resolved_body) > 400 else ""),
        "recipients": recipients,
        "recipient_count": len(recipients),
        "render_instructions": (
            "Render this as a visual send preview — no raw JSON:\n\n"
            "## 📤 Bulk Send Preview\n"
            "| Field | Value |\n"
            "|-------|-------|\n"
            "| **Subject** | [subject] |\n"
            "| **Recipients** | [count] people |\n\n"
            "**Message preview:**\n"
            "> [body_preview]\n\n"
            "**Recipients:**\n"
            "List each email on its own line with a `•` bullet.\n\n"
            "---\n"
            "⚠️ _Reply 'send it' to confirm, or 'cancel' to abort._"
        ),
    }, indent=2)


@mcp.tool()
def send_bulk_emails(subject: str, body: str, recipients: list[str], variables: dict = {}) -> str:
    """
    Send personalized emails to multiple recipients with {{variable}} substitution.
    Call preview_bulk_send first to verify before sending.
    """
    return json.dumps(gmail_client.bulk_send_emails(subject, body, recipients, variables), indent=2)


if __name__ == "__main__":
    mcp.run()
