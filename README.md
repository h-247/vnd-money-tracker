# VND Money Tracker — Full-Stack Personal Financial Application

A modern, fast, responsive full-stack web application designed for tracking personal finances in Vietnamese Dong (VND). Built on the official **ChatGPT Sites Vinext starter** (React 19 + TypeScript + Vite + Tailwind CSS + Cloudflare Workers D1 Database + Drizzle ORM).

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture & Database Design](#architecture--database-design)
- [Financial Calculation & Integrity Rules](#financial-calculation--integrity-rules)
- [Local Windows Development Guide](#local-windows-development-guide)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Installation](#2-installation)
  - [3. Environment Configuration](#3-environment-configuration)
  - [4. Database Migrations](#4-database-migrations)
  - [5. Running the Local Dev Server](#5-running-the-local-dev-server)
  - [6. Quality Assurance & Testing](#6-quality-assurance--testing)
  - [7. Production Build & Preview](#7-production-build--preview)
- [Deployment to ChatGPT Sites](#deployment-to-chatgpt-sites)
- [Troubleshooting](#troubleshooting)
- [Acceptance Criteria Verification](#acceptance-criteria-verification)

---

## Overview

**VND Money Tracker** provides simple, reliable personal bookkeeping in Vietnamese Dong. It strictly adheres to:

- **English-Only User Interface:** No multi-language toggles or mixed strings.
- **Permanent Dark Mode:** Modern, accessible dark theme based on the specified palette (`#212121` main background, `#262626` cards, `#1A1A1A` input fields, `#ECECEC` primary text, green for additions, red for subtractions).
- **Zero-Debt Ledger Guarantee:** Enforces non-negative balances at all times. Neither spending, editing, nor deleting transactions can cause the user's balance or historical running balance to drop below `0 ₫`.
- **Pure Integer VND Arithmetic:** Vietnamese Dong does not use sub-unit decimal fractions. All monetary figures are validated and stored as 64-bit safe integers to prevent floating-point inaccuracies.
- **Cross-Device Synchronization:** User records are persisted in a Cloudflare D1 database and associated with the authenticated ChatGPT user, allowing real-time synchronization between laptops and smartphones.

---

## Key Features

1. **Prominent Current Balance:** Real-time authoritative available balance, starting at `0 ₫`.
2. **Add Money Dialog:** Positive whole-number VND entry, live formatted preview (`1,000,000 ₫`), quick-addition suggestion chips, and duplicate-submission protection.
3. **Subtract Money Dialog:** Real-time available balance check, immediate visual warning if amount exceeds funds, quick-option chips, and strict server-side overdraft protection.
4. **Financial Summary Cards:**
   - **Total Added:** Sum of all additions.
   - **Total Subtracted:** Sum of all subtractions.
   - **Current Balance = Total Added - Total Subtracted**.
5. **Authoritative Ledger History:**
   - Chronological list (newest first).
   - Additions in green (`+`), subtractions in red (`-`).
   - Timestamps stored in UTC and rendered in English in the `Asia/Ho_Chi_Minh` (UTC+7) timezone.
   - Real-time search by note.
   - Type filter: `All`, `Add (+)`, `Subtract (-)`.
   - Date range filter: `From Date` and `To Date`.
   - Safe transaction editing (with non-negative balance checks).
   - Safe transaction deletion (with confirmation modal and negative balance guards).
   - Pagination controls for large histories.
   - Informative empty states for new accounts or empty search results.

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React icons.
- **Framework & Runtime:** [Vinext](https://vinext.dev) (Vite-powered Next.js API reimplementation for Cloudflare Workers).
- **Database & ORM:** Cloudflare D1 (SQLite engine) paired with Drizzle ORM.
- **Validation:** Zod schemas on both client and server.
- **Authentication:** Official ChatGPT Sites authentication integration (`oai-authenticated-user-*` headers), with simulated user headers in local development for multi-user isolation testing.
- **Testing:** Vitest for unit & integration tests, Playwright for end-to-end browser workflows.
- **Linters & Tooling:** Oxlint and Oxfmt for sub-second linting and code formatting.

---

## Architecture & Database Design

### Database Schema (`db/schema.ts`)

```sql
CREATE TABLE `transactions` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `user_id` TEXT NOT NULL,
  `type` TEXT NOT NULL CHECK (`type` IN ('ADD', 'SUBTRACT')),
  `amount` INTEGER NOT NULL CHECK (`amount` > 0),
  `note` TEXT,
  `created_at` INTEGER NOT NULL,
  `updated_at` INTEGER NOT NULL
);

CREATE INDEX `idx_transactions_user_id` ON `transactions` (`user_id`);
CREATE INDEX `idx_transactions_user_created` ON `transactions` (`user_id`, `created_at`);
CREATE INDEX `idx_transactions_user_type` ON `transactions` (`user_id`, `type`);
```

### API Endpoints

| Method   | Route                   | Description                                                                                              |
| -------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/summary`          | Retrieves authoritative current balance, total added, total subtracted, and transaction count.           |
| `GET`    | `/api/transactions`     | Retrieves filtered, paginated ledger entries for the authenticated user.                                 |
| `POST`   | `/api/transactions`     | Adds or subtracts money, enforcing positive integers and non-negative balance constraints.               |
| `PATCH`  | `/api/transactions/:id` | Updates a transaction's amount or note, verifying that the change preserves non-negative ledger balance. |
| `DELETE` | `/api/transactions/:id` | Deletes a transaction, verifying that removing an addition does not drop balance below `0 ₫`.            |

---

## Financial Calculation & Integrity Rules

1. **Exact Safe Integer Arithmetic:** Handled entirely in integers. Maximum safe VND limit capped at `100,000,000,000,000 ₫` (100 trillion VND) within JavaScript's safe integer ceiling (`Number.MAX_SAFE_INTEGER`).
2. **Non-Negative Balance Invariant:**
   - Attempting to subtract more than the current available balance returns an HTTP 400 error.
   - Deleting an addition that would cause historical or current balance to drop below zero returns an HTTP 400 error.
   - Editing an addition downwards or a subtraction upwards beyond available balance returns an HTTP 400 error.
3. **VND Parsing & Formatting:**
   - Formatter: `new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n) + ' ₫'`.
   - Parser: Accepts numbers with or without comma (`1,000,000`), dot (`1.000.000`), or space (`1 000 000`) grouping separators.
   - Strictly rejects decimals (e.g. `10.5` or `10,50`), negative signs, zero, or non-numeric characters.

---

## Local Windows Development Guide

### 1. Prerequisites

- **Operating System:** Windows 10/11 (PowerShell or Windows Terminal).
- **Node.js:** Node.js v22.13.0 or higher (v24.19.0 recommended).
- **Package Manager:** npm (v11 or higher) or pnpm.
- **Git:** Git for Windows.

Verify versions in PowerShell:

```powershell
node -v
npm -v
git --version
```

### 2. Installation

Clone or open the repository folder and install dependencies:

```powershell
npm install
```

### 3. Environment Configuration

The application uses Cloudflare D1 local emulation through `@cloudflare/vite-plugin` and Miniflare. No external paid credentials or API keys are required.
Configuration is committed in `.openai/hosting.json`:

```json
{
  "d1": "DB",
  "r2": null
}
```

### 4. Database Migrations

Generate Drizzle SQL migrations if schema is updated:

```powershell
npm run db:generate
```

Migration files are output to `drizzle/` and committed to the repository. The runtime automatically provisions the schema locally on first launch.

### 5. Running the Local Dev Server

Start the local development server:

```powershell
npm run dev
```

By default, the server runs on `http://localhost:3000` (or `http://localhost:3333` if port 3000 is occupied).

In local development, authentication defaults to simulated user `local_seedy` (`seedy@sites.test`). You can also pass the `x-simulated-user` header for multi-user testing.

### 6. Quality Assurance & Testing

#### Type Checking

```powershell
npm run typecheck
```

#### Linting & Formatting

```powershell
npm run lint
npm run format
```

#### Unit & Integration Tests (Vitest)

Executes 30 test cases covering VND formatting, integer limits, parser, running balance calculations, data ownership, and concurrency simulation:

```powershell
npm test
```

#### End-to-End Tests (Playwright)

Executes real browser workflows across desktop and mobile viewports:

```powershell
npm run test:e2e
```

### 7. Production Build & Preview

Build the application for production:

```powershell
npm run build
```

The output is generated into `dist/`, including:

- Cloudflare Workers ESM bundle in `dist/server/`
- Client static assets in `dist/client/`
- ChatGPT Sites deployment bundle and Drizzle migrations in `dist/.openai/`

---

## Deployment to ChatGPT Sites

The repository is built strictly for ChatGPT Sites:

1. `.openai/hosting.json` declares the Cloudflare D1 binding `"d1": "DB"` and `"r2": null`.
2. The build pipeline invokes `@openai/sites-vite-plugin`, which packages migrations and metadata into `dist/.openai/`.
3. In ChatGPT Sites, deployment automatically maps user sessions from ChatGPT authentication headers (`oai-authenticated-user-id`, `oai-authenticated-user-email`) into the backend.
4. When deploying via the ChatGPT Sites web UI or CLI:
   - Ensure the repository is pushed to your remote Git repository.
   - Connect the repository in ChatGPT Sites.
   - Sites will trigger `npm run build` and provision the D1 database automatically.

---

## Troubleshooting

- **Port in Use:** If port 3000 is used by another local service, launch with a custom port:
  ```powershell
  npx vinext dev -p 3333
  ```
- **Local D1 Persistence:** Miniflare stores local SQLite state in `.wrangler/`. To completely reset local data:
  ```powershell
  Remove-Item -Recurse -Force .wrangler
  ```
- **Type Checking Errors:** Ensure TypeScript definitions are up to date:
  ```powershell
  npm run typecheck
  ```

---

## Acceptance Criteria Verification

- [x] Money can be added in VND with comma-separated inputs.
- [x] Money can be subtracted in VND with available balance validation.
- [x] Recalculates balance immediately and persists in Cloudflare D1.
- [x] Negative balances are prevented (at submission, edit, and deletion).
- [x] Transaction history is searchable, filterable by type and date range, editable, and deletable.
- [x] Safe integer arithmetic exclusively.
- [x] English-only user interface throughout.
- [x] Permanent dark-only design system (`#212121`, `#262626`, `#1A1A1A`, `#ECECEC`).
- [x] Fully responsive on laptops, tablets, and smartphones.
- [x] Compatible with ChatGPT Sites hosting and authentication.
- [x] 30 unit & integration tests pass (Vitest).
- [x] End-to-end browser workflows pass (Playwright).
- [x] Production build passes (`vinext build`).
