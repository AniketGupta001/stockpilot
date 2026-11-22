# StockPilot — Smart Inventory & Asset Tracking

Full-stack portfolio project: React + Vite frontend, Express + MongoDB backend, JWT authentication, inventory CRUD, stock movements, low-stock alerts, dashboard analytics, and barcode generation.

## Requirements
- Node.js 18+
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Run locally

### 1. Backend
```bash
cd backend
copy .env.example .env
npm install
npm run dev
```
On macOS/Linux use `cp .env.example .env` instead of `copy`.
Edit `.env` if your MongoDB URI differs. Backend runs at `http://localhost:5000`.

### 2. Frontend (open a second terminal)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

### 3. Create your account
Use **Create account** on the sign-in screen. The first registered user becomes `admin`; later users become `staff`.

## API overview
- `POST /api/auth/register`
- `POST /api/auth/login`
- Authenticated: `GET/POST /api/products`
- Authenticated: `PUT/DELETE /api/products/:id`
- Authenticated: `GET /api/products/low-stock`
- Authenticated: `POST /api/stock/:id` with `{ "type": "IN" | "OUT", "quantity": 1, "note": "" }`
- Authenticated: `GET /api/stock/history`
- Authenticated: `GET /api/dashboard`

## Notes
- `.env` is intentionally excluded from version control. Never commit secrets.
- Barcode generation is client-side using JsBarcode; camera-based scanning and physical RFID hardware integration are not included.
- This is a demonstration project. Add production-grade validation, rate limiting, audit controls, and deployment configuration before production use.