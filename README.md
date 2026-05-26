# MailSetu — Automated Email Sender

> A full-stack desktop email automation tool with a modern dark UI, rich text editor, bulk sending, scheduling, and detailed logs.

---

## 🗂 Project Structure

```
MailSetu/
├── backend/               # Python FastAPI backend
│   ├── api/routers/       # Route handlers (auth, emails, templates, schedule, uploads)
│   ├── core/              # Config, DB, security, rate limiter
│   ├── models/            # SQLAlchemy ORM models
│   ├── schemas/           # Pydantic request/response schemas
│   ├── services/          # SMTP, scheduler, CSV, file services
│   ├── main.py            # FastAPI app entrypoint
│   └── requirements.txt
├── frontend/              # React + Vite + Tailwind + Tiptap
│   └── src/
│       ├── components/    # Sidebar, RichTextEditor, DropZone
│       ├── contexts/      # AuthContext
│       ├── lib/           # api.ts (Axios), utils.ts
│       └── pages/         # Login, Dashboard, Send, Bulk, Templates, Logs, Schedule
├── database/              # SQLite DB (auto-created)
├── logs/                  # Log files
├── templates/             # (reserved for HTML template exports)
├── uploads/               # Attachment staging
├── .env                   # Environment config
└── sample_contacts.csv    # Sample CSV for bulk send
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Gmail account with 2FA enabled + App Password

### 1. Backend Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # Linux/Mac

# Install dependencies
pip install -r backend/requirements.txt

# Start backend (from project root)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔐 Gmail App Password Setup

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification (enable if not already)
3. Search "App passwords" → Create one named "MailSetu"
4. Copy the 16-character password → paste in login screen

---

## 📧 Features

| Feature | Description |
|---|---|
| **Login** | Gmail + App Password with SMTP verification |
| **Send Email** | Single email with CC/BCC, rich HTML, attachments |
| **Bulk Send** | CSV upload → personalized emails with `{{variables}}` |
| **Templates** | Create/edit/delete reusable email templates |
| **Scheduler** | Schedule emails for future delivery via APScheduler |
| **Logs** | Full send history with status, retries, error details |
| **Rate Limiting** | Token bucket — max 20 emails/minute (configurable) |
| **Retry Logic** | 3 retries with exponential backoff on failure |

---

## 📋 CSV Format

```csv
email,name,company,position,custom1
john@example.com,John Doe,Acme,CEO,VIP
```

Use `{{name}}`, `{{company}}` etc. in email subject/body for personalization.

---

## ⚙️ Environment Variables (`.env`)

| Key | Default | Description |
|---|---|---|
| `SECRET_KEY` | `mailsetu-super-secret-key` | App secret |
| `DATABASE_URL` | `sqlite+aiosqlite:///./database/mailsetu.db` | DB path |
| `HOST` | `127.0.0.1` | Backend host |
| `PORT` | `8000` | Backend port |
| `RATE_LIMIT_PER_MINUTE` | `20` | Max emails per minute |
| `MAX_RETRIES` | `3` | SMTP retry attempts |
| `RETRY_DELAY` | `2` | Base retry delay (seconds) |

---

## 📦 Packaging with PyInstaller

```bash
pip install pyinstaller
# Build frontend first
cd frontend && npm run build && cd ..

# Bundle backend + frontend
pyinstaller mailsetu.spec
```

The `dist/mailsetu.exe` will be a standalone executable.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login with email + app password |
| GET | `/auth/me` | Get current account |
| POST | `/emails/send` | Send single email |
| POST | `/emails/bulk` | Bulk send from contacts list |
| GET | `/emails/logs` | Get email logs |
| GET | `/emails/stats` | Get send statistics |
| POST | `/emails/parse-csv` | Parse CSV file |
| GET | `/templates/` | List templates |
| POST | `/templates/` | Create template |
| PUT | `/templates/{id}` | Update template |
| DELETE | `/templates/{id}` | Delete template |
| POST | `/schedule/` | Schedule an email |
| GET | `/schedule/` | List scheduled emails |
| DELETE | `/schedule/{job_id}` | Cancel scheduled email |
| POST | `/uploads/` | Upload attachments |

Full interactive docs: **http://localhost:8000/docs**
