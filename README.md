# Growthwapi

> WhatsApp Business Automation SaaS Platform

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Meta Developer account (WhatsApp Cloud API)
- Razorpay account (Test mode)

---

## 📁 Project Structure

```
Growthwapi/
├── frontend/          # React + Vite + Tailwind CSS
├── backend/           # Node.js + Express API
├── supabase/          # Database schema SQL
│   └── schema.sql     # Run this in Supabase SQL Editor
└── public/            # Logo and public assets
```

---

## ⚡ Setup Instructions

### 1. Database Setup (Supabase)
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon key** from Settings → API

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Fill in your values
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env   # Fill in your values
npm run dev
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Where to get it |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase → Settings → API |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID | Meta Developer → WhatsApp → API Setup |
| `WHATSAPP_ACCESS_TOKEN` | Meta API access token | Meta Developer → WhatsApp → API Setup |
| `WHATSAPP_WABA_ID` | WhatsApp Business Account ID | Meta Business Manager |
| `WHATSAPP_VERIFY_TOKEN` | Any random string for webhook verification | You choose |
| `RAZORPAY_KEY_ID` | Razorpay test key ID | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay test key secret | Razorpay Dashboard → Settings → API Keys |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Same as backend SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | Same as backend SUPABASE_ANON_KEY |
| `VITE_API_URL` | Backend URL (default: http://localhost:5000) |
| `VITE_RAZORPAY_KEY_ID` | Same Razorpay key ID |

---

## 💰 Pricing Plans

| Plan | Price | Utility Quota | Marketing Quota |
|---|---|---|---|
| Starter | ₹999/mo | 1,000 msg | 500 msg |
| Growth | ₹2,999/mo | 5,000 msg | 2,000 msg |
| Pro | ₹7,999/mo | 20,000 msg | 10,000 msg |

**Overage rates** (when quota exceeded):
- Utility: ₹0.25/message
- Marketing: ₹1.75/message

**Free Trial**: 4 days with full Pro-level access

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/api/whatsapp/send` | Send a WhatsApp message |
| POST | `/api/whatsapp/broadcast` | Send to multiple numbers |
| GET | `/api/whatsapp/webhook` | Webhook verification |
| POST | `/api/whatsapp/webhook` | Receive incoming messages |
| GET | `/api/wallet/balance` | Get wallet balance & usage |
| POST | `/api/payments/create-subscription-order` | Create subscription payment |
| POST | `/api/payments/create-wallet-order` | Create wallet recharge |
| POST | `/api/payments/verify-payment` | Verify & confirm payment |
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update user profile |
| GET | `/api/users/trial-status` | Check trial status |

---

## 🎨 Theme Customization

Colors are centrally defined in `frontend/tailwind.config.js`:

```js
colors: {
  brand: {
    blue: '#1E3A8A',    // Primary (logo 'Growth' text color)
    orange: '#F97316',  // Accent (logo 'wapi' text color)
    purple: '#7C3AED',  // Secondary (rocket trail)
    light: '#EFF6FF',   // Background tint
    dark: '#0F172A',    // Text color
  }
}
```

To update the color palette, change only this file — all components use `brand-*` Tailwind classes.

---

## 🔗 WhatsApp Webhook Setup

1. Deploy your backend to a public URL
2. In Meta Developer Console → WhatsApp → Configuration:
   - Callback URL: `https://your-domain.com/api/whatsapp/webhook`
   - Verify Token: Same as `WHATSAPP_VERIFY_TOKEN` in your `.env`
3. Subscribe to: `messages`, `message_status_updates`

---

## 📦 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6
- **Backend**: Node.js, Express, Axios
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Razorpay (Test Mode)
- **WhatsApp**: Meta Cloud API v18.0
