# Bangar Bhavan Chats - Ultra-Fast PWA POS Billing System

A production-ready, hyper-optimized Progressive Web App (PWA) POS Billing solution built specifically for **Bangar Bhavan Chats** fast-food counter operations.

Designed with a single core principle: **MAXIMUM OPERATIONAL SPEED**. The counter operator never requires more than 2 to 3 taps for any action.

---

## 🌟 Core Highlights & Architectural Principles

- **Single Counter Optimized**: No waiters, no tables, no KOT complexity, no GST bloat — pure billing speed.
- **Ultra-Fast 2-3 Tap Billing**: Large touch targets, quick item quantity increment/decrement buttons (`+` / `-`), long-press card resets, and instant bill generation under 100ms.
- **Horizontal List View & Grid View**: Layout switcher allowing counter operators to toggle between traditional card grid and compact horizontal list view mode.
- **Dual Fulfillment Status Sections**: Dedicated visible stacked sections for **PENDING TO SERVE** (with real-time kitchen prep item counters and 1-tap "MARK AS SERVED") and **SERVED COMPLETE** (with fulfillment timestamps).
- **Thermal Receipt Print Preview Modal**: On-screen preview styled after authentic 58mm/80mm thermal receipts with 1-click Web Bluetooth printing and text download.
- **Direct Web Bluetooth ESC/POS Printing**: Streams binary ESC/POS thermal receipt commands directly from the browser (`navigator.bluetooth`) to thermal receipt printers without third-party drivers.
- **Offline-First PWA & Auto-Sync**: Service Worker asset caching (`sw.js`) and IndexedDB local transaction logs for 100% offline billing with automatic background queue sync when internet connectivity returns.
- **30-Day Auto-Data Archiving Engine**: Automatically moves data older than 30 days into structured JSON/CSV archives to keep main billing and dashboard metrics performing at top speed, with 1-click restore capabilities.
- **Multi-Tenant Ready SaaS Architecture**: Isolated tenant models, decoupled shop branding/settings, and structured Prisma ORM for future scaling to thousands of QSR food shops.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS with custom warm Indian food palette tokens (`#FFFCF7` Fresh Cream, `#B91C1C` Premium Red, `#FEF08A` Soft Yellow, `#3C1503` Dark Brown)
- **PWA & Offline**: Custom Service Worker + IndexedDB menu caching & offline transaction queue (`lib/db.ts`)
- **Printing**: Direct Web Bluetooth ESC/POS binary encoder (`lib/escpos.ts`)
- **Audio Feedback**: Web Audio API synthesizer for tactile tap, success chime, and error tones (`lib/sound.ts`)
- **Data Visualization**: Recharts for business analytics & hourly velocity charts

### Backend
- **Framework**: Node.js + Express + TypeScript
- **ORM & Database**: Prisma ORM with SQLite (100% PostgreSQL ready via environment variable change)
- **Authentication**: JWT authentication with bcrypt password hashing
- **Security**: Helmet CSP headers, CORS origin protection, Express Rate Limiter, sanitized input validation

---

## 📁 Repository Folder Structure

```
billing/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Prisma ORM models (Tenant, User, MenuItem, Order, Settings, Archive)
│   │   └── dev.db               # SQLite database
│   ├── src/
│   │   ├── config/              # App port (5005), JWT secrets, environment constants
│   │   ├── controllers/         # Auth, Menu, Order, History, Dashboard, Settings, Archive
│   │   ├── middleware/          # JWT Auth, Rate limiter, Error handler
│   │   ├── repositories/        # Prisma Data Access Layer
│   │   ├── routes/              # Express API endpoints
│   │   ├── services/            # Auto-Archive service logic
│   │   ├── utils/               # Database seed script (Default Admin & Fast-Food Menu)
│   │   ├── app.ts               # Express configuration & security
│   │   └── server.ts            # Server boot script
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   │   ├── manifest.json        # PWA Manifest configuration
│   │   ├── sw.js                # Custom PWA Service Worker
│   │   └── favicon.svg          # BBC POS branding icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── billing/         # DishCard, MenuGrid, RunningBill, PendingOrdersBar
│   │   │   ├── common/          # ReceiptPreviewModal
│   │   │   └── layout/          # Header, Navbar
│   │   ├── context/             # AuthContext, PrinterContext, SyncContext
│   │   ├── lib/                 # ESC/POS binary encoder, IndexedDB helper, Web Audio sound
│   │   ├── pages/               # Login, Billing, Dashboard, History, MenuManagement, Settings
│   │   ├── types/               # TypeScript interfaces DTOs
│   │   ├── App.tsx              # React router setup
│   │   ├── index.css            # Tailwind & warm food design system
│   │   └── main.tsx             # React entry point
│   ├── package.json
│   ├── tailwind.config.js       # Color palette design tokens
│   └── vite.config.ts           # Vite proxy & PWA configuration
├── docker-compose.yml           # Production Docker setup
├── vercel.json                  # Vercel deployment configuration
├── package.json                 # Root script runner (Concurrently)
└── README.md                    # System documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher

### Running Development Environment

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Backend & Frontend Concurrently**:
   ```bash
   npm run dev
   ```

   This automatically launches:
   - **Frontend PWA POS**: [http://localhost:3000/](http://localhost:3000/)
   - **Backend API Server**: [http://localhost:5005/](http://localhost:5005/)

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`

---

## 🔑 Key Keyboard Shortcuts (Billing Screen)

| Shortcut | Action |
|---|---|
| `Ctrl + Enter` | Instant Generate Bill |
| `Esc` | Clear Current Running Bill |
| `P` | Toggle Parcel Packing Charge (+₹5) |
| `Long Press Card` | Reset Dish Quantity to 0 |

---

## 📊 Database Schema Summary (Prisma ORM)

- **`Tenant`**: Multi-tenant isolation record (`id`, `name`, `slug`).
- **`User`**: Admin account (`username`, `password` hash, `tenantId`, `role`).
- **`MenuItem`**: Dish records (`name`, `price`, `category`, `displayOrder`, `isActive`, `isFavorite`).
- **`Order`**: Billing records (`invoiceNo`, `subtotal`, `parcelCharge`, `grandTotal`, `paymentMode`, `status`, `isParcel`, `createdAt`, `servedAt`).
- **`OrderItem`**: Line items per bill (`name`, `price`, `quantity`, `dishId`).
- **`Settings`**: Shop parameters (`shopName`, `address`, `phone`, `footerText`, `parcelCharge`, `currency`).
- **`Archive`**: Periodical order archives older than 30 days (`periodLabel`, `orderCount`, `totalAmount`, `jsonData`).

---

## 🌐 API Architecture Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate admin user, returns JWT |
| `GET` | `/api/v1/auth/me` | Validate session token |
| `GET` | `/api/v1/menu` | List dishes |
| `POST` | `/api/v1/menu` | Create new dish |
| `PUT` | `/api/v1/menu/:id` | Update dish price/status |
| `DELETE` | `/api/v1/menu/:id` | Delete dish |
| `PUT` | `/api/v1/menu/reorder` | Reorder dishes display sequence |
| `POST` | `/api/v1/orders` | Create completed/pending bill |
| `GET` | `/api/v1/orders/pending` | Fetch live pending food prep orders |
| `PATCH` | `/api/v1/orders/:id` | Update order status (`SERVED`) |
| `GET` | `/api/v1/history` | Paginated historical orders with filters |
| `GET` | `/api/v1/history/export` | Export orders to CSV |
| `DELETE` | `/api/v1/history/:id` | Void/delete bill record |
| `GET` | `/api/v1/dashboard` | Retrieve revenue charts & business KPIs |
| `GET` | `/api/v1/settings` | Get shop receipt parameters |
| `PUT` | `/api/v1/settings` | Update shop receipt parameters |
| `POST` | `/api/v1/archive/trigger` | Trigger 30-day auto-archiving job |
| `GET` | `/api/v1/archive` | List saved data archives |
| `GET` | `/api/v1/archive/:id/export` | Download archive in JSON/CSV format |
| `POST` | `/api/v1/archive/:id/restore` | Restore archive period back to live DB |

---

## 🚢 Deployment Guide

### Frontend (Vercel)
Deploy `frontend/` to Vercel using the included `vercel.json`. Set environment variable for API endpoint.

### Backend (Railway / Render)
Deploy `backend/` to Railway or Render. Set `DATABASE_URL` and `JWT_SECRET` in production environment variables.

### Docker Containerization
Run full production stack via Docker Compose:
```bash
docker-compose up --build -d
```
