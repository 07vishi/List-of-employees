# Odoo Employee List

Expo React Native app that shows employees from the configured Odoo database.

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

- Logs in to Odoo with `/jsonrpc`
- Reads `hr.employee` records
- Shows employee names, images, emails, phones, job titles, departments, and locations
- Supports search and pull-to-refresh
