# Winfolio

Winfolio is a personal work journal: save your wins as they happen, write a short weekly reflection, track goals, and turn it all into a review-ready summary for any period. v1 is individual-only; team features (managers, feedback, action items) are built but switched off behind `VITE_FEATURE_TEAMS` for a later release.

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
| `npx vitest run` | Unit tests (category suggestions, review periods) |
| `npm run test:e2e` | Browser tests on the emulators: the v1 journey in Chrome, Firefox, Safari (WebKit) and a phone viewport; an automated WCAG 2.1 AA scan of every screen in light and dark mode; and the v2 team journeys. First run: `npx playwright install chromium firefox webkit` |
| `npx playwright test --project=individual` | Just one project (run inside `firebase emulators:exec`, as `test:e2e` does) |

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

## App Check

App Check makes Firebase accept requests only from this app, not from scripts that copy the public config. The code is ready; it switches on when a site key is set.

1. Create a **reCAPTCHA v3** key at https://www.google.com/recaptcha/admin (domains: `pulseboard--project.web.app`, `pulseboard--project.firebaseapp.com`, `localhost`, plus any custom domain).
2. Firebase console → **App Check** → Apps → your web app → **reCAPTCHA** → paste the **secret** key → Save.
3. Put the **site** key in `.env` as `VITE_APPCHECK_SITE_KEY=...`, then build and deploy hosting.
4. For local `npm run dev`, open the browser console, copy the printed App Check debug token, and add it under App Check → Apps → ⋮ → Manage debug tokens.
5. Watch App Check → **APIs** metrics for a few days. When nearly all requests show as verified, click **Enforce** for Cloud Firestore, Authentication and (if enabled) Storage.

Leave enforcement off until step 5, or users on an older cached version of the app will be blocked.
