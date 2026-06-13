# Budget App

Personal budgeting and transaction categorization application built with React, TypeScript, and MongoDB.

The application supports:

* CSV transaction imports from multiple financial institutions
* Automatic categorization using configurable rules
* Manual transaction management
* Split transaction allocation across months
* Budget tracking and reporting
* Local-first development using MongoDB

---

## tl;dr

Start Mongo locally:

```bash
docker run -d \
  --name mongo-budget \
  -p 27017:27017 \
  mongo:latest
```

Start the UI:

```bash
pnpm dev
```

The UI runs on:

```txt
http://localhost:43210
```

Mongo database:

```txt
budget-app
```

App structure:

```txt
apps/
  ui/   React + Vite frontend
  api/  Node + Express API
```

---

## Project Structure

```txt
budget-app/
  apps/
    ui/
      src/
      public/
    api/
```

### UI (`apps/ui`)

The frontend application for:

* importing transactions
* categorizing spending
* managing budgets
* reviewing historical spending
* transaction splitting and allocation

Technology:

* React
* TypeScript
* Vite
* MUI
* Luxon

### API (`apps/api`)

Backend API responsible for:

* MongoDB persistence
* transaction import processing
* rule evaluation
* budgeting data access
* migration from IndexedDB

Technology:

* Node.js
* Express
* TypeScript
* MongoDB
* Zod

---

## Data Storage

Mongo database:

```txt
budget-app
```

Planned collections:

```txt
transactions
transactionAllocations
categoryRules
categories
subCategories
budgets
```

The application uses a stable `id` property for application identity and does not depend on Mongo `_id` values.

---

## Development Philosophy

This application favors:

* simple local development
* explicit typing
* minimal infrastructure
* fast iteration
* strong TypeScript safety
* idempotent imports using transaction fingerprints

---

## Future Work

* Mongo-backed persistence
* IndexedDB migration tooling
* API-driven synchronization
* reporting improvements
* budgeting enhancements
