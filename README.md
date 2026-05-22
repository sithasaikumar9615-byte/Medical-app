# Medical-app

A web app for managing medical records, clinics/doctors, and prescription tracking.
Three roles are supported: **Patient**, **Doctor**, **Pharmacist**.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **PostgreSQL** + **Prisma ORM**
- **NextAuth.js** (credentials + role-based access)
- **Zod** for validation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file and fill in values:
   ```bash
   cp .env.example .env
   ```
3. Generate the Prisma client and push the schema:
   ```bash
   npm run db:generate
   npm run db:push
   ```
4. (Optional) Seed the database with sample users and clinical data:
   ```bash
   npm run db:seed
   ```
   This creates one of each role; sign-in details are printed at the end of the seed.
5. Start the dev server:
   ```bash
   npm run dev
   ```

The app will be available at http://localhost:3000.

## Project Structure

```
prisma/schema.prisma     Database schema (users, patients, doctors, records, prescriptions)
src/app/                 Pages (landing, login, role-specific dashboards)
src/lib/                 Shared utilities (prisma client, auth helpers)
src/components/          Shared UI components
```

## Roles

- **Patient** — view personal medical records and prescriptions.
- **Doctor** — manage their patients, write medical records, issue prescriptions.
- **Pharmacist** — view prescriptions issued to patients and mark them as dispensed.

## Status

This is an initial scaffold. Core features are stubbed and intended to be filled in iteratively.
