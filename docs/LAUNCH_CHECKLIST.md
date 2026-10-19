# PulseBoard launch checklist

Firebase project: `pulseboard--project` (from `.firebaserc`), Firestore in `asia-south1`.
Live at **https://pulseboard--project.web.app**. Last updated 2026-10-18.

## Launch status (2026-10-18)

| Item | Status |
|---|---|
| Firestore rules + indexes | Deployed |
| Hosting | Deployed |
| Email/Password sign-in | Enabled; verified live |
| Live security checks (signed-out access, self-promotion, listing users) | Passed |
| Google sign-in | Enabled in console; not yet tested live |
| Storage (attachments) | **Not enabled.** Needs the Blaze plan. Until then, uploading an attachment shows an error; everything else works. After enabling it, run `npx firebase deploy --only storage`. |
| Scheduled backups | Not enabled (Blaze plan) |
| First admin | **To do**: section 3 |

The previous project, `ai-support-agnet`, was not modified; its config is kept locally in `.env.ai-support-agnet.backup` (not in git).

## 1. Before deploying (Firebase console)

- [ ] **Authentication → Sign-in method:** Email/Password enabled. Google enabled, with a support email set.
- [ ] **Authentication → Settings → Authorized domains:** includes `pulseboard--project.web.app`, `pulseboard--project.firebaseapp.com`, and any custom domain.
- [ ] **Authentication → Templates:** set the sender name and check the verification and password-reset emails.
- [ ] **Storage:** upgrade to Blaze, then Build → Storage → Get started, then `npx firebase deploy --only storage`.
- [ ] **Firestore:** database exists in Native mode.

## 2. Deploy

```bash
npx firebase login                       # interactive; opens a browser
npx firebase use pulseboard--project
npm run build
npx firebase deploy --only firestore:rules,firestore:indexes,storage,hosting
```

- [ ] Wait until every index under **Firestore → Indexes** shows *Enabled* (a few minutes). Queries that need an index fail until then.

**What deploying changes:** it replaces all existing Firestore and Storage rules for this project. Anything that relied on looser rules stops working.

## 3. Create the first admin (one time)

1. Sign up in the deployed app with the account that should be admin, and finish onboarding.
2. Firebase console → Firestore → `users` → your document → set `role` to `admin` (string).
3. Create document `managerDirectory/<your uid>` with field `fullName` (string) set to your name.
4. Reload the app. **Admin** appears in the sidebar.

## 4. Clean up existing data (only if migrating users from another project)

These points come from the old code's behaviour. I couldn't see the live database, so check them rather than assume.

- [ ] **Self-assigned roles.** The old sign-up let anyone pick *Manager*. In **Admin → People**, review the Role column and set anyone who shouldn't be a manager back to Employee.
- [ ] Then click **Sync manager directory**, so the remaining managers can be selected by employees.
- [ ] **Old check-ins and goals** have no `managerId`. Each employee's documents are tagged automatically the next time they sign in; until then their manager won't see them.
- [ ] **Duplicate categories/teams.** Running the old onboarding twice created duplicates. They're harmless; users can delete extras in **Dashboard → Settings**.
- [ ] **Profile documents with unexpected fields.** The rules only accept known profile fields. If anyone reports "Failed to update profile", check their `users` document for extra fields.

## 5. Smoke test on production (about 10 minutes)

- [ ] Sign up a new test account → lands on onboarding → completes → dashboard.
- [ ] Add an activity, a quarter activity (check it appears under the right quarter), a check-in with blank optional fields, and a goal.
- [ ] Upload an attachment and open it.
- [ ] As admin, make a second test account a manager. As the first account, choose that manager in **Edit profile**.
- [ ] As the manager, see the check-in in **Manager → Recent Check-Ins** and send feedback with an action item.
- [ ] As the employee, acknowledge the feedback and complete the action item.
- [ ] Forgot password sends an email; Google sign-in works.
- [ ] As an employee, opening `/admin` or `/manager` redirects to the dashboard.
- [ ] Delete the test accounts afterwards (Authentication and their `users` docs).

## 6. Known limitations at launch

| Area | Status |
|---|---|
| v1 is individual-only | Team features are off (`VITE_FEATURE_TEAMS` unset). The code, rules and a full E2E suite stay in place for v2. |
| Journal privacy | Wins, reflections, goals, feedback and action items are readable only by their owner, enforced by `firestore.rules` and tested; in-app admins see profiles (name, email, team, role) only. The Firebase project owner can still view raw data in the Firebase console, as with any Firebase app: state this in the privacy policy. |
| Reassigning someone to a new manager (teams mode) | The old manager keeps read access to that person's existing check-ins/goals until the person next signs in (re-tagging happens on the employee's client). Demotion revokes access immediately. |
| Single workspace | All users share one workspace. There are no organisations, invitations or per-company isolation. Matters only once team features return. |
| AI review summaries | Not implemented. Reviews show and export (PDF) the user's own wins with impact, grouped by category, plus weekly reflections, for a month, quarter, half-year, year or custom range. |
| Email verification | Sent at sign-up but not enforced. |
| Password policy | Enforced in the sign-up form only. Configure a server-side policy in Authentication → Settings if needed. |
| Account deletion / data export | Admin export of the user list only; no self-serve delete. |
| Category rename | Doesn't rename the category on activities already logged. |
| Monitoring | No error tracking or analytics. |
| Content Security Policy | Not set. Other security headers are set in `firebase.json`. |
| App Check | Not enabled. Recommended to limit API abuse. |
| Backups | Firestore point-in-time recovery requires the Blaze plan; not configured. |
| Dependency audit | 12 advisories remain (no critical). They are in Firestore's Node-only gRPC transport and Tailwind's build tooling, neither of which ships to browsers. |

## 7. Branding

- Landing page: personal/employer credit replaced with a neutral "© PulseBoard" footer; hero copy made general.
- Default categories: replaced with 10 general, review-aligned categories (Delivery & Execution, Customer & Business Impact, Problem Solving, Process Improvement, Collaboration, Leadership & Mentoring, Learning & Growth, Knowledge Sharing, Culture & Community, Other), with keyword suggestions tuned to the role chosen at onboarding. Existing users keep their categories and can use **Settings → Apply recommended categories**.
- Still open: product name/trademark check, logo and colours, custom domain, favicon, Privacy Policy and Terms pages.
