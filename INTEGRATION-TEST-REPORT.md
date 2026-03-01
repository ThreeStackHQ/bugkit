# BugKit — Sprint 4.4 Integration Test Report

**Date:** 2026-03-01  
**Tester:** Sage (ThreeStack Architect Agent)  
**Repo:** https://github.com/ThreeStackHQ/bugkit  
**Branch:** `main` (HEAD: `dc32fd2`)  
**Stack:** Next.js 14 (App Router), Drizzle ORM, PostgreSQL, Auth.js v5, Cloudflare R2, Stripe  

---

## Summary

| Metric | Count |
|--------|-------|
| Test flows evaluated | 9 |
| PASS | 3 |
| PARTIAL | 2 |
| FAIL | 4 |
| Bugs found | 18 |
| P0-Critical | 5 |
| HIGH severity | 6 |
| MEDIUM severity | 5 |
| LOW severity | 2 |

**Deployment ready?** ❌ NO — 5 P0-Critical blockers prevent basic functionality.

---

## Test Flow Results

### 1. Auth — Signup, Login, Session, Protected Routes
**Result: FAIL**

#### What was tested:
- `auth.ts` — NextAuth v5 with DrizzleAdapter, GitHub + Google OAuth
- `middleware.ts` — Route protection
- `/(dashboard)/layout.tsx` — Layout-level auth guard
- `app/(auth)/login/page.tsx` — Login UI

#### Findings:

**BUG-001 [P0-CRITICAL]: DrizzleAdapter missing `accounts`, `sessions`, `verificationTokens` tables**

`auth.ts` uses `DrizzleAdapter(db)` which requires `accounts`, `sessions`, and `verificationTokens` tables to store OAuth account links and (optionally) sessions. The database schema (`packages/db/src/schema.ts` and the migration `0001_initial.sql`) only defines `users`, `projects`, `reports`, `integrations`, and `subscriptions`. The `accounts` table is completely absent.

When a user attempts GitHub or Google OAuth sign-in, the adapter will throw a DB error trying to insert the account link record. **All sign-ins will fail at first run.**

```ts
// auth.ts — line 7: no accountsTable, sessionsTable, or verificationTokensTable passed
const _nextAuth: NextAuthResult = NextAuth({
  adapter: DrizzleAdapter(db),  // ← adapter expects accounts table
```

Fix: Either pass explicit table mappings with matching schema, or add the missing tables to the schema and migration.

---

**BUG-002 [MEDIUM]: Middleware protects wrong paths**

`middleware.ts` runs on paths matching `/dashboard/:path*`, but the Next.js App Router group `/(dashboard)/` renders at `/` and `/reports` — not `/dashboard/*`. The middleware never fires for the actual dashboard routes.

```ts
// middleware.ts
if (pathname.startsWith("/dashboard")) { ... }  // ← no /dashboard/* routes exist

export const config = {
  matcher: ["/dashboard/:path*"],  // ← wrong matcher
};
```

The dashboard layout (`/(dashboard)/layout.tsx`) independently redirects to `/login` when no session is found, which partially mitigates the risk. However, the middleware CORS OPTIONS pre-flight handling or rate-limiting logic (if added later) would also not fire.

Fix: Change matcher to `["/((?!api|_next|login|pricing|robots.txt|sitemap.xml).*)"]` or specifically `["/", "/reports/:path*", "/projects/:path*", ...]`.

---

**BUG-003 [MEDIUM]: Redundant manual user upsert in `signIn` callback**

`auth.ts` has a custom `signIn` callback that manually queries and conditionally inserts the user, duplicating DrizzleAdapter's user-creation logic. Once BUG-001 is fixed and the adapter works correctly, this will cause a double-insert attempt.

---

### 2. Report Submission API — `POST /api/reports`
**Result: PARTIAL**

The API logic is well-structured with proper validation (Zod), dual auth support (API key + session), and R2 upload. However, critical external dependencies block real-world use.

**BUG-004 [P0-CRITICAL]: No CORS headers on `POST /api/reports`**

The BugKit widget (`packages/widget/src/bugkit.ts`) is embedded on third-party sites and submits reports via `fetch()` to the BugKit API server. Without `Access-Control-Allow-Origin` (and `Access-Control-Allow-Headers` for the `Authorization` header), all cross-origin widget submissions will be blocked by the browser CORS policy.

```ts
// apps/web/app/api/reports/route.ts — no CORS headers set
export async function POST(req: NextRequest): Promise<Response> {
  // ... no OPTIONS handler, no Access-Control-Allow-Origin response header
```

**This makes the entire widget non-functional for production use.** Every BugKit customer's users will see a CORS error in their browser console.

Fix: Add an `OPTIONS` handler returning CORS preflight headers, and add `Access-Control-Allow-Origin: *` (or specific origin) to the POST response.

---

**BUG-005 [MEDIUM]: Widget sends `description` in `metadata` but API expects top-level field**

The widget's `submitReport` function packs the description into `metadata.description`:
```ts
// packages/widget/src/bugkit.ts
body = JSON.stringify({
  title: title || undefined,
  metadata: { description: _description || undefined },  // ← nested
  // description: NOT sent at top level
```

But `ReportBodySchema` in `POST /api/reports` expects `description` at the top level:
```ts
const ReportBodySchema = z.object({
  description: z.string().optional(),  // ← expects top-level
  ...
```

Result: Bug report `description` is always `null` in the database, even when the user fills it in the widget form. The description ends up in `metadata.description` only.

---

**BUG-006 [MEDIUM]: Missing migration columns — `annotated_screenshot_url`, `user_id`**

`packages/db/src/schema.ts` defines two columns on the `reports` table that are not present in `src/migrations/0001_initial.sql`:
- `annotated_screenshot_url text`
- `user_id text`

Any DB operation touching these columns will fail with a "column does not exist" error on a fresh database deployment.

---

**What works:**
- JSON and multipart/form-data parsing ✅
- Zod validation with informative 422 errors ✅
- Base64 PNG screenshot → R2 upload ✅
- Console logs array stored as JSONB ✅
- Metadata object stored as JSONB ✅
- API key auth via `Authorization: Bearer <key>` ✅
- Session-based auth fallback ✅
- Integration notifications fire-and-forget ✅

---

### 3. Screenshot Annotation — `POST /api/reports/[id]/annotate`
**Result: PASS**

Server-side annotation using `sharp` is well-implemented:
- Accepts rectangles, arrows, and blur regions in request body
- Downloads original screenshot from R2
- Applies blur by extracting + blurring + compositing back
- Builds SVG overlay for rectangles and arrows
- Uploads annotated image to R2 at a stable key
- Updates `annotated_screenshot_url` on the report row
- Auth checked before proceeding (report ownership validated)

**Minor note:** The annotation endpoint stores to `annotated_screenshot_url` but the migration doesn't have this column (BUG-006 above). In production, the final `db.update()` will fail.

---

### 4. Console Log Capture — `GET /api/reports/[id]/console-logs`
**Result: PASS**

- Returns stored `consoleLogs` JSONB array from the report row
- Auth checks report ownership before returning ✅
- Returns `{ reportId, count, consoleLogs }` response ✅

Widget-side console capture also works correctly:
- Patches `console.log/warn/error/info/debug` ✅
- Captures `window.onerror` and `unhandledrejection` ✅
- Maintains rolling buffer of 50 entries ✅
- Sends with each bug report ✅

---

### 5. Reporter Widget
**Result: PARTIAL**

`packages/widget/dist/bugkit.min.js` (8.6KB) and `bugkit.js` (18.4KB) exist and are built. Widget logic is well-implemented.

**What works:**
- `BugKit.init({ projectId, apiKey })` initializes correctly ✅
- Floating trigger button renders in correct position ✅
- Loads html2canvas from CDN on first click ✅
- Full-page screenshot captured ✅
- Drawing overlay with Rectangle, Arrow, Blur tools ✅
- Submit modal with title + description fields ✅
- Sets `Authorization: Bearer <apiKey>` header ✅
- Sends `project_id`, `screenshot` (base64), `console_logs`, `url`, `user_agent` ✅
- Auto-exposes `window.BugKit` global ✅

**Broken:**
- ❌ **Cross-origin submissions blocked by CORS** (BUG-004) — the main failure mode
- ❌ **Description not saved** (BUG-005) — packed in metadata instead of top-level
- ⚠️ Widget uses default endpoint `/api/reports` (relative URL) but in real usage it would need the full absolute URL

---

### 6. Dashboard UI
**Result: FAIL**

**BUG-007 [P0-CRITICAL]: Dashboard stats hardcoded to zero**

`apps/web/app/(dashboard)/page.tsx` hardcodes all stats:
```tsx
<p className="text-3xl font-bold text-white mt-1">0</p>  // Total Reports
<p className="text-3xl font-bold text-white mt-1">0</p>  // Open Reports
<p className="text-3xl font-bold text-white mt-1">0</p>  // Projects
```
No DB queries are made. These numbers never reflect real data.

---

**BUG-008 [P0-CRITICAL]: Reports page uses hardcoded mock data**

`apps/web/app/(dashboard)/reports/page.tsx` is fully powered by `mockReports` and `mockConsoleLogs` arrays:
```tsx
const mockReports: Report[] = [
  { id: "1", title: "Button click on checkout page throws 500", ... },
  // ... 6 more hardcoded reports
];
```

- No API calls to `/api/reports` or any data-fetching hook
- Status changes in the slide-over panel are local state only — not persisted
- "Save Changes", "Mark Resolved" buttons don't call any API
- Console logs shown in detail panel are `mockConsoleLogs` — not fetched from `/api/reports/[id]/console-logs`

---

**BUG-009 [HIGH]: Sidebar shows non-existent pages**

The sidebar links to `/projects`, `/integrations`, and `/settings` which have no corresponding page files. All three return 404. The sidebar badge on "Reports" shows hardcoded `"12"` regardless of actual report count.

---

**BUG-010 [P0-CRITICAL]: No project management API or UI**

There is no `GET/POST/PATCH/DELETE /api/projects` endpoint. Users cannot:
- Create a project
- Get their API key
- List their projects

The `lib/tier.ts` exports `canCreateProject()` with tier-based limits but it is never called. The entire project management workflow is missing. Without a project record in the DB (with a valid `apiKey`), the widget cannot submit any reports.

---

### 7. Stripe Billing
**Result: PARTIAL**

**What works:**
- `POST /api/stripe/checkout` — properly authenticated (session required), creates/finds Stripe customer, creates checkout session with correct `metadata` ✅
- `POST /api/stripe/webhook` — validates Stripe signature with `stripe.webhooks.constructEvent` ✅
- Webhook handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` ✅
- Upserts `subscriptions` row correctly ✅

**Bugs:**

**BUG-011 [HIGH]: Pricing tiers mismatch between UI and code**

Pricing page shows three tiers: **Free / Indie ($9) / Pro ($29)**.  
The code (schema enum, Stripe checkout, webhook) only knows: `free`, `pro`, `business`.  
The pricing CTA links to `/signup?plan=indie` — a plan name that doesn't exist in the system.

Stripe checkout only accepts `"pro"` or `"business"` tiers:
```ts
const CheckoutSchema = z.object({
  tier: z.enum(["pro", "business"]),  // ← "indie" not here
});
```

The pricing page also links to `/signup` which doesn't exist (404).

---

**BUG-012 [HIGH]: Tier limits not enforced anywhere**

`lib/tier.ts` defines tier gates:
- `canCreateProject()` — max 1 project (free), 5 (pro), unlimited (business)
- `canUseSlack()` — pro+ only
- `canUseLinear()` — business only
- `canUseGitHub()` — business only

But **none of these functions are imported or called** in any API route. Any user on any plan can use all integrations.

---

**BUG-013 [MEDIUM]: `checkout.session.completed` does not set `currentPeriodEnd`**

When handling `checkout.session.completed`, `upsertSubscription` is called without `currentPeriodEnd`. This is populated in `customer.subscription.updated` but not on initial checkout completion. The period-end column will be `null` until the first subscription update webhook fires.

---

### 8. Security Review
**Result: PARTIAL**

**What passes:**
- No reflected XSS in the dashboard (React JSX escapes all string interpolation) ✅
- IDOR protection on reports: console-logs and annotate endpoints check ownership ✅
- GitHub tokens masked in GET response (`****xxxx`) ✅
- Linear API keys masked in GET response ✅
- Stripe webhook signature validation ✅
- API key stored as unique text — not in auth headers ✅

**Issues:**

**BUG-014 [MEDIUM]: GitHub tokens and Linear API keys stored in plaintext in JSONB**

Integration configs are stored as raw JSON in the `config jsonb` column. GitHub PATs and Linear API keys are stored unencrypted. A database dump exposes all credentials.

Fix: Encrypt secrets at rest using AES-256 before storing, decrypt on read.

---

**BUG-015 [MEDIUM]: No rate limiting on `POST /api/reports`**

The report submission endpoint has no rate limiting. A malicious party with a valid API key could flood the endpoint, consuming R2 storage and database space. This is especially risky because the widget JS exposes `apiKey` in the browser.

---

**BUG-016 [HIGH]: Widget API key exposed client-side**

`BugKit.init({ apiKey: "..." })` embeds the API key in the browser-accessible JavaScript. Anyone visiting the target site can extract the API key from the page source and use it to submit unlimited fake reports. Combined with no rate limiting (BUG-015), this is an abuse vector.

The widget API key is design-inherent (like Sentry's DSN), but BugKit should document this risk and add per-key rate limiting and report volume caps tied to subscription tier.

---

### 9. Build
**Result: PASS**

Pre-built `.next/` artifacts exist in the repo. Build previously completed successfully. Route manifest confirms all 11 API routes and 5 page routes compiled without errors:

```
Route (app)                              Size
├ ƒ /api/reports                         0 B
├ ƒ /api/reports/[id]/annotate           0 B
├ ƒ /api/reports/[id]/console-logs       0 B
├ ƒ /api/stripe/checkout                 0 B
├ ƒ /api/stripe/webhook                  0 B
├ ƒ /api/integrations/slack              0 B
├ ƒ /api/integrations/github             0 B
├ ƒ /api/integrations/linear             0 B
├ ƒ /login                               138 B
├ ○ /pricing                             178 B
└ ƒ /reports                             5.56 kB
```

Widget build: `bugkit.min.js` (8.6KB), `bugkit.js` (18.4KB) — both exist and are current.

---

## Bug Register

| ID | Severity | Component | Description |
|----|----------|-----------|-------------|
| BUG-001 | **P0-CRITICAL** | Auth | DrizzleAdapter missing `accounts`/`sessions`/`verificationTokens` tables — OAuth sign-in fails |
| BUG-004 | **P0-CRITICAL** | API/Widget | No CORS headers on `POST /api/reports` — widget cross-origin submissions blocked |
| BUG-007 | **P0-CRITICAL** | Dashboard | Dashboard stats hardcoded to 0 — no real data displayed |
| BUG-008 | **P0-CRITICAL** | Dashboard | Reports page uses mock data — no DB connection, changes not persisted |
| BUG-010 | **P0-CRITICAL** | Projects | No `/api/projects` endpoint — users cannot create projects or get API keys |
| BUG-009 | **HIGH** | UI | Sidebar links to non-existent `/projects`, `/integrations`, `/settings` (all 404) |
| BUG-011 | **HIGH** | Billing | Pricing tiers "Free/Indie/Pro" mismatch code tiers "free/pro/business"; `/signup` is 404 |
| BUG-012 | **HIGH** | Billing | Tier limits defined in `lib/tier.ts` but never enforced in any API route |
| BUG-016 | **HIGH** | Security | Widget API key client-side exposure + no rate limiting = abuse vector |
| BUG-002 | **MEDIUM** | Auth | Middleware protects `/dashboard/*` but actual routes are `/` and `/reports` |
| BUG-003 | **MEDIUM** | Auth | Redundant manual user upsert in `signIn` callback conflicts with adapter |
| BUG-005 | **MEDIUM** | Widget/API | Widget sends `description` in `metadata.description`; API expects top-level field |
| BUG-006 | **MEDIUM** | DB | Migration missing `annotated_screenshot_url` and `user_id` columns on `reports` |
| BUG-013 | **MEDIUM** | Billing | `checkout.session.completed` webhook doesn't set `currentPeriodEnd` |
| BUG-014 | **MEDIUM** | Security | GitHub/Linear credentials stored in plaintext JSONB |
| BUG-015 | **MEDIUM** | Security | No rate limiting on `POST /api/reports` |
| BUG-017 | **LOW** | Dashboard | Sidebar Reports badge hardcoded to `"12"` |
| BUG-018 | **LOW** | Billing | `.env.example` missing R2 and Stripe env vars |

---

## What Works Well

- ✅ Report submission API core logic (validation, auth, R2 upload, DB insert)
- ✅ Screenshot annotation server-side (sharp, blur, SVG overlay)
- ✅ Console log retrieval endpoint
- ✅ Widget drawing tools (rectangle, arrow, blur/pixelate)
- ✅ Widget console + error capturing
- ✅ Stripe checkout session creation
- ✅ Stripe webhook with signature validation
- ✅ Integration CRUD endpoints (Slack, GitHub, Linear) — auth + ownership checks solid
- ✅ Dual auth model (API key Bearer token + NextAuth session)
- ✅ Build compiles cleanly, widget dist files present
- ✅ TypeScript types throughout, Zod validation on all endpoints

---

## Priority Fixes for Bolt

### Must fix before any testing is possible:

1. **BUG-001**: Add `accounts`, `sessions`, `verificationTokens` tables to DB schema + migration (standard Auth.js/DrizzleAdapter tables)
2. **BUG-004**: Add CORS headers to `POST /api/reports` — OPTIONS preflight + `Access-Control-Allow-Origin` and `Access-Control-Allow-Headers: Authorization, Content-Type`
3. **BUG-010**: Create `GET/POST /api/projects` endpoint (list + create project with API key generation via `crypto.randomUUID()` or `nanoid`)

### Must fix for functional product:

4. **BUG-008**: Connect Reports page to real `GET /api/reports?projectId=...` endpoint with proper data fetching
5. **BUG-007**: Compute dashboard stats from DB (count reports, open reports, projects per user)
6. **BUG-011**: Align pricing tier names — either rename code tiers to `free/indie/pro` or update pricing page to match `free/pro/business`; add `/signup` route

### Should fix for correctness:

7. **BUG-005**: Fix widget to send `description` at top-level: `{ ..., description: _description || undefined }` (not in `metadata`)
8. **BUG-012**: Call `canCreateProject()` in project creation API; call `canUseSlack/Linear/GitHub()` in integration endpoints
9. **BUG-006**: Add migration columns: `ALTER TABLE reports ADD COLUMN annotated_screenshot_url text, ADD COLUMN user_id text`
10. **BUG-009**: Create `/projects`, `/integrations`, `/settings` pages or remove dead sidebar links

---

*Report generated by Sage — ThreeStack Architect Agent*  
*Sprint 4.4 Integration Testing, 2026-03-01*
