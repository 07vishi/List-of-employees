# Odoo Employee List

Expo React Native app for the internship employee list tasks.

Task S2 adds Expo Router navigation, a login route, bottom tabs, and a mocked
FlatList of collaborators.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example` and fill in:

```env
ODOO_URL=
ODOO_DB=
ODOO_USERNAME=
ODOO_PASSWORD=
API_TIMEOUT=10000
```

## Run

```bash
npx expo start -c
```

Scan the QR code with Expo Go.

## What It Does

- Uses Expo Router with Stack and Tabs navigation
- Redirects `/` to `/login`
- Navigates from login to Home with `router.replace('/(tabs)/home')`
- Shows 6 mocked collaborators in a performant FlatList
- Uses a reusable `EmployeeCard` component
- Includes a simple Profile tab with the logged-in email
