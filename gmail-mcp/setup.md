# Gmail InboxPilot MCP — Setup

## Prerequisites
- Python 3.10+
- A Google Cloud project with Gmail API enabled

## 1. Download client_secret.json
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → your OAuth 2.0 Client ID → Download JSON
3. Rename the file to `client_secret.json`
4. Place it at: `~/.gmail-mcp/client_secret.json`
   - Windows: `C:\Users\<you>\.gmail-mcp\client_secret.json`
   - Mac/Linux: `~/.gmail-mcp/client_secret.json`

## 2. Install dependencies
```bash
cd gmail-mcp
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

## 3. Add to Claude Code
Run this in your terminal:
```bash
claude mcp add gmail-inboxpilot python /absolute/path/to/gmail-mcp/server.py
```

Or add manually to `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "gmail-inboxpilot": {
      "command": "python",
      "args": ["/absolute/path/to/gmail-mcp/server.py"]
    }
  }
}
```

## 4. First run — authenticate
The first time Claude uses a Gmail tool, a browser window will open for Google OAuth.
Sign in and approve — your token is saved to `~/.gmail-mcp/token.json`.

## Available tools
| Tool | What it does |
|------|-------------|
| `list_emails` | List recent inbox emails |
| `get_email` | Get full email by ID |
| `get_thread` | Get full thread for reply context |
| `search_emails` | Search with Gmail query syntax |
| `triage_inbox` | AI-powered inbox triage |
| `send_email` | Send a single email |
| `create_draft` | Create a single draft |
| `create_bulk_drafts` | Create drafts for many recipients with `{{variables}}` |
| `preview_bulk_send` | Preview bulk send before sending |
| `send_bulk_emails` | Send to many recipients with `{{variables}}` |
