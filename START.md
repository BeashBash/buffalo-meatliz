# 🥩 Buffalo Meatliz — Quick Start Guide

## Supabase (Database) — Already configured!
- **Project**: `dbyykuyzgjfmsdtyrwzb`
- **URL**: `https://dbyykuyzgjfmsdtyrwzb.supabase.co`
- **Schema**: `buffalo` (all tables isolated from other projects)

---

## Step 1 — Backend Setup

```bash
cd backend

# Copy env file
cp .env.example .env
# Edit .env and add your DATABASE_URL (Supabase connection string)
# You can get it from: Supabase Dashboard → Project Settings → Database → Connection string

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be running at:** http://localhost:8000  
**API Docs:** http://localhost:8000/docs

---

## Step 2 — Frontend Setup

```bash
cd frontend

# Copy env file
cp .env.example .env
# VITE_API_URL should point to your backend

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Frontend will be running at:** http://localhost:3000

---

## Step 3 — Create Admin User

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/dbyykuyzgjfmsdtyrwzb)
2. **Authentication → Users → Invite user** (enter admin email)
3. **SQL Editor** → Run:

```sql
INSERT INTO buffalo.admin_users (email, full_name, role)
VALUES ('your-email@example.com', 'מנהל ראשי', 'admin');
```

4. Login at: http://localhost:3000/admin/login

---

## URLs Summary

| URL | What it is |
|-----|-----------|
| `http://localhost:3000/` | Customer store (Hebrew) |
| `http://localhost:3000/checkout` | Checkout page |
| `http://localhost:3000/track/BUF-01000` | Order tracking |
| `http://localhost:3000/admin/login` | Admin login |
| `http://localhost:3000/admin/dashboard` | Admin dashboard |
| `http://localhost:3000/admin/weigh` | 🔴 Weighing queue |
| `http://localhost:3000/admin/weigh/:id` | Weigh specific order |
| `http://localhost:3000/admin/orders` | All orders |
| `http://localhost:3000/admin/products` | Product management |
| `http://localhost:3000/admin/reports` | Reports |
| `http://localhost:8000/docs` | API documentation |

---

## Order Flow

```
Customer orders → new
    ↓
Admin starts prep → in_preparation
    ↓
Employee weighs all items → weighed (auto)
    ↓
Admin sends payment request → payment_pending + WhatsApp sent
    ↓
Customer pays → paid
    ↓
Order delivered → delivered
```

---

## Production Deployment (baffalo.com)

When ready to deploy to baffalo.com:

**Backend**: Deploy to Railway / Render / VPS
```
DATABASE_URL=<supabase pooler connection string>
JWT_SECRET=<long random secret>
CORS_ORIGINS=https://baffalo.com,https://www.baffalo.com
```

**Frontend**: Deploy to Vercel / Netlify
```
VITE_API_URL=https://api.baffalo.com/api/v1
```

---

## Future Integrations (ready placeholders)

- **WhatsApp**: `backend/app/services/notification_service.py` → `_send_whatsapp()`
- **Digital Scale API**: `backend/app/api/routes/weighing.py` → add endpoint
- **Payment (Cardcom/PayMe)**: `backend/app/services/weighing_service.py` → `send_to_payment()`
- **SMS**: `backend/app/services/notification_service.py` → `_send_sms()`
