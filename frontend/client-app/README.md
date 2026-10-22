# Agrivet Mobile

A single professional Expo + React Native mobile application for Agrivet supporting two roles:

- **AGENT** — manages their assigned customers and creates customer bookings
- **BRANCH** — orders inventory and tracks their branch orders

Built with **Expo SDK 51 + React Native + TypeScript + NativeWind (Tailwind CSS)** and a **shadcn/ui-inspired reusable component system**.

The app detects the authenticated user's role and renders only the screens, navigation, data, and actions appropriate for that role.

---

## Quick start

```bash
# 1. install dependencies (Expo will pin compatible versions)
npm install
# or, to align every library to your Expo SDK version:
npx expo install

# 2. start the dev server (QR code appears in the terminal)
npm start

# 3. scan the QR with the Expo Go app on your phone
#    OR press a/i/w to open Android emulator, iOS simulator, or web
```

### Platform-specific

```bash
npm run android    # Android emulator / connected device
npm run ios        # iOS simulator (macOS only)
npm run web        # Web (browser)
```

### Type-check & lint

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

---

## Demo accounts

Authentication is handled by the real backend API (`api/`) — there is no mock auth.
The backend seed creates these accounts (all pre-verified):

| Role        | Email                 | Password           |
| ----------- | --------------------- | ------------------ |
| SUPER_ADMIN | `admin@agrivet.local` | `StrongPass!2026`  |
| AGENT       | `agent@agrivet.local` | `StrongPass!2026`  |
| BRANCH      | `branch@agrivet.local`| `StrongPass!2026`  |

> The seeded password is controlled by `SEED_ADMIN_PASSWORD` in `api/.env`.

New accounts created through the app start **unverified** and cannot sign in until
the email address is confirmed. See [Authentication & email verification](#authentication--email-verification).

---

## Features

### Common

- Role-aware navigation (Agent vs Branch)
- Authenticated session stored locally via AsyncStorage
- Modern, minimalist, professional mobile UI
- Loading, empty, and error states everywhere
- Confirmation dialogs on submit
- Persistent branch cart

### Agent

- Dashboard — customers, bookings, pending/processing/completed counts, recent bookings
- My Customers — search, list, view, add
- Customer details — full profile + booking history
- Add Customer — automatic assignment to the currently logged-in agent
- My Bookings — search + status filter
- Create Booking — multi-step (Customer → Products → Review) with quantity + subtotal
- Booking Details — items, total, status, timeline, assigned admin
- Profile — sign out, permissions summary

### Branch

- Dashboard — products, orders, pending/processing/ready/completed counts, recent orders
- Inventory — search + category filter + product cards
- Product Details — image, description, stock, quantity selector (capped at stock)
- Create Order — cart (persisted locally) → review → submit
- My Orders — search + status filter
- Order Details — items, total, status, timeline, assigned admin
- Profile — sign out, permissions summary

---

## Authentication & email verification

The app uses email + password authentication against the backend API in `api/`.
Google sign-in has been removed; there is no social login.

### Flow

1. **Register** (`Register` screen) → `POST /api/v1/auth/register`.
   The backend creates the account with `emailVerified = null` and emails a
   six-digit, time-limited, single-use verification code.
2. **Verify email** (`VerifyEmail` screen) → `POST /api/v1/auth/verify-email`
   with `{ email, code }`. Codes expire (`EMAIL_VERIFICATION_TTL`, default 10
   minutes), allow five attempts, are single-use, and are stored only as an
   argon2 hash.
3. **Success** (`VerificationSuccess` screen) → the user returns to Login.
4. **Login** (`Login` screen) → `POST /api/v1/auth/login`.
   The session is issued as an **HTTP-only cookie**; unverified accounts receive
   `403 EMAIL_NOT_VERIFIED` and can resend the verification code from the login
   screen.
5. **Protected screens** are only reachable once the user is authenticated *and*
   verified. The backend also rejects any authenticated request from an
   unverified account, so the check cannot be bypassed by calling the API
   directly.

`VerificationFailure` handles invalid, expired, locked-out, and already-verified
codes, and offers "Request a new code" / "Try again".

### Frontend environment

Create `frontend/client-app/.env`:

```bash
# Backend API base URL (iOS simulator / web)
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
# Android emulator: use http://10.0.2.2:4000/api/v1
# Physical device:  use http://<your-LAN-IP>:4000/api/v1
```

No secrets belong in the app — the Gmail SMTP credentials never leave the backend.

### Backend environment (`api/.env`)

```bash
NODEMAIL_USER="your-gmail@gmail.com"
NODEMAIL_PASS="your-16-character-gmail-app-password"
NODEMAIL_FROM_NAME="Agrivet Supply"
EMAIL_VERIFICATION_TTL=10m              # 5m, 10m, 30m, 1h, ...
CORS_ORIGIN="http://localhost:8081,http://127.0.0.1:8081,http://localhost:5173"
```

> `CORS_ORIGIN` must include the origin the app is served from (Expo web defaults
> to `http://localhost:8081`). In development the API also allows the default
> Expo origins automatically; production only uses `CORS_ORIGIN`.

### Gmail SMTP setup

1. Enable **2-Step Verification** on the Google account.
2. Create an **App Password** (<https://myaccount.google.com/apppasswords>) and
   set `NODEMAIL_PASS` to it. Do not use the account's normal password.
3. Set `NODEMAIL_USER` to the Gmail address. Verification emails are sent from
   that address, with `NODEMAIL_FROM_NAME` as the display name.
4. Restart the API after changing environment variables.

> Delivery failures are logged without the verification token or link, so log
> files cannot be used to verify an account. The user can request a resend from
> the app.

### Auth endpoints

| Method | Path                              | Purpose                              |
| ------ | --------------------------------- | ------------------------------------ |
| POST   | `/api/v1/auth/register`           | Create account + send verification   |
| POST   | `/api/v1/auth/login`              | Sign in (verified accounts only)     |
| POST   | `/api/v1/auth/logout`             | Revoke session + clear cookie        |
| GET    | `/api/v1/auth/me`                 | Current user (protected)             |
| POST   | `/api/v1/auth/verify-email`       | Verify using an email + six-digit code |
| POST   | `/api/v1/auth/verify-email/resend`| Resend the verification code         |

Rate limits: login 20 / 15 min, register 10 / hour, verification 30 / 15 min,
resend 5 / hour (per IP + email).

---

## Project structure

```
client-app/
├── app.json                   # Expo config
├── babel.config.js            # babel-preset-expo + nativewind/babel + reanimated
├── metro.config.js            # expo/metro-config
├── tailwind.config.js         # NativeWind / Tailwind theme
├── tsconfig.json              # extends expo/tsconfig.base
├── nativewind-env.d.ts
├── index.js                   # registerRootComponent(App)
├── App.tsx                    # AppProviders + RootNavigator
├── assets/                    # icon, splash, adaptive-icon, favicon
└── src/
    ├── app/
    │   ├── navigation/        # root, agent, branch navigators + types
    │   └── providers.tsx
    │
    ├── components/
    │   ├── ui/                # primitives (Button, Input, Card, Badge, Text,
    │   │                      #  Select, SearchInput, Avatar, Divider, SectionHeader)
    │   └── shared/            # domain components (StatusBadge, StatusTimeline,
    │                          #  ProductCard, CustomerCard, BookingCard, OrderCard,
    │                          #  QuantitySelector, OrderSummary, EmptyState,
    │                          #  LoadingState, ErrorState, ConfirmationDialog,
    │                          #  BottomSheet, ScreenHeader, StatCard, InfoRow)
    │
    ├── features/
    │   ├── auth/screens/      # welcome, login, register, verify-email,
    │   │                      #  verification-success, verification-failure
    │   ├── dashboard/         # agent + branch dashboards
    │   ├── profile/screens/   # profile-screen.tsx
    │   ├── agent/
    │   │   ├── customers/screens/
    │   │   └── bookings/screens/ & hooks/
    │   └── branch/
    │       ├── inventory/screens/
    │       └── orders/screens/ & hooks/use-order-cart.tsx
    │
    ├── services/              # API layer + mock data
    │   ├── auth.service.ts
    │   ├── customer.service.ts
    │   ├── booking.service.ts
    │   ├── product.service.ts
    │   ├── branch-order.service.ts
    │   ├── directory.service.ts
    │   └── mock/              # seed data
    │
    ├── hooks/                 # use-auth.tsx, use-role.ts
    ├── constants/             # APP_NAME, storage keys, network delay
    ├── lib/utils.ts           # cn, formatCurrency, formatDate, relativeTime, sleep
    ├── types/                 # role, auth, agent, branch, customer, product, ...
    └── global.css             # tailwind base
```

---

## Architecture notes

- **Feature-based**: every domain owns its own screens, components, hooks, and services.
- **UI vs business logic**: services (`src/services/`) own all data access; screens only render and dispatch.
- **Reusable components**: `components/ui` and `components/shared` are the only place visual primitives live; screens compose them.
- **Backend ownership enforcement**: every service scopes reads/writes to the current authenticated user/branch. The frontend never filters away ownership — the API service does it.
- **Single workflow for transactions**: both customer bookings and branch orders go through the same status pipeline (`PENDING → ACCEPTED → ASSIGNED → PROCESSING → READY → COMPLETED`, with `REJECTED` from `PENDING`).
- **Role isolation**: the root navigator mounts `AgentNavigator` for agents and `BranchNavigator` for branches. There is no cross-role data access.

---

## Adding app icons

Drop the following PNGs into `assets/`:

- `icon.png` (1024×1024)
- `splash.png` (1242×2436)
- `adaptive-icon.png` (1024×1024)
- `favicon.png` (48×48)

Until you provide them, Expo will show a default placeholder icon.

---

## Connecting a real backend

The services under `src/services/*` are the only place that talks to data. Replace each function with a `fetch`/REST call to your backend. The shapes already match the existing client-web data model, so swapping in a real backend should not require screen changes.
