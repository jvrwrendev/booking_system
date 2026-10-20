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

The bundled mock service ships with these demo logins (also tappable on the Login screen):

| Role   | Email                          | Password   |
| ------ | ------------------------------ | ---------- |
| AGENT  | `roberto.garcia@agrivet.ph`    | `password` |
| AGENT  | `liza.tan@agrivet.ph`          | `password` |
| BRANCH | `qc@agrivet.ph`                | `password` |
| BRANCH | `cebu@agrivet.ph`              | `password` |
| BRANCH | `davao@agrivet.ph`             | `password` |

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
    │   ├── auth/screens/      # login-screen.tsx
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
