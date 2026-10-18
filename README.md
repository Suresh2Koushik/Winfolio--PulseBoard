# PulseBoard

Work and performance tracker. Employees log activities, weekly check-ins and goals; managers see their direct reports' check-ins and goals and give feedback with action items; admins manage roles and reporting lines.

## Stack

- React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Firebase: Authentication (email/password, Google), Cloud Firestore, Cloud Storage, Hosting
- Security is enforced by `firestore.rules` and `storage.rules`. The UI's role checks are for navigation only.

## Getting started

Requirements: Node 18+ and, for the test suites, Java 21 (the Firebase emulators need it).

```bash
npm install
cp .env.example .env   # fill in your Firebase web app config
npm run dev            # http://localhost:8080
```

To develop against local emulators instead of a real project:

```bash
npx firebase emulators:start --only auth,firestore,storage --project demo-pulseboard
npx vite --mode e2e    # uses .env.e2e, which points at the emulators
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build into `dist/` |
| `npm run lint` | ESLint |
| `npm run test:rules` | Security-rules tests (Firestore + Storage) on the emulators |
| `npm run test:e2e` | Browser tests of employee/manager/admin journeys on the emulators |

## Roles and data access

| Role | Can |
|---|---|
| Employee | Read and write their own activities, check-ins, goals, categories and teams. Read feedback and action items addressed to them; acknowledge feedback and update action-item status. |
| Manager | Everything an employee can, plus read check-ins, goals and profiles of people whose `managerId` is them, and send feedback/action items to those people. |
| Admin | Read all data for analytics, change anyone's role or manager, maintain the manager directory. |

How it works:

- New accounts are always created as `employee`. Only an admin can change `users/{uid}.role`.
- Employees choose a manager from `managerDirectory`, which holds names only and is maintained by admins.
- Check-ins and goals store a copy of the owner's `managerId`. The rules require it to equal the owner's current manager, and the app re-tags existing documents when the manager changes (`src/lib/userProfile.ts`).
- Demoting a manager removes their access immediately; manager access also requires the manager/admin role.

## Firestore collections

`users`, `managerDirectory`, `activities`, `userCategories`, `userTeams`, `checkIns`, `goals`, `feedback`, `actionItems`, `auditLogs` (append-only), `changeLogs` (admin-written "What's New" entries). Composite indexes are in `firestore.indexes.json`.

## Deploying

See [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) for the full first-launch procedure. In short:

```bash
npx firebase login
npm run build
npx firebase deploy --only firestore:rules,firestore:indexes,storage,hosting
```

The first admin is created by hand once in the Firebase console (see the checklist).
