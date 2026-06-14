# Budget App UI

Frontend application for the Budget App.

The UI provides:

- CSV transaction imports
- Automatic categorization
- Manual transaction entry and editing
- Split transaction allocation across months
- Budget management
- Spending analysis and reporting

---

## tl;dr

Install dependencies:

```bash
pnpm install
```

Run the application:

```bash
pnpm dev
```

The application runs on:

```txt
http://localhost:43210
```

The UI is located in:

```txt
apps/ui
```

---

## Technology Stack

Core technologies:

- React
- TypeScript
- Vite
- MUI
- Luxon

Backend:

- Express API
- MongoDB
- Zod validation

---

## Directory Structure

```txt
apps/ui/
├── public/
├── src/
├── index.html
├── tsconfig.json
├── eslint.config.js
└── README.md
```

### `src`

Application source code.

Typical areas include:

```txt
src/
├── api/            Backend API client
├── components/     Shared UI components
├── features/       Feature-based UI modules
├── hooks/          React hooks
└── utils/          Shared helpers
```

---

## Local Development

Start the UI:

```bash
pnpm dev
```

Build:

```bash
pnpm build
```

Preview production build:

```bash
pnpm preview
```

---

## Current Architecture

Current state:

```txt
UI → API → MongoDB
```

The backend API is the source of truth.

MongoDB stores:

- transactions
- budgets
- categories
- sub-categories
- category rules
- transaction allocations

The architecture prioritizes:

- stable identifiers
- incremental feature growth
- predictable data flow
- idempotent imports

---

## Key Concepts

### Transaction Fingerprints

Transactions use a required `fingerprint` field to support:

- duplicate detection
- idempotent imports
- reconciliation across CSV uploads

### Stable IDs

The application uses a stable `id` property for business identity.

Mongo `_id` values are not used by the UI.

---

## Development Guidelines

Preferred conventions:

- TypeScript only
- strict typing
- no `any`
- Zod validation
- minimal refactors
- one change at a time
- helper functions above main functions
- camelCase function names
- kebab-case file names
