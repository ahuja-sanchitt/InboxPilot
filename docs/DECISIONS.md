# Decision Log

A running record of meaningful choices made while building this project, with
the options considered and the tradeoffs behind each. Read this instead of
scrolling chat history.

**How to read this:** newest decisions at the bottom. Entries are never edited
or deleted. If a decision is reversed, the old entry's **Status** points to the
newer entry that replaced it.

---

## D-001 — Stateless backend (no database)

- **Date:** 2026-06-03
- **Phase / area:** Backend architecture
- **Status:** Accepted
- **Decision:** Store nothing server-side — all data is fetched live from Gmail API per request using the user's token.

**Options considered:**

| Option | Tradeoff |
| --- | --- |
| **Stateless (no DB)** ✅ | Zero storage costs, no data privacy risk, simpler infra — but no history or caching |
| SQLite/Postgres | Could cache emails and store history — but adds complexity, cost, and data responsibility |

**Why chosen:** User explicitly wanted a "one-time fun thing" — log in, use it, done. No need to store anything.

---

## D-002 — OAuth token stored in httponly cookie

- **Date:** 2026-06-03
- **Phase / area:** Backend / Auth
- **Status:** Accepted
- **Decision:** After Google OAuth callback, encode the access + refresh token as base64 JSON and store it in an httponly cookie (max_age=3600).

**Options considered:**

| Option | Tradeoff |
| --- | --- |
| **httponly cookie** ✅ | XSS-safe, automatic browser sending, no JS access — but limited to 1hr, requires same-site setup |
| localStorage | Simple but vulnerable to XSS — any script can read the token |
| Server-side session + DB | Most secure — but requires a database, contradicts D-001 |

**Why chosen:** Best security without needing a database. Pairs with the stateless architecture.

---

## D-003 — Tailwind CSS v4 with Vite plugin (not PostCSS)

- **Date:** 2026-06-06
- **Phase / area:** Frontend / Styling
- **Status:** Accepted
- **Decision:** Use `@tailwindcss/vite` as a Vite plugin instead of the PostCSS-based Tailwind v3 setup.

**Options considered:**

| Option | Tradeoff |
| --- | --- |
| **Tailwind v4 + `@tailwindcss/vite`** ✅ | No config file needed, faster builds, `@import "tailwindcss"` in CSS — but breaking change from v3 |
| Tailwind v3 + PostCSS | Familiar setup, more community examples — but slower and requires `tailwind.config.js` + `postcss.config.js` |

**Why chosen:** Vite plugin approach is the correct v4 pattern. PostCSS setup caused styles not to apply at all.

---

## D-004 — Unpinned version constraints for pydantic and anthropic

- **Date:** 2026-06-06
- **Phase / area:** Backend / Dependencies
- **Status:** Accepted
- **Decision:** Use `pydantic>=2.13.0` and `anthropic>=0.105.0` instead of pinned versions.

**Options considered:**

| Option | Tradeoff |
| --- | --- |
| **Unpinned (`>=`)** ✅ | Picks up compatible wheels for Python 3.14.4, avoids source build failures |
| Pinned (e.g. `pydantic==2.5.0`) | Reproducible builds — but older versions had no pre-built wheel for Python 3.14.4, causing `pydantic-core` build failure |

**Why chosen:** Python 3.14.4 is too new for pinned older wheels. Unpinned pulls the latest compatible release that ships a pre-built wheel.

---

## D-005 — Render for hosting (frontend + backend)

- **Date:** 2026-06-06
- **Phase / area:** Deployment
- **Status:** Accepted
- **Decision:** Host frontend on Render Static Sites and backend on Render Web Services (free tier).

**Options considered:**

| Option | Tradeoff |
| --- | --- |
| **Render** ✅ | $0/month free tier for both static and web services, supports Python, simple deploy from GitHub |
| Vercel + Railway | Vercel is better for frontend but Railway has no free tier; split providers add complexity |
| Heroku | Familiar but no free tier since 2022 |

**Why chosen:** Single provider, genuinely free tier for both services, straightforward GitHub integration.

---

## D-006 — Gmail MCP server built alongside the web app

- **Date:** 2026-06-14
- **Phase / area:** Product / Architecture
- **Status:** Accepted
- **Decision:** Build a separate `gmail-mcp/` MCP server in the same repo alongside the InboxPilot web app, rather than replacing it.

**Options considered:**

| Option | Tradeoff |
| --- | --- |
| **MCP alongside web app** ✅ | Two distinct products — web app is shareable, MCP is a personal Claude Desktop tool |
| Replace web app with MCP | Simpler, fewer moving parts — but throws away existing work and limits to personal use only |

**Why chosen:** Different use cases. Web app = shareable product. MCP = personal productivity tool for Claude Desktop users. Both reuse the same Gmail API logic.

---

## D-007 — Desktop app OAuth client type for MCP (not Web application)

- **Date:** 2026-06-14
- **Phase / area:** MCP / Auth
- **Status:** Accepted
- **Decision:** Use a "Desktop app" OAuth 2.0 client in Google Cloud Console for the MCP server's auth flow.

**Options considered:**

| Option | Tradeoff |
| --- | --- |
| **Desktop app** ✅ | Allows any localhost port automatically — required for `InstalledAppFlow.run_local_server(port=0)` |
| Web application | Requires exact redirect URI — `run_local_server` picks a random port each time, causing `redirect_uri_mismatch` |

**Why chosen:** Web application type caused `Error 400: redirect_uri_mismatch` because the random port couldn't be pre-registered. Desktop app type is the correct choice for locally-run OAuth flows.

---

## D-008 — claude-sonnet-4-6 for email summarization

- **Date:** 2026-06-06
- **Phase / area:** Backend / AI
- **Status:** Accepted
- **Decision:** Use `claude-sonnet-4-6` for inbox summarization and triage in both the web app and MCP server.

**Options considered:**

| Option | Tradeoff |
| --- | --- |
| **claude-sonnet-4-6** ✅ | Strong reasoning, fast, cost-effective for repeated inbox calls |
| claude-opus-4-8 | More capable but ~5× more expensive per token — overkill for email summarization |
| claude-haiku-4-5 | Cheapest and fastest — but may miss nuance in triage and action detection |

**Why chosen:** Best balance of quality and cost for the summarization task. Email triage needs real reasoning but not Opus-level capability.

---
