# FILE-AUDIT.md — every file outside the consumer app, with a verdict

> **Who this is for.** The person cleaning up this repository by hand. Every entry
> says what the file is, whether it is still accurate, who or what depends on it,
> and whether it can go. **Nothing in the repo was changed while writing this.**
> Audited on **2026-09-15** by reading the files and running searches and scans. Every
> line number, size and count below was re-checked against the files after the first
> draft. Anything not provable from the repo is marked **NOT VERIFIED**.
>
> **Companion documents:** `final/CONSUMER.md` covers every file in
> `frontend/apps/consumer/` (including its own safe-to-delete list, §14);
> `final/APP-BOUNDARIES.md` covers how the shared packages connect the three apps.

---

## Contents

0. [How to read this](#0-how-to-read-this)
1. [Quick answer: what can go, what must stay](#1-quick-answer--what-can-go-what-must-stay)
2. [Repository root files](#2-repository-root-files)
3. [The Markdown documents, one by one](#3-the-markdown-documents-one-by-one)
4. [`cfc-handoff/`](#4-cfc-handoff)
5. [`frontend/` root and tooling](#5-frontend-root-and-tooling)
6. [`frontend/packages/`, file by file](#6-frontendpackages-file-by-file)
7. [`frontend/apps/pro` and `frontend/apps/admin`](#7-frontendappspro-and-frontendappsadmin)
8. [Generated and ignored material](#8-generated-and-ignored-material)
9. [Git housekeeping](#9-git-housekeeping)
10. [Which documents overlap](#10-which-documents-overlap)
11. [A safe order to clean up in](#11-a-safe-order-to-clean-up-in)
12. [What this audit could not check](#12-what-this-audit-could-not-check)

---

## 0. How to read this

**Git state (on branch `main`):** `COMMITTED` (in the last commit, unchanged) ·
`MODIFIED` (tracked, changed locally) · `STAGED` (added to the index, not committed on
`main`) · `UNTRACKED` · `IGNORED` (excluded by a `.gitignore`).

**Verdicts:**

| Verdict | Meaning |
|---|---|
| **KEEP — IN USE** | Code, config or other docs depend on it (named). |
| **KEEP — REFERENCE** | Nothing depends on it, but it is still accurate and useful. |
| **UPDATE** | Worth keeping, but parts are wrong. The wrong parts are quoted. |
| **OUTDATED** | Mostly superseded; the replacement is named. |
| **DUPLICATE** | Same content exists elsewhere (named, with proof). |
| **SAFE TO DELETE** | Nothing references it and nothing is lost. Proof given, plus the exact way to remove it. |
| **NEEDS YOUR DECISION** | Keeping or removing depends on a choice the code cannot make. |

**How "nothing references it" was proven:**
- **Files:** a text search for the file's name across the whole repository, excluding
  `node_modules`, `.next`, `.git`, `.turbo` and this `final/` folder.
- **Shared-package code:** an exact scan of every `import { … } from "@cfc/…"` in
  `apps/*/src`, plus every relative import inside each package (§6).

**How to remove, by git state:**
- `COMMITTED` file → `git rm <path>` (then commit when you decide to).
- `STAGED` (not committed on `main`) → `git rm --cached <path>` to unstage, then delete the file.
- `IGNORED` or `UNTRACKED` → just delete it; git never tracked it.

> Reminder: the project owner's standing rule is **do not push**. Removing files
> locally is safe; pushing would deploy (see `CONSUMER.md` §2).

---

## 1. Quick answer: what can go, what must stay

### 1.1 Safe to delete (proof in the section named)

| Path | Why | How | Section |
|---|---|---|---|
| `~$IGINAL Website Development Agreement.docx` | Microsoft Word's owner/lock file (162 bytes) for the agreement | Close Word, then delete (`IGNORED`) | §2 |
| `cfc-home.html` (repo root) | First-round version of the signed-out prototype, superseded by `cfc-handoff/reference/cfc-home.html` (feature comparison in §2). An identical copy is committed on the local branch `backup/pre-handoff-port` (§9). | `git rm --cached cfc-home.html`, then delete | §2 |
| `logo-removebg-preview.png` | Byte-identical (SHA-256 `0edfa9fb3e539a7f…`) to `frontend/apps/{consumer,pro,admin}/public/logo.png`; no references | `git rm logo-removebg-preview.png` | §2 |
| `logo-white-removebg-preview.png` | Byte-identical (`6137bc3768d81209…`) to `frontend/apps/consumer/public/logo-white.png`; no references | `git rm logo-white-removebg-preview.png` | §2 |
| `consumerscreens.md` | A pasted chat reply; wrong in several places; superseded by `final/CONSUMER.md`; no references | `git rm consumerscreens.md` | §3.5 |
| `frontend/myref.md` | Personal scratch of first-day setup commands; out of date; no references | `git rm frontend/myref.md` | §3.17 |
| `cfc-handoff/reference/cfc-nextjs/node_modules/` | npm install output for the standalone reference site: **9,214 files, 361 MB** | Delete (`IGNORED`) | §4.2 |
| `cfc-handoff/reference/cfc-nextjs/.next/` and `…/next-env.d.ts` | Build output of the standalone reference site (62 files, 40 MB) | Delete (`IGNORED`) | §4.2 |
| `frontend/packages/ui/src/components/service-card.tsx` | Its only export, `ServiceCard`, is **imported by no app and no other package file** | `git rm`, and delete `packages/ui/src/index.ts:L195`; then follow `APP-BOUNDARIES.md` §10–11 | §6.4 |
| `frontend/packages/ui/src/components/form-shell.tsx` | Its only export, `FormShell`, is **imported by no app and no other package file**. The only mention outside the file is a comment in `apps/admin/src/app/(app)/services/page.tsx:L85` saying the forms "moved from standalone `FormShell` pages into dialogs". | `git rm`, and delete `packages/ui/src/index.ts:L209`; then follow `APP-BOUNDARIES.md` §10–11 | §6.4 |
| `.next/`, `.turbo/`, `tsconfig.tsbuildinfo` under `frontend/` | Generated; rebuilt automatically | Stop dev servers, then delete (`IGNORED`) | §8 |

### 1.2 Must stay (other files depend on them)

| Path | Depended on by |
|---|---|
| `PLATFORM-FACTS.md` | **23 files** cite it: 6 consumer source files, 5 Pro source files, 4 mocks files, `.gitignore`, and 7 other docs |
| `CONSUMER-OPEN-ITEMS.md` | Cited by section number from consumer code (`bookings/[id]`, `legal/[doc]`, `search`, `settings`, `brand.css`), `packages/mocks` (`api/my-bookings.ts`), `packages/types` (`consumer.ts`), `packages/ui` (`photo-grid.tsx`), and `README.md` |
| `PRO-OPEN-ITEMS.md` | Cited from 11 Pro source files, 3 mocks files (`pro-conduct`, `pro-earnings`, `pro-work`), `PRO-BUILD-PLAN.md` and `PRO-VERIFICATION.md` |
| `SCREEN-INVENTORY.md` | The source of the screen numbers ("Customer 12", "Admin 47") used in code comments; cited by `README.md`, `ADMIN-PENDING.md`, `ADMIN-REBUILD-PLAN.md`, `ADMIN-SUMMARY.md`, `PRO-BUILD-PLAN.md` |
| `ORIGINAL Website Development Agreement.docx`, `cfcplatform.pdf` | The client's source documents behind `SCREEN-INVENTORY.md` and `PLATFORM-FACTS.md`. Already git-ignored; keep locally, never commit. |
| Everything in `frontend/` except generated folders and the items above | The product |

### 1.3 Needs your decision

| Path | The question |
|---|---|
| `cfc-handoff/` (16 staged source files) | Keep as the "approved original" until the client signs off the ported home pages, or delete now? (§4) |
| `HOME-DESIGN-OPTIONS.md` | Keep as design history or delete? It describes three superseded directions and a file that no longer exists. (§3.6) |
| `ADMIN-PENDING.md`, `ADMIN-REBUILD-PLAN.md`, `ADMIN-MOBILE-PLAN.md` | Merge into `ADMIN-SUMMARY.md` and delete, or keep as history? (§3.9–3.12) |
| `PRO-BUILD-PLAN.md`, `PRO-VERIFICATION.md` | Keep as history or delete? Nothing references either. (§3.13, §3.15) |
| Unused shared exports (§6.2, §6.4, §6.5) | Part of the design-system and mock-API surface. Delete only if you do not want them for future screens or as the backend contract. |
| Local branch `backup/pre-handoff-port` | It holds the only committed copy of an earlier consumer redesign (§9). |

---

## 2. Repository root files

| File | Size | Git | What it is | Verdict |
|---|---|---|---|---|
| `.gitignore` | 2,592 B · 57 lines | COMMITTED | Ignores `*.docx`, `~$*.docx`, `cfcplatform.pdf`, `node_modules/`, `.pnpm-store/`, `.next/`, `out/`, `build/`, `dist/`, `next-env.d.ts`, `*.tsbuildinfo`, `.turbo/`, `.env`, `.env*.local`, `*.pem`, npm/yarn/pnpm debug logs, `.vscode/*` (except `extensions.json` and `settings.json`), `.idea/`, `.DS_Store`, `Thumbs.db`, `.claude/`. Its comment at `L4` says "This repository is currently PUBLIC" (**NOT VERIFIED**). | **KEEP — IN USE** |
| `README.md` | 3,431 B · 91 lines | COMMITTED | Entry doc. See §3.1. | **UPDATE** |
| `PLATFORM-FACTS.md` | 6,699 B · 125 lines | COMMITTED | See §3.2. | **KEEP — IN USE** |
| `SCREEN-INVENTORY.md` | 15,517 B · 305 lines | COMMITTED | See §3.3. | **KEEP — IN USE** |
| `CONSUMER-OPEN-ITEMS.md` | 33,304 B · 339 lines | COMMITTED | See §3.4. | **KEEP — IN USE** + **UPDATE** |
| `consumerscreens.md` | 4,719 B · 71 lines | COMMITTED | See §3.5. | **SAFE TO DELETE** |
| `HOME-DESIGN-OPTIONS.md` | 6,123 B · 132 lines | COMMITTED | See §3.6. | **OUTDATED** / **NEEDS YOUR DECISION** |
| `WEB-ENTRY-ARCHITECTURE.md` | 4,232 B · 97 lines | COMMITTED | See §3.7. | **UPDATE** |
| `IMAGE-BRIEF.md` | 14,098 B · 156 lines | COMMITTED | See §3.8. | **UPDATE** before reuse |
| `ADMIN-SUMMARY.md` | 7,468 B · 188 lines | COMMITTED | See §3.9. | **KEEP — REFERENCE** + **UPDATE** |
| `ADMIN-PENDING.md` | 4,688 B · 132 lines | COMMITTED | See §3.10. | **DUPLICATE** / **NEEDS YOUR DECISION** |
| `ADMIN-MOBILE-PLAN.md` | 19,588 B · 429 lines | COMMITTED | See §3.11. | **KEEP — REFERENCE** (history) |
| `ADMIN-REBUILD-PLAN.md` | 19,535 B · 360 lines | COMMITTED | See §3.12. | **OUTDATED** / **NEEDS YOUR DECISION** |
| `PRO-BUILD-PLAN.md` | 16,863 B · 350 lines | COMMITTED | See §3.13. | **KEEP — REFERENCE** (history) |
| `PRO-OPEN-ITEMS.md` | 19,594 B · 333 lines | COMMITTED | See §3.14. | **KEEP — IN USE** |
| `PRO-VERIFICATION.md` | 9,283 B · 207 lines | COMMITTED | See §3.15. | **KEEP — REFERENCE** (history) |
| `ORIGINAL Website Development Agreement.docx` | 97,157 B | IGNORED | The signed client agreement, named as the source at `SCREEN-INVENTORY.md:L3`. **Contents not read by this audit.** | **KEEP** locally; never commit |
| `~$IGINAL Website Development Agreement.docx` | 162 B | IGNORED | Word's owner/lock file for the document above (the `~$` prefix is Word's convention). Same timestamp as the agreement (2026-09-05 21:37). | **SAFE TO DELETE** (close Word first) |
| `cfcplatform.pdf` | 537,165 B | IGNORED | The client's platform PDF. `PLATFORM-FACTS.md:L3` says it was extracted from "Sections A and B (pages 1–16)". **Not read by this audit.** | **KEEP** locally; never commit |
| `cfc-home.html` | 71,704 B · 1,278 lines | **STAGED** on `main`; committed on local branch `backup/pre-handoff-port` (same git blob `4b37dd0`) | A standalone HTML version of the signed-out home prototype. It is **not** the same file as `cfc-handoff/reference/cfc-home.html` (2,179 lines; SHA-256 `5c7d75fb…` vs this file's `c395a855…`). Feature counts, root file vs handoff file: `id="sug"` 0 vs 1; `locPop` 0 vs 9 occurrences; `<details` 0 vs 6; `application/ld+json` 0 vs 1. `cfc-handoff/DESIGN-NOTES.md` ("Round two: what changed", `L106`) describes exactly those additions (live search suggestions, city picker, FAQ, JSON-LD), so this is the earlier round. The only text mentions of `cfc-home.html` are inside the handoff docs, and they mean the `reference/` copy. | **SAFE TO DELETE** — `git rm --cached cfc-home.html`, then delete |
| `logo-removebg-preview.png` | 114,958 B | COMMITTED | Full-colour CFC logo. **Identical SHA-256** to `frontend/apps/{consumer,pro,admin}/public/logo.png`. No references. | **DUPLICATE** → **SAFE TO DELETE** |
| `logo-white-removebg-preview.png` | 81,476 B | COMMITTED | White CFC logo. **Identical SHA-256** to `frontend/apps/consumer/public/logo-white.png` (which the consumer does not use either, `CONSUMER.md` §14.1). No references. | **DUPLICATE** → **SAFE TO DELETE** |
| `.claude/settings.local.json` | 8 lines | IGNORED | Local Claude Code permission settings: two `curl` commands against `http://localhost:3000/` and `/categories`. Tool configuration, not project content. | Your choice; harmless |
| `final/` | 3 files | UNTRACKED | This audit: `CONSUMER.md`, `APP-BOUNDARIES.md`, `FILE-AUDIT.md`. | Keep |
| `cfc-handoff/` | 16 staged files + ignored build output | STAGED / IGNORED | See §4. | **NEEDS YOUR DECISION** |
| `frontend/` | the product | mixed | See §5–§8 and `CONSUMER.md`. | **KEEP** |

---

## 3. The Markdown documents, one by one

There are 19 `.md` files outside `final/` (16 at the root, 2 in `cfc-handoff/`, and
`frontend/RUNBOOK.md` and `frontend/myref.md`). For each: what it is, what is still true,
what is not (with evidence), who depends on it, and a recommendation.

### 3.1 `README.md` — **UPDATE**

- **What:** repository entry point. Status table, getting started, reading order, "Three
  things that will bite you" (closed Tailwind scale; opacity modifiers do not work on colour
  tokens; screens never import fixtures), checks, and a note that client documents are
  git-ignored.
- **Still true:** getting started, the opacity and fixtures warnings, the checks, the
  ignored-documents note.
- **Wrong now:**
  - Status table `L9-10`: "Consumer … In progress (9 of 44)" and "Pro … Not started".
    Pro has 33 `page.tsx` files and `PRO-VERIFICATION.md:L6` says "35 of 35 screens built";
    `CONSUMER-OPEN-ITEMS.md:L6` says "all 44 built".
  - `L43` says "Four documents, in this order:" and then lists five.
  - `L61-62` gives `w-24` as an example of a class that "generates no CSS at all". In the
    preset, `width` is defined inside `extend` (`tailwind-preset.js:L332`, `L384`), so it takes
    the spacing scale, and the uncommitted local change added spacing `24` (96px). By that
    reading, `w-24` now generates CSS, so the example is misleading. (Reasoned from the preset,
    not compile-checked.) `gap-1.5` remains a valid example.
  - It does not mention the new home pages, the uncommitted state, or `final/`.
- **Depended on by:** no file links to it, but it is the first file anyone opens.
- **Recommendation:** rewrite the status table, fix `L43`, change the `w-24` example, and point
  to `final/`.

### 3.2 `PLATFORM-FACTS.md` — **KEEP — IN USE**

- **What:** domain rules extracted from `cfcplatform.pdf`: 7 roles across 3 tiers; domain
  constants (15-minute quotation window, phone confirmation above ₹5,000, 30-second pro accept
  timer, 3 nearest pros notified, 2/5/10 km radius, GPS proof within 100 m, 15% commission with
  the first 20 jobs at 0%, CGST 9% + SGST 9% on the platform fee only, payout within 48 hours,
  50% advance on quote accept, auto-block below a 2.5 rating, OTP-gated reviews); three billing
  layers; launch categories; quotation and booking flows; brand requirements; a
  **"Not stated anywhere — do not claim"** list (`L110`); admin tech stack.
- **Depended on by:** 23 files (§1.2).
- **Notes for the reader:**
  - `L100` records the contractual design system as **"Blue + Orange"**. The approved design
    says "No orange anywhere, per the client" (`cfc-handoff/DESIGN-NOTES.md:L25`). That change is
    not recorded here, so the contract and the design appear to conflict.
  - `L101` says the domain is **cfcservice.in**. The handoff layout uses
    `https://cityfamilycare.in` (`cfc-handoff/reference/cfc-nextjs/app/layout.tsx:L5`), and so does
    the referral mock (`packages/mocks/src/api/referral.ts:L27`). One of them is wrong; ask the client.
  - `L67` says "50+ services"; the mock catalogue has 16. This describes the target, not an error.
  - The consumer home pages currently break this document's own rules (`CONSUMER.md` I-01).

### 3.3 `SCREEN-INVENTORY.md` — **KEEP — IN USE**

- **What:** the screen list copied verbatim from the agreement's Section B, Clause 4: total
  **128** (`L18`), which is Customer 44, Pro 35, Admin 49. `L285-305` adds related clauses: 4.6
  multi-language (English, Tamil, Kannada, Hindi, Telugu), 4.7 Figma handover, 4.8 API performance
  (10,000 concurrent users, MongoDB indexing, backups), the Phase 1 timeline ("CFC design system
  (Blue + Orange)"), dark mode for Customer 43, and the 7 roles.
- **Accurate:** a source extract; the code cannot make it wrong.
- **Depended on by:** §1.2.
- **Note:** Customer 1 says "blue+orange logo animation" (`L30`), the same contract-versus-design
  gap as §3.2.

### 3.4 `CONSUMER-OPEN-ITEMS.md` — **KEEP — IN USE** + **UPDATE**

- **What:** the consumer app's decision and issue log in 10 sections: §1 client decisions, §2 spec
  clauses that cannot be honoured as written, §3 deferred, §4 technical debt, §5 design-system
  traps, §6 verified and left alone, §7 optimisation pass (2026-09-09), §8 verification sweep
  (2026-09-09), §9 screens 7–13 audit (2026-09-10), §10 brand teal switch (2026-09-10).
- **Depended on by:** code comments cite its numbers, e.g. `search/page.tsx:L332` (7.18),
  `settings/page.tsx:L37` (3.2), `bookings/[id]/page.tsx:L349` (1.1). **Deleting it would orphan
  those references.** Full list in §1.2.
- **Still valid:** §1 client questions 1.1–1.9 (cancellation policy, no-show, real reviews,
  `?role=pro`, booking horizon, arrival windows, customer quotation deadline, referral terms, legal
  wording). The referral placeholder in 1.8 (₹100 per referral above a ₹500 booking) matches the mock
  (`packages/mocks/src/api/referral.ts:L28-29`). Also still valid: §3, §4, and §7b (7.15 add-ons,
  7.16 repeated photography, 7.17 delete `promo-salon.png`/`promo-ac.png`).
- **Contradicted by the current code:**

| Item | The doc says | The code does |
|---|---|---|
| Header `L6` | "Last updated: 2026-09-09" | §9 and §10 are dated 2026-09-10 |
| 2.2 (`L38`) | "No fake auto-fill animation." | `(auth)/otp/page.tsx:L66-72` fills `AUTO_FILL_CODE` (`"123456"`, `L20`) after 3 seconds |
| 2.4 (`L40`) | "Planned: `.ics` download + Google Calendar URL." | `book/[id]/confirmation.tsx` builds only an `.ics` file; its comment (`L122`) explains why the Google link was not added |
| 2.8 (`L44`) | "a stand-in dialog driven by the scenario control" | No dialog; Pay books straight away, and the copy promises "a secure payment page" (`CONSUMER.md` I-18) |
| 2.11 (`L62`) | Reschedule "starts a fresh booking" | The link passes a booking id where a service id is expected, so it shows an error (`CONSUMER.md` I-06) |
| 5.1 (`L97`) | The spacing scale is `0 1 2 3 4 5 6 8 12 px touch panel` | `16`, `20`, `24` were added locally to the preset (uncommitted; `APP-BOUNDARIES.md` §7) |
| §6 (`L138`) | Splash "sends returning users to `/home`" | `(auth)/splash/page.tsx:L33` sends them to `/` |
| 7.18 (`L175`), 8.1 (`L200`) | The `ring-focus` rings "are invisible" | By Tailwind 3.4.17 defaults the ring falls back to a translucent default blue rather than nothing (`APP-BOUNDARIES.md` B-11; not visually verified) |
| 9.19 (`L252`) | "The weight scale stops at `semibold`." | `bold` and `extrabold` were added locally |
| §10 (`L287`) | Consumer teal is `#00b8c4` | `apps/consumer/src/app/brand.css:L87` sets `--color-action: #0fb3a6`; its own comment (`L55`) says `#00b8c4` was superseded |

- **Internal duplication and order:** 2.7 (`L43`) and 2.25 (`L46`) both describe the AI assistant
  shell; 2.6 (`L42`) and 2.17 (`L56`) both describe PDF download. Rows 1.6–1.9 run in reverse
  (`L23-26`: 1.9, 1.8, 1.7, 1.6), and §2 rows are out of order too (2.16 at `L59` before 2.11 at `L62`).
- **Recommendation:** keep the file, since code depends on its numbering. Correct the rows above,
  merge the duplicates, and add a pointer to `final/CONSUMER.md` §12 for issues found after 2026-09-10.

### 3.5 `consumerscreens.md` — **SAFE TO DELETE**

- **What:** a file map of the consumer app written as a chat reply. The last line (`L70`) is a
  question to the reader: "Want this as a one-page reference doc you can keep open while reviewing,
  or is the list above enough?"
- **Wrong now:**
  - `L15` says Home is "`(app)/page.tsx` — served at / directly". That file is now
    `(app)/browse/page.tsx`, and `/` is `(home)/page.tsx`.
  - `L17` says categories use `?cat=&sub=`. `categories/page.tsx` reads only `sub` and `sort`
    (`L85`, `L88`).
  - `L57` calls `auth-shell.tsx` a "Shared two-column layout". The component's own header comment
    says the two-column version was replaced (`components/auth-shell.tsx:L12-14`).
  - `(home)/` is not mentioned.
- **References:** none.
- **Replaced by:** `final/CONSUMER.md` §3, §5, §11.
- **How:** `git rm consumerscreens.md`.

### 3.6 `HOME-DESIGN-OPTIONS.md` — **OUTDATED** / **NEEDS YOUR DECISION**

- **What:** a record "Written 2026-09-09" (`L3`) of three home-page directions:
  - **A, search-first:** "Verdict: rejected" (`L49`).
  - **B, editorial storefront:** "Status: current state of `/home`" (`L86`).
  - **C, utility dashboard.**
  
  It also covers shared fixes, token traps and "THE BLOCKER" about photographs.
- **Wrong now:**
  - `L5` says the customer lands on `/home`.
  - `L127` names the page file as `apps/consumer/src/app/(app)/home/page.tsx`, which does not exist.
  - `L22` says "Added a real `tel:` Help link". That link was later removed; the reason is written in
    `components/consumer-nav.tsx:L51-56`.
  - All three directions were superseded by the approved handoff design.
- **Still true:** the photography blocker (`L108-119`). The doc counts 15 photos with 13 unique
  files. The repo now has 16 service photos with 13 distinct files by SHA-256 (`CONSUMER.md` I-43).
- **References:** none.
- **Recommendation:** delete, or move to a history folder. The photography problem is already
  tracked in `CONSUMER-OPEN-ITEMS.md` 7.16.

### 3.7 `WEB-ENTRY-ARCHITECTURE.md` — **UPDATE**

- **What:** "Decided 2026-09-09" (`L3`). The rule is **browsing is public, committing requires an
  account**. The doc explains why the old splash → onboarding → login gate lost visitors, gives the
  route change table, critiques the old two-column login (`L53`), and sets the quality bar: "10× better
  than MV Cleaning Services" (`L74`).
- **Still true:** the rule is implemented (`RequireAccount`, `AuthDialog`; `CONSUMER.md` §7). The
  critique matches `components/auth-shell.tsx`'s header comment.
- **Wrong now:** the route table (`L38-44`) says `/home` "folds into `/`". Today `/home` is a separate
  signed-in prototype page. It also calls `/onboarding` "kept, reachable", but nothing links to it
  (`CONSUMER.md` §5–6).
- **References:** none.
- **Recommendation:** update the route table to match `CONSUMER.md` §6, or fold the rule into
  `CONSUMER.md` and delete.

### 3.8 `IMAGE-BRIEF.md` — **UPDATE** before reuse

- **What:** a brief for an image-generation tool. It covers save location, photography direction, and
  three groups: Group 1 is 15 service photos, Group 2 is 3 promo banners, and Group 3 is 3 optional
  category icons. It ends with a checklist and "Why filenames are locked".
- **Still true:** the 15 service filenames and the 3 banner filenames (`first-booking.jpg`,
  `ac-service.jpg`, `deep-cleaning.jpg`) match files in `apps/consumer/public/mock/services/` and
  `public/mock/banners/`, and the paths used in `packages/mocks/src/fixtures/catalog.ts:L334` and
  `promotions.ts:L36-38`.
- **Wrong now:**
  - The repo has **16** service photos; `tap-washer-replacement.jpg` is not in the brief.
  - Colours `#00B8C4` / `#0E1F3D` are the old palette; the approved ones are `#0FB3A6` / `#0B2239`.
  - The Group 3 names (`cat-home-maintenance.png`, `cat-lifestyle-personal.png`, `cat-health-care.png`,
    `L128-130`) do not exist. The repo has `public/images/cat-{beauty,cleaning,electrical,plumbing}.png`.
  - `L11` hard-codes an absolute Windows path.
- **References:** none.
- **Recommendation:** keep only if new photography will be commissioned. That is likely, because five
  services share two photographs (`CONSUMER.md` I-43). Update the list and palette first.

### 3.9 `ADMIN-SUMMARY.md` — **KEEP — REFERENCE** + **UPDATE**

- **What:** the admin panel's short handover ("Last updated: 2026-09-08", `L3`):
  - **Status:** 49 of 49 screens, 22 of 23 design-rebuild phases ("Phase 10 skipped"), 10 of 10 mobile
    phases, "Roughly 40 real defects" fixed.
  - **Still pending:** Live Map + Manual Assignment, a keyboard walkthrough, and two client decisions
    (multi-pro assignment; "Send back" vs "Reject").
  - **Testing:** console helpers for roles and scenarios.
- **Depended on by:** `README.md:L52`.
- **Wrong now:** `L139-142` says "the consumer app has 13 pre-existing errors in 3 files" and that the
  root lint fails. Two of those three files no longer exist (§3.10). Minor inconsistency: "back to all
  10" (`L153`) vs "the full 11-item sidebar" (`L49`).
- **NOT VERIFIED:** whether the pending admin items are still pending (admin screens were not audited).
- **Recommendation:** keep as the single admin doc; delete the consumer-lint paragraph; merge
  §3.10–3.12 into it if you want one admin file.

### 3.10 `ADMIN-PENDING.md` — **DUPLICATE** / **NEEDS YOUR DECISION**

- **What:** the admin remainder as of 2026-09-06 (`L3`):
  - §1 Phase 10 live map.
  - §2 Phase 23 cross-cutting status.
  - §3 two parked decisions.
  - §4 a consumer lint problem.
  - The state of the checks, and what was fixed on 2026-09-06 (token lint extended to `packages/ui`).
- **Duplicate of:** `ADMIN-SUMMARY.md` "What is still pending", which links here.
- **Wrong now:**
  - §4 (`L87-101`) lists `apps/consumer/src/app/(app)/home/page.tsx` and
    `apps/consumer/src/app/(app)/category/[id]/page.tsx`. **Neither file exists.** The third,
    `components/consumer-nav.tsx`, does.
  - §2 `L45` shows "390px mobile pass: In progress". `ADMIN-MOBILE-PLAN.md` records all ten mobile
    phases done by 2026-09-08.
- **Mentioned by:** `ADMIN-MOBILE-PLAN.md`, `ADMIN-SUMMARY.md`, `CONSUMER-OPEN-ITEMS.md` (4.3, 4.4).
  These are text mentions, not code.
- **Recommendation:** fold anything unique (the 2026-09-06 lint story) into `ADMIN-SUMMARY.md`, update
  the three mentions, then delete.

### 3.11 `ADMIN-MOBILE-PLAN.md` — **KEEP — REFERENCE** (history)

- **What:** the admin mobile-responsiveness plan in 10 phases (M1–M10) and its log:
  - **Target widths:** 390, 768 and 1280px. The 1280px desktop "Must not change at all".
  - **Touch targets:** at least 44px.
  - **Log:** every phase is recorded as done, M1–M4 on 2026-09-06 and M5–M10 on 2026-09-08.
- **Useful because:** it explains why the shared code has a `scrollbar-none` utility (`L252`), why
  `Button` extends its hit area under a coarse pointer (`L340`, `L398-399`), and why a custom `coarse:`
  variant exists ("does not exist in Tailwind v3", `L402`). Anyone touching `packages/ui` or the preset
  needs this (`APP-BOUNDARIES.md` §4).
- **Minor:** the header says "Last updated: 2026-09-06" although the log runs to 2026-09-08.
- **Mentioned by:** `ADMIN-PENDING.md`, `ADMIN-SUMMARY.md`.
- **Recommendation:** keep, or move to a history folder with the other admin plans.

### 3.12 `ADMIN-REBUILD-PLAN.md` — **OUTDATED** / **NEEDS YOUR DECISION**

- **What:** the 23-phase admin design-system rebuild plan: audit findings, the locked "Cobalt" palette
  (`L47`), "Four rules, enforced by lint" (`L79`), a progress table, phase specs, reuse list, verification.
- **Wrong now:**
  - The progress table (`L93-159`) shows **phases 17–23 as "Not started"**, and rows 17–22 (`L112-158`)
    contain raw text pasted from the screen inventory, which breaks the table. `ADMIN-SUMMARY.md` says 22
    of 23 phases are done with only Phase 10 skipped (Phase 10 is correctly "Not started", `L104`).
  - `L76` says "Inter. weights 400/500/600 only". All three apps load **Archivo**
    (`apps/*/src/lib/fonts.ts`), and the consumer also loads Plus Jakarta Sans. `bold`/`extrabold` were
    added locally.
  - `L49` says "No dark mode", while Customer 43 requires dark mode (`SCREEN-INVENTORY.md`). This is
    admin scope, so it may be intentional.
- **Still useful:** the palette rules behind `packages/tokens/src/tokens.css`.
- **Mentioned by:** `ADMIN-PENDING.md`, `ADMIN-SUMMARY.md`.
- **Recommendation:** either fix the progress table and keep it as history, or copy the palette rules into
  `ADMIN-SUMMARY.md` and delete.

### 3.13 `PRO-BUILD-PLAN.md` — **KEEP — REFERENCE** (history)

- **What:** the Pro app plan for 35 screens, written before building:
  - **What the app is**, and a six-point **layout doctrine**:
    1. Three widths.
    2. A rail on desktop and tabs on mobile.
    3. Action bars become docked panels at `lg:`.
    4. `coarse:` touch targets.
    5. Outdoor legibility.
    6. Confirmations for destructive actions.
  - **The rest:** the numbers the app may state, the 3 Golden Rules problem, web-platform conflicts, the
    earnings logic, ten phases, and the reuse list.
- **Accurate:** `PRO-VERIFICATION.md` reports the plan implemented. Pro code was not re-audited here.
- **References:** none.
- **Recommendation:** keep if you want the layout doctrine for future Pro work; otherwise it can go. The live
  questions are in `PRO-OPEN-ITEMS.md`.

### 3.14 `PRO-OPEN-ITEMS.md` — **KEEP — IN USE**

- **What:** Pro app open items:
  - **§1, six client decisions:** Golden Rules wording and penalty schedule; payout minimum; commission on
    Associate/Major Partners; what "first 20 jobs" counts; a pro serving several areas; account deactivation.
  - **§2, seven web-platform compromises** (2.1–2.7).
  - **§3** deferred items.
  - **§4, seven design-system findings** (4.1–4.7).
  - **§5** decisions verified and left alone.
- **Depended on by:** 11 Pro source files: `conduct`, `earnings/payout`, `jobs/[id]`, `notifications`,
  `settings`, `documents`, `otp`, `terms`, `job-offer-dialog.tsx`, `offer-listener.tsx`, `use-distance-to.ts`.
  Also 3 mocks files and 2 Pro docs.
- **NOT VERIFIED:** whether each client decision is still open.
- **Recommendation:** keep; it is the Pro counterpart of `CONSUMER-OPEN-ITEMS.md`.

### 3.15 `PRO-VERIFICATION.md` — **KEEP — REFERENCE** (history)

- **What:** Phase 10 verification of the Pro app ("Run date: 2026-09-09 · 35 of 35 screens built", `L6`):
  - **Checks passed:** `tsc` on four packages, `next lint`, `next build`.
  - **Defects:** four real defects fixed.
  - **Dead-class sweep:** "184 sizing classes, 0 dead".
  - **Audits:** fact, accessibility, responsive and business-rule checks.
- **Dated:** it predates the Next.js 15.1.12 bump (`b922c8c`) and the local changes to the shared preset
  and ESLint config. Those local changes were measured separately to leave Pro's compiled CSS
  byte-identical (`APP-BOUNDARIES.md` §7).
- **References:** none.
- **Recommendation:** keep as the Pro sign-off record, or delete; nothing depends on it.

### 3.16 `frontend/RUNBOOK.md` — **UPDATE** (minor)

- **What:** commands to run each app, run everything, typecheck/lint, add dependencies, and build.
- **Wrong now:** `L24` "To run only the Pro app (when built)", although Pro is built. `L6` hard-codes
  `c:\Users\muska\Downloads\cfc\frontend`.
- **Missing:** a warning that running `next build` in an app while its `next dev` is running overwrites the
  dev server's `.next` (`APP-BOUNDARIES.md` C-15). The file only lists build commands (`L69-78`).
- **Depended on by:** `README.md:L57`.
- **Recommendation:** fix the two lines and add the warning.

### 3.17 `frontend/myref.md` — **SAFE TO DELETE**

- **What:** personal notes of the shell commands used on day one: installing pnpm, moving folders into
  `apps/`, generating per-app configs, and the initial tree, which shows `ui/ (empty)` and
  `mocks/ (empty)` (`L75-76`).
- **Wrong now:** it describes the original scaffold. For example, the `.eslintrc.js` it writes (`L49`,
  `extends: ["@cfc/config/eslint-app"]`) differs from every app today, which all use
  `...require("@cfc/config/eslint-app.js")`.
- **References:** none.
- **How:** `git rm frontend/myref.md` (keep a private copy if you want the notes).

### 3.18 `cfc-handoff/CLAUDE-CODE-PROMPT.md` — **KEEP — REFERENCE** until the port is signed off

- **What:** the instructions for porting the two approved home pages:
  - **Steps:** get the files, paste the prompt, verify.
  - **The prompt itself**, with six hard rules (`L63-102`):
    1. Every character of copy is fixed.
    2. Every CSS value is fixed; copy `globals.css` "whole and unmodified".
    3. Keep the inline SVG sprite.
    4. Keep the interaction files as they are.
    5. Add no dependencies.
    6. Change no structure.
  - **Placement** (`L103`), section checklists, verification, and a "Do not" list.
- **What happened since:**
  - **Location:** the port lives at `frontend/apps/consumer/src/app/(home)/`, not at the `app/` paths in the
    placement table (`L110-111`).
  - **CSS (rule 2):** the stylesheet was scoped under `.cfc-page` rather than copied unmodified.
  - **Copy (rule 1):** deliberately broken for the category tiles, rail, trust row, pro band and testimonial
    label, because the prototype's figures were invented (`CONSUMER.md` I-01).
  - **Layout:** `L116-119` asks for the SEO metadata and JSON-LD to be merged into the root layout. **This
    was not done** (§4.1).
- **References:** none.
- **Recommendation:** keep while the client reviews the port; delete with the folder afterwards.

### 3.19 `cfc-handoff/DESIGN-NOTES.md` — **KEEP — REFERENCE**

- **What:** the rationale behind the approved pages:
  - **Colour:** five colours (`#0FB3A6`, `#07837A`, `#0B2239`, `#2456D6`, `#F5F8FA`, `L18-22`); "No orange
    anywhere, per the client" (`L25`).
  - **Type:** one typeface, Plus Jakarta Sans 400–800, display tracked `-0.035em`, `clamp()` headline.
  - **Emphasis:** one bold object, the search bar.
  - **Motion:** rationed, all of it disabled under `prefers-reduced-motion`.
  - **Structure and behaviour:** section order, voice search, and breakpoints at 1080, 900 and 620px.
  - **"Round two: what changed" (`L106`):** live search over "A 26-service catalogue", "Eleven cities in a
    popover", FAQ with six objections, JSON-LD.
  - **Signed-in page:** the rules for the second screen (`L156` onward).
- **Useful because:** it is the clearest statement of the design language now being applied to the rest of
  the consumer app (`CONSUMER.md` §9).
- **Claims to be aware of:**
  - `L57` calls the testimonials "real-sounding reviews".
  - The 26-service search catalogue and eleven-city picker do not match the mock data (16 services).
  - These are the unsourced items flagged in `CONSUMER.md` I-01.
- **References:** none.
- **Recommendation:** keep. If the handoff folder is deleted, move this file somewhere permanent first.

---

## 4. `cfc-handoff/`

**What it is:** the client-approved home-page prototype. It contains two standalone HTML files, a small
standalone Next.js project, and the prompt used to port it.

**Git state:**
- **On `main`:** 16 files are **STAGED**; nothing under `cfc-handoff/` is committed.
- **On the backup branch:** identical copies are committed on the local branch `backup/pre-handoff-port`
  (`cab1b4c`). `git diff --cached backup/pre-handoff-port -- cfc-handoff cfc-home.html` prints nothing, so
  the staged files match that commit.
- **Remote:** `git branch -a --contains cab1b4c` lists only that local branch, so no remote has these files.
- **Ignored:** a build folder, a dependencies folder and one generated file.

### 4.1 The 16 staged files

| File | Lines | What it is | Verdict |
|---|---|---|---|
| `CLAUDE-CODE-PROMPT.md` | 192 | Porting instructions (§3.18) | REFERENCE |
| `DESIGN-NOTES.md` | 208 | Design rationale (§3.19) | REFERENCE |
| `reference/cfc-home.html` | 2,179 | Standalone signed-out page, round two: the visual the client approved | REFERENCE (visual parity) |
| `reference/cfc-home-signed-in.html` | 2,013 | Standalone signed-in page | REFERENCE (visual parity) |
| `reference/cfc-nextjs/app/globals.css` | 1,043 | The shared stylesheet. Ported to `apps/consumer/src/app/(home)/home-pages.css` with selectors scoped to `.cfc-page`, the Google Fonts `@import` removed, and loading skeletons added | DUPLICATE (ported, since changed) |
| `reference/cfc-nextjs/app/page.tsx` | 570 | Signed-out page. Ported to `(home)/page.tsx`, which now reads real catalogue data and has corrected trust and pro-band copy | DUPLICATE (ported, since changed) |
| `reference/cfc-nextjs/app/interactions.js` | 462 | Signed-out behaviour. **Byte-identical** to `(home)/interactions.js` (checked with `cmp`) | DUPLICATE |
| `reference/cfc-nextjs/app/interactions.d.ts` | 1 | Types. **Byte-identical** to `(home)/interactions.d.ts` | DUPLICATE |
| `reference/cfc-nextjs/app/home/page.tsx` | 477 | Signed-in page. Ported to `(home)/home/page.tsx` (since changed) | DUPLICATE (ported, since changed) |
| `reference/cfc-nextjs/app/home/interactions.js` | 488 | Signed-in behaviour. The consumer copy differs in two places: the category-tile "service list not built yet" toast was removed (reference `L425-431`), and the cleanup function is assigned to a variable so a `refresh` can be attached (reference `L480`) | DUPLICATE (ported, since changed) |
| `reference/cfc-nextjs/app/home/interactions.d.ts` | 1 | Types. The consumer copy is now 12 lines | DUPLICATE (ported, since changed) |
| `reference/cfc-nextjs/app/layout.tsx` | 41 | Root layout with metadata and structured data: `metadataBase` `https://cityfamilycare.in` (`L5`); title; description "…and 40 more home services"; Open Graph ("Live in 11 cities across South India"); Twitter card. `L21` holds the JSON-LD: `areaServed` lists 11 cities (Bengaluru to Mangaluru), telephone `+91-1800-000-4567`, five support languages, and FAQ answers (free reschedule up to two hours before, damage covered up to 10,000 rupees if reported within 48 hours, 7 AM to 9 PM service). **Not merged into the consumer app**, which is correct while those claims are unsourced (`CONSUMER.md` §11.2). | REFERENCE; do not merge as is |
| `reference/cfc-nextjs/next.config.mjs` | 3 | `reactStrictMode: true` only | Part of the standalone project |
| `reference/cfc-nextjs/package.json` | 22 | Standalone project. Runtime dependencies are only `next ^15.3.0`, `react ^19.1.0` and `react-dom ^19.1.0`. The monorepo apps pin `next 15.1.12` and `react 19.0.0`. | Part of the standalone project |
| `reference/cfc-nextjs/package-lock.json` | 1,003 | **npm** lockfile (the monorepo uses pnpm) | Part of the standalone project |
| `reference/cfc-nextjs/tsconfig.json` | 40 | Standard Next.js tsconfig | Part of the standalone project |

### 4.2 Ignored material inside it

| Path | Contents | Verdict |
|---|---|---|
| `reference/cfc-nextjs/node_modules/` | 9,214 files, 361 MB (`next` 7,270 files, `caniuse-lite` 841, `@swc` 422, `typescript` 132) | **SAFE TO DELETE** (`npm install` recreates it) |
| `reference/cfc-nextjs/.next/` | 62 files, 40 MB of build output from running the reference site | **SAFE TO DELETE** |
| `reference/cfc-nextjs/next-env.d.ts` | Next.js type shim (ignored by root `.gitignore:L25`) | **SAFE TO DELETE** |

### 4.3 Recommendation for the folder

**NEEDS YOUR DECISION.**
- **Now:** delete the three ignored items in §4.2 at any time.
- **While the client compares the port with the approved design:** keep the two HTML files and
  `DESIGN-NOTES.md`. The rest is duplicated in the consumer app.
- **After sign-off:** move `DESIGN-NOTES.md` somewhere permanent if wanted, then
  `git rm -r --cached cfc-handoff` and delete the folder. A copy remains in `backup/pre-handoff-port`
  for as long as that local branch exists.

---

## 5. `frontend/` root and tooling

| File | Size | Git | What it is | Verdict |
|---|---|---|---|---|
| `package.json` | 604 B | COMMITTED | Workspace root `cfc-frontend`: `packageManager pnpm@11.25.0`, `engines.node >=20`. Scripts: `dev`, `dev:consumer`, `dev:pro`, `dev:admin`, `build`, `lint`, `typecheck` (all through Turbo) and `format` (Prettier). devDependencies: `prettier`, `turbo`, `typescript`. | **KEEP — IN USE** |
| `pnpm-workspace.yaml` | 211 B | COMMITTED | Workspaces `apps/*`, `packages/*`; `allowBuilds` for `sharp` and `unrs-resolver` | **KEEP — IN USE** |
| `pnpm-lock.yaml` | 201,949 B | COMMITTED | The single lockfile for every app and package. Never edit by hand. | **KEEP — IN USE** |
| `turbo.json` | 370 B | COMMITTED | `ui: tui`. `build` depends on `^build`, with outputs `.next/**` (excluding `.next/cache/**`) and `dist/**`. `dev` is uncached and persistent. `lint` and `typecheck` both depend on `^build`. | **KEEP — IN USE** |
| `.gitignore` | 377 B · 42 lines | COMMITTED | Frontend-level ignores, including `next-env.d.ts` (`L8`), `.turbo/` (`L15`) and `*.tsbuildinfo` (`L22`); overlaps the root `.gitignore` | **KEEP — IN USE** |
| `RUNBOOK.md` | 1,744 B · 79 lines | COMMITTED | §3.16 | **UPDATE** |
| `myref.md` | 3,483 B · 114 lines | COMMITTED | §3.17 | **SAFE TO DELETE** |
| `.turbo/` | `cache/`, `preferences/` | IGNORED | Turborepo cache | **SAFE TO DELETE** |
| `node_modules/` | — | IGNORED | pnpm install output | Regenerate with `pnpm install`; do not delete while working |

---

## 6. `frontend/packages/`, file by file

These five packages are shared by all three apps. **Change them only by following
`APP-BOUNDARIES.md` §10.**

**How usage was measured:**
- **App imports:** every `import { … } from "@cfc/…"` in `apps/*/src`, collected by name. The only `@cfc/…`
  specifiers the apps use are `@cfc/mocks`, `@cfc/tokens`, `@cfc/types`, `@cfc/ui` and `@cfc/ui/styles.css`.
- **Package-internal use:** every relative import inside a package, resolved to a file.
- **Mapping:** each name was matched to its source file through the package's `index.ts`. No imported name
  was left unmatched.

Component internals were not re-read line by line for this document. Roles come from each file's name,
exports and callers.

Legend: **C** consumer · **P** pro · **A** admin. Numbers are how many distinct names an app imports from
that file.

### 6.1 `packages/config/` (6 files) — all **KEEP — IN USE**

| File | Lines | Role | Used by |
|---|---|---|---|
| `package.json` | 21 | Exports the files below; depends on `tailwindcss 3.4.17` and `@tailwindcss/container-queries 0.1.1` | all apps and packages |
| `tailwind-preset.js` | 595 | The closed design scale and plugins. **MODIFIED locally** (+29 lines: weights `bold`/`extrabold`, spacing 16, 20, 24) | C, P, A `tailwind.config.js` |
| `eslint-app.js` | 143 | App lint rules. **MODIFIED locally** (spacing 16, 20, 24 no longer flagged) | C, P, A `.eslintrc.js` (each spreads `require("@cfc/config/eslint-app.js")`) |
| `eslint-package.js` | 139 | Package lint rules; still flags 16, 20, 24 (`L71`, `L81`; `APP-BOUNDARIES.md` B-02) | `packages/ui/.eslintrc.js` |
| `tsconfig-base.json` | 23 | Strict TypeScript base | Extended directly by `packages/{mocks,types,ui}/tsconfig.json`, and by `tsconfig-next.json` |
| `tsconfig-next.json` | 11 | Extends the base; adds the `next` plugin, `allowJs`, `noEmit`, `incremental`, `jsx: preserve` | C, P, A `tsconfig.json` |

### 6.2 `packages/tokens/` (3 files) — all **KEEP — IN USE**

| File | Lines | Role | Used by |
|---|---|---|---|
| `package.json` | 11 | Exports `.` (`src/index.ts`) and `./tokens.css` | all |
| `src/tokens.css` | 165 | Every CSS variable (palette, radii, shadows, focus, z-index, motion) | Imported by `packages/ui/src/styles.css:L1`, which every app layout imports (`admin layout.tsx:L5`, `consumer layout.tsx:L8`, `pro layout.tsx:L4`). The consumer then overrides most of it with `brand.css` (`consumer layout.tsx:L11`). |
| `src/index.ts` | 46 | JS mirrors: `SURFACE`, `INK`, `INK_MUTED`, `BORDER`, `STRUCTURE`, `ACTION`, `SERIES` | C `SURFACE`; P `STRUCTURE`; A `SURFACE`; `packages/ui` `BORDER`, `INK`, `INK_MUTED`, `SERIES`. **`ACTION` is imported by nobody** (NEEDS YOUR DECISION; harmless). |

### 6.3 `packages/types/` (21 files) — all **KEEP — IN USE**

`package.json` (15 lines), `tsconfig.json` (10), `src/index.ts` (27, a barrel). The 18 domain files:

| File | Lines | Exports | Example names | Apps | Used inside packages |
|---|---|---|---|---|---|
| `admin-user.ts` | 36 | 3 | `ADMIN_SECTIONS`, `AdminSection`, `SubAdmin` | A 3 | mocks; `permission.ts` |
| `booking.ts` | 99 | 7 | `BookingStatus`, `BookingListItem`, `BookingDetail` | A 5 | ui, mocks; `consumer.ts`, `customer.ts`, `dashboard.ts` |
| `catalog.ts` | 162 | 11 | `Category`, `SubCategory`, `ServiceVariant`, `ServiceDetail` | C 7 · P 1 · A 6 | mocks |
| `consumer.ts` | 234 | 9 | `ConsumerProfile`, `Review`, `ConsumerBooking`, `PublicPro`, `WalletTransaction` | C 7 · P 1 | mocks |
| `customer.ts` | 50 | 4 | `CustomerListItem`, `CustomerDetail`, `CustomerComplaint` | A 3 | mocks |
| `dashboard.ts` | 22 | 2 | `DashboardKpis`, `JobFeedItem` | A 2 | mocks |
| `finance.ts` | 72 | 11 | `TransactionMethod`, `TransactionListItem`, `Settlement` | A 11 | ui, mocks |
| `permission.ts` | 169 | 8 | `PERMISSIONS`, `Permission`, `Actor`, `can`, `canOpen` | A 5 | — |
| `pricing.ts` | 38 | 3 | `PriceBreakdown`, `CGST_BPS`, `SGST_BPS` | C 1 | mocks |
| `primitives.ts` | 97 | 11 | `Timestamp`, `DateOnly`, `Paise`, `BasisPoints`, `Id`, `GeoPoint`, `Address` | C 1 · A 2 | ui, mocks; imported by all 17 other domain files |
| `pro-earnings.ts` | 83 | 7 | `ProEarning`, `CFC_COMMISSION_BPS`, `COMMISSION_FREE_JOBS` | P 7 | mocks |
| `pro-job.ts` | 182 | 10 | `ProJobStatus`, `ProJob`, `ProJobTab` | P 8 | mocks |
| `pro-notification.ts` | 74 | 5 | `ProNotification`, `RatingBreakdown` | P 5 | mocks |
| `pro-profile.ts` | 114 | 8 | `ProService`, `WEEKDAYS`, `ProAvailability` | P 7 | mocks |
| `pro.ts` | 110 | 13 | `ProApprovalStatus`, `ProListItem`, `DocumentType` | P 3 · A 11 | ui, mocks |
| `promotion.ts` | 80 | 10 | `Coupon`, `Banner`, `TicketPriority`, `TicketStatus` (support tickets live here) | C 3 · P 1 · A 8 | ui, mocks |
| `quotation.ts` | 50 | 6 | `QuotationStatus`, `QuotationDetail` | C 1 · P 2 · A 4 | ui, mocks |
| `report.ts` | 82 | 9 | `RevenuePoint`, `BookingsPoint`, `PeakHourRow` | A 9 | mocks |

Every file is used. Export counts come from a pattern match on `export` declarations and may be slightly low.
Unused individual type names were not listed; removing a type saves nothing at runtime.

### 6.4 `packages/ui/` (61 files)

Also `package.json` (54 lines: Radix primitives, `class-variance-authority`, `clsx`, `date-fns`,
`lucide-react`, `react-day-picker`, `recharts`, `sonner`, `tailwind-merge`), `tsconfig.json` (10),
`.eslintrc.js` (5), `src/index.ts` (216, the public barrel) and `src/styles.css` (84). All
**KEEP — IN USE**.

| File | Lines | Apps (names) | Used inside ui by | Verdict |
|---|---|---|---|---|
| `primitives/alert-dialog.tsx` | 104 | C 8 · P 8 · A 9 | — | IN USE |
| `primitives/avatar.tsx` | 62 | C 4 (incl. `AvatarImage`) · P 3 · A 3 | — | IN USE |
| `primitives/badge.tsx` | 113 | C · P · A (`Badge`) | `status-badge` | IN USE |
| `primitives/button.tsx` | 163 | C · P · A (`Button`) | 8 files | IN USE |
| `primitives/calendar.tsx` | 72 | C | `date-range-picker` | IN USE |
| `primitives/checkbox.tsx` | 46 | P · A | `data-table` | IN USE |
| `primitives/dialog.tsx` | 88 | C 5 · P 4 · A 7 | `photo-grid` | IN USE (`DialogClose` imported by no app) |
| `primitives/dropdown-menu.tsx` | 59 | C 4 · A 5 | — | IN USE |
| `primitives/input.tsx` | 149 | C · P · A (`Input`) | `filter-bar` | IN USE |
| `primitives/popover.tsx` | 42 | C 3 | `combobox`, `date-range-picker`, `filter-bar` | IN USE (`PopoverAnchor` imported by no app) |
| `primitives/radio-group.tsx` | 33 | P 2 · A 2 | — | IN USE |
| `primitives/select.tsx` | 82 | A 5 | — | IN USE |
| `primitives/sheet.tsx` | 126 | C 6 · P 5 · A 5 | — | IN USE (`SheetClose`, `SheetDescription`, `SheetTrigger` imported by no app) |
| `primitives/skeleton.tsx` | 25 | C · P · A | `data-table`, `stat-card` | IN USE |
| `primitives/switch.tsx` | 60 | C · P · A | — | IN USE |
| `primitives/table.tsx` | 133 | A 8 | `chart-frame`, `data-table` | IN USE |
| `primitives/tabs.tsx` | 57 | P 3 · A 4 | — | IN USE |
| `primitives/textarea.tsx` | 23 | C · P · A | — | IN USE |
| `primitives/toast.tsx` | 32 | C · P · A (`Toaster`, `toast`) | — | IN USE |
| `primitives/tooltip.tsx` | 28 | A 1 (`TooltipProvider` only, in `apps/admin/src/app/(app)/layout.tsx`) | — | IN USE (`Tooltip`, `TooltipContent`, `TooltipTrigger` imported by no app; the `Tooltip` in the chart files is recharts' own) |
| `components/accordion.tsx` | 105 | C · P | — | IN USE; focus-ring issue B-11 |
| `components/combobox.tsx` | 217 | A | — | IN USE |
| `components/command-palette.tsx` | 310 | A 4 | — | IN USE |
| `components/countdown-ring.tsx` | 176 | P | — | IN USE |
| `components/data-table.tsx` | 574 | P 2 · A 4 | — | IN USE |
| `components/date-range-picker.tsx` | 224 | A 2 | — | IN USE |
| `components/detail-shell.tsx` | 242 | C 2 (`Timeline`, `TimelineItem`) · A 5 | — | IN USE (`DetailShell` imported by no app) |
| `components/filter-bar.tsx` | 345 | A 3 | — | IN USE |
| `components/form-field.tsx` | 75 | C · P · A | — | IN USE |
| **`components/form-shell.tsx`** | **70** | **none** | **none** | **SAFE TO DELETE** (§1.1). It imports `button`, so deleting it affects nothing else. |
| `components/inline-alert.tsx` | 99 | C · P · A | — | IN USE |
| `components/map-view.tsx` | 128 | C 1 · P 1 · A 2 | — | IN USE |
| `components/money-breakdown.tsx` | 180 | P | — | IN USE |
| `components/otp-display.tsx` | 88 | C | — | IN USE |
| `components/otp-input.tsx` | 177 | P | — | IN USE; focus-ring issue B-11 |
| `components/page-header.tsx` | 124 | A | — | IN USE |
| `components/pagination.tsx` | 141 | A | — | IN USE |
| `components/photo-capture.tsx` | 248 | P 2 | — | IN USE |
| `components/photo-grid.tsx` | 144 | C · P | — | IN USE; focus-ring issue B-11 |
| **`components/service-card.tsx`** | **93** | **none** | **none** | **SAFE TO DELETE** (§1.1). It imports `star-rating` and `format`, which apps still use directly, so both stay. `CONSUMER-OPEN-ITEMS.md` 4.2 mentions it as tech debt. The `tsconfig.tsbuildinfo` caches also mention it; they are regenerated. |
| `components/snap-scroller.tsx` | 65 | C | — | IN USE. `index.ts:L174-175` says "the pro app reuses StarRating and SnapScroller"; Pro does not import `SnapScroller`. |
| `components/star-rating.tsx` | 164 | C 2 · P 1 (`StarRating`) | `service-card` | IN USE; focus-ring issue B-11 |
| `components/stat-card.tsx` | 251 | A | — | IN USE (`Sparkline` imported by no app) |
| `components/states.tsx` | 188 | C 3 · P 2 · A 4 | `data-table` | IN USE (`LoadingState` imported by no app) |
| `components/status-badge.tsx` | 307 | C 2 (`BookingStatusBadge`, `TicketStatusBadge`) · A 11 | — | IN USE (`SlaClockBadge` imported by no app) |
| `charts/bar-chart.tsx` | 99 | A | — | IN USE |
| `charts/chart-frame.tsx` | 81 | P · A | — | IN USE |
| `charts/line-chart.tsx` | 96 | P · A | — | IN USE |
| `charts/theme.ts` | 23 | — | `bar-chart`, `line-chart` | IN USE |
| `charts/tooltip.tsx` | 39 | — (not exported from `index.ts`) | `bar-chart`, `line-chart` | IN USE |
| `lib/cn.ts` | 57 | C · P · A | most components | IN USE |
| `lib/csv.ts` | 52 | A 3 | — | IN USE |
| `lib/format.ts` | 160 | C 6 · P 3 · A 5 | `date-range-picker`, `money-breakdown`, `service-card` | IN USE |
| `lib/use-platform-key.ts` | 30 | A | — | IN USE |
| `lib/use-prefers-reduced-motion.ts` | 16 | C · P | `bar-chart`, `line-chart`, `countdown-ring` | IN USE |
| `lib/use-reorder.ts` | 134 | A | — | IN USE |

**Component exports that no app imports.** Only non-`Props` names are listed; variant helpers
(`badgeVariants`, `buttonVariants`, `inputVariants`) and chart helpers (`seriesColor`) are used inside the
package.
- **Whole files:** `ServiceCard` and `FormShell` (§1.1).
- **Individual exports in files that stay:** `DetailShell`, `LoadingState`, `SlaClockBadge`, `Sparkline`,
  `DialogClose`, `SheetClose`, `SheetDescription`, `SheetTrigger`, `PopoverAnchor`, `Tooltip`,
  `TooltipContent`, `TooltipTrigger`.

These individual exports are **NEEDS YOUR DECISION.** They are part of the design-system API; removing them
saves little and could cost a future screen.

### 6.5 `packages/mocks/` (53 files)

Also `package.json` (21 lines), `tsconfig.json` (10) and `src/index.ts` (252, the barrel; `L72-73` also
re-export `AREA_OPTIONS` and `SERVICE_NAMES` from fixtures). Everything below is **KEEP — IN USE**.

**`src/control.ts`** (106 lines) holds scenarios and latency. It is imported by every api file. Only the
consumer imports it directly (`setScenario`, `getScenario`, `Scenario`).

**API files** (what screens call):

| File | Lines | Apps (names) | Used by other mocks files | Exports nobody imports |
|---|---|---|---|---|
| `api/addresses.ts` | 101 | C 3 | `consumer-auth` | — |
| `api/admin-users.ts` | 28 | A 1 | — | — |
| `api/booking-draft.ts` | 206 | C 4 | — | — |
| `api/bookings.ts` | 147 | A 4 | — | — |
| `api/catalog.ts` | 55 | **C 4 · A 5** | — | — |
| `api/consumer-auth.ts` | 114 | C 4 | — | — |
| `api/customers.ts` | 67 | A 4 | — | — |
| `api/dashboard.ts` | 61 | A 2 | — | — |
| `api/faqs.ts` | 15 | C 1 | — | — |
| `api/finance.ts` | 37 | A 4 | — | — |
| `api/my-bookings.ts` | 153 | C 7 | — | — |
| `api/my-quotations.ts` | 102 | C 5 | — | `getMyQuotations`, `getPendingQuotationCount` |
| `api/my-support.ts` | 152 | **C 9 · P 3** (`raiseTicket`, `SUPPORT_PHONE`, `SUPPORT_HOURS`) | `pro-support` | — |
| `api/notifications.ts` | 44 | **C 4 · P 1** | — | — |
| `api/pro-conduct.ts` | 148 | P 5 | — | `acceptConduct` |
| `api/pro-earnings.ts` | 461 | P 13 | `pro-jobs`, `pro-offers`, `pro-profile`, `pro-work` | — |
| `api/pro-jobs.ts` | 449 | P 5 | `pro-offers` | — |
| `api/pro-notifications.ts` | 320 | P 7 | — | `getProUnreadCount` |
| `api/pro-offers.ts` | 185 | P 5 | — | — |
| `api/pro-onboarding.ts` | 243 | P 15 | — | `registerPro` |
| `api/pro-profile.ts` | 162 | P 6 | — | — |
| `api/pro-support.ts` | 143 | P 2 | — | — |
| `api/pro-work.ts` | 202 | P 7 | — | — |
| `api/promotions.ts` | 27 | **C 1 · A 4** | — | — |
| `api/pros.ts` | 77 | **P 2 · A 5** | — | — |
| `api/public-pro.ts` | 73 | C 2 | — | — |
| `api/quotations.ts` | 37 | A 2 | — | — |
| `api/referral.ts` | 46 | C 2 | — | — |
| `api/reports.ts` | 64 | A 10 | — | — |
| `api/reviews-submit.ts` | 85 | C 2 | — | — |
| `api/reviews.ts` | 50 | **C 3 · P 1** (`REVIEWS_ARE_PLACEHOLDER`) | — | `getServiceReviewCount` |
| `api/search.ts` | 80 | C 3 | — | — |
| `api/slots.ts` | 71 | C 1 | — | — |
| `api/wallet.ts` | 54 | C 4 | — | — |

The "Exports nobody imports" functions are referenced by no app and no other mocks file (only their own file
and `index.ts`). `CONSUMER-OPEN-ITEMS.md` mentions two of them:
- **2.16:** "A nav badge count is available via `getPendingQuotationCount` but not yet wired into the shell."
- **§9 `L228`:** `getServiceReviewCount` was added.

**NEEDS YOUR DECISION:** the mock API mirrors the future backend contract (`README.md`: "The mock API shape
is a contract with the backend team"), so unused functions may still be intended.

**Fixture files** (seed data; apps reach them only through api files and the two re-exports):

| Fixture | Lines | Used by |
|---|---|---|
| `fixtures/bookings.ts` | 265 | `api/bookings`, `api/dashboard`; `AREA_OPTIONS` re-exported (C, A) |
| `fixtures/catalog.ts` | 420 | `api/booking-draft`, `api/catalog`, `api/pro-onboarding`, `api/pro-profile`, `api/search` |
| `fixtures/customers.ts` | 147 | `api/customers` |
| `fixtures/discipline.ts` | 46 | `api/pros` |
| `fixtures/faqs.ts` | 60 | `api/faqs`, `api/my-support` |
| `fixtures/finance.ts` | 90 | `api/finance` |
| `fixtures/my-bookings.ts` | 233 | `api/my-bookings`, `api/reviews-submit` |
| `fixtures/notifications.ts` | 92 | `api/notifications` |
| `fixtures/promotions.ts` | 169 | `api/booking-draft`, `api/my-support`, `api/pro-support`, `api/promotions` |
| `fixtures/pros.ts` | 284 | 8 api files + `fixtures/discipline`, `fixtures/my-bookings`, `fixtures/reviews` |
| `fixtures/quotations.ts` | 69 | `api/dashboard`, `api/my-quotations`, `api/quotations` |
| `fixtures/reports.ts` | 136 | `api/reports` |
| `fixtures/reviews.ts` | 126 | `api/pro-notifications`, `api/public-pro`, `api/reviews` |
| `fixtures/seed.ts` | 84 | Exports `seeded`, `pickFrom`, `AREAS`, `CUSTOMER_NAMES`, `PRO_NAMES`, `SERVICE_CATALOG`, `SERVICE_NAMES`, `CATEGORY_ICON_BY_NAME`; used by 16 mocks files; `SERVICE_NAMES` re-exported (A) |
| `fixtures/wallet.ts` | 120 | `api/wallet` |

Every fixture is used. None is safe to delete.

---

## 7. `frontend/apps/pro` and `frontend/apps/admin`

These apps are accepted by the client and were **not** audited file by file (as agreed). What matters for
safety is in `APP-BOUNDARIES.md`. Inventory:

| | Pro | Admin |
|---|---|---|
| Files (excluding `node_modules`, `.next`, `.turbo`) | 62 | 38 |
| `src/app` | 36 files, 33 `page.tsx` | 15 files, 13 `page.tsx` |
| `src/components` | 8 | 5 |
| `src/lib` | 3 (incl. `fonts.ts`, Archivo) | 3 (incl. `fonts.ts`, Archivo) |
| `src/fonts` | 2 | 2 |
| `src/config` | — | 1 |
| `public/` | `logo.png`, `logo-mark.png`, `logo-white.png`, `logo-mark-white.png`, `manifest.webmanifest` | the same four logos |
| Root files | `.eslintrc.js`, `next-env.d.ts`, `next.config.js`, `package.json`, `postcss.config.js`, `tailwind.config.js`, `tsconfig.json`, `tsconfig.tsbuildinfo` | same |
| Generated (IGNORED) | `next-env.d.ts`, `tsconfig.tsbuildinfo`, `.next/`, `.turbo/` | same |
| Their docs | `PRO-BUILD-PLAN.md`, `PRO-OPEN-ITEMS.md`, `PRO-VERIFICATION.md` | `ADMIN-SUMMARY.md`, `ADMIN-PENDING.md`, `ADMIN-MOBILE-PLAN.md`, `ADMIN-REBUILD-PLAN.md` |

**Do not delete anything inside these apps** based on this audit. Nothing there was proven unused.

---

## 8. Generated and ignored material

All of these are recreated automatically. Delete them freely, **but stop any running `next dev` first**:
deleting `.next` under a running dev server makes it serve errors.

| Path | What | Recreated by |
|---|---|---|
| `frontend/node_modules/` and each app's and package's `node_modules/` | pnpm packages | `pnpm install` |
| `frontend/apps/{consumer,pro,admin}/.next/` | Next.js build and dev output | `next dev` / `next build` |
| `frontend/.turbo/`, `frontend/apps/{consumer,pro,admin}/.turbo/`, `frontend/packages/{mocks,types,ui}/.turbo/` | Turborepo cache and logs | `turbo` |
| `frontend/apps/{consumer,pro,admin}/tsconfig.tsbuildinfo` | TypeScript incremental cache | `tsc` / `next build` |
| `frontend/apps/{consumer,pro,admin}/next-env.d.ts` | Next.js type shim | `next dev` / `next build` |
| `cfc-handoff/reference/cfc-nextjs/node_modules/`, `.next/`, `next-env.d.ts` | Standalone reference project output (§4.2) | `npm install`, `next dev` |
| `~$IGINAL Website Development Agreement.docx` | Word lock file | Opening the document in Word |

---

## 9. Git housekeeping

None of these are files you delete by hand, but they decide what a commit or a push would contain.

| Item | State | Note |
|---|---|---|
| Staged on `main` | 16 `cfc-handoff/` files, root `cfc-home.html`, and the rename `(app)/page.tsx → (app)/browse/page.tsx` | A plain `git commit` would commit **only these**. Unstage what you do not want (`git restore --staged <path>`) before committing anything. See `CONSUMER.md` §2.2. |
| Modified, not staged | 28 consumer files, `packages/config/tailwind-preset.js`, `packages/config/eslint-app.js`, plus further unstaged edits to the renamed browse page (status `RM`) | See `CONSUMER.md` §2.2 and `APP-BOUNDARIES.md` §7 |
| Untracked | `frontend/apps/consumer/src/app/(home)/` (9 files) and `final/` (3 files) | Git does not protect these at all. Back them up. |
| `main` | `b922c8c` | Same commit as `agency/main`; one commit ahead of `origin/main` (`0ed3c1b`). Nothing committed on `main` is local-only; all the local work is uncommitted. |
| Branch `backup/pre-handoff-port` | `cab1b4c`, **local only** | "Backup: consumer redesign work before handoff port". Compared with `main`, 34 files differ. It contains the 16 `cfc-handoff/` files and `cfc-home.html` (identical to the staged ones); consumer components that no longer exist in the working tree (`marketing-nav.tsx`, `promo-row.tsx`, `promo-strip.tsx`, `cities-row.tsx`); and shared-file changes: `tokens.css` (+12 lines of `--gradient-promo-*` tokens), `tailwind-preset.js`, `eslint-app.js`. **NEEDS YOUR DECISION:** it is the only committed copy of that earlier work. |
| Branch `backup-before-author-rewrite` | `0ed3c1b`, local | The same commit as `origin/main`, so it holds nothing unique. **Safe to delete** (`git branch -D backup-before-author-rewrite`) once you no longer want the safety net. |
| `refs/original/*` | 4 refs, all at `1276f5e` | `refs/original/refs/heads/main`, `…/heads/backup-before-author-rewrite`, `…/remotes/agency/main`, `…/remotes/origin/main`. Left by `git filter-branch`. Remove deliberately with `git update-ref -d <ref>` for each, when sure. |
| Remotes | `agency`, `origin` | `agency` is reported to deploy to Vercel. **Do not push** without the owner's say-so. |

---

## 10. Which documents overlap

| Topic | Documents covering it | Suggested single home |
|---|---|---|
| Consumer file map and screens | `consumerscreens.md`, `final/CONSUMER.md` | `final/CONSUMER.md` |
| Consumer home-page design | `HOME-DESIGN-OPTIONS.md`, `cfc-handoff/DESIGN-NOTES.md`, `CONSUMER-OPEN-ITEMS.md` §9–10 | `DESIGN-NOTES.md` (approved) + `CONSUMER.md` §9 |
| Consumer entry and auth rule | `WEB-ENTRY-ARCHITECTURE.md`, `CONSUMER.md` §6–7 | `CONSUMER.md` |
| Consumer open issues | `CONSUMER-OPEN-ITEMS.md` (to 2026-09-10), `CONSUMER.md` §12 (2026-09-15) | Keep both; add a pointer between them |
| Admin status and remainder | `ADMIN-SUMMARY.md`, `ADMIN-PENDING.md` | `ADMIN-SUMMARY.md` |
| Admin history | `ADMIN-REBUILD-PLAN.md`, `ADMIN-MOBILE-PLAN.md` | A history folder, or delete |
| Pro history | `PRO-BUILD-PLAN.md`, `PRO-VERIFICATION.md` | A history folder, or delete |
| Commands | `README.md`, `frontend/RUNBOOK.md`, `frontend/myref.md` | `RUNBOOK.md` |
| Design-system traps (closed scale, opacity modifiers) | `README.md`, `CONSUMER-OPEN-ITEMS.md` §5, `HOME-DESIGN-OPTIONS.md`, `PRO-OPEN-ITEMS.md` §4, `ADMIN-MOBILE-PLAN.md`, `APP-BOUNDARIES.md` | `APP-BOUNDARIES.md` §4.4 + `CONSUMER.md` §9 |
| "No unsourced figures" rule | `PLATFORM-FACTS.md`, many code comments | `PLATFORM-FACTS.md` |

---

## 11. A safe order to clean up in

None of these steps require a push. Steps 1–4 do not change how any app behaves.

1. **Ignored, zero-risk files.**
   - Close Word, then delete `~$IGINAL…docx`.
   - Delete `cfc-handoff/reference/cfc-nextjs/node_modules/`, `.next/` and `next-env.d.ts` (about 400 MB).
   - Optionally, stop dev servers and delete `.next/`, `.turbo/` and `tsconfig.tsbuildinfo` across `frontend/`.
2. **Back up what git does not protect:** copy `frontend/apps/consumer/src/app/(home)/` and `final/` somewhere safe.
3. **Superseded and duplicate files.**
   - `git rm --cached cfc-home.html`, then delete it.
   - `git rm logo-removebg-preview.png logo-white-removebg-preview.png consumerscreens.md frontend/myref.md`.
4. **Decide and consolidate docs** (§1.3).
   - Resolve `HOME-DESIGN-OPTIONS.md`, the admin plans, and the Pro history files.
   - Update `README.md`, `RUNBOOK.md`, `WEB-ENTRY-ARCHITECTURE.md` and `IMAGE-BRIEF.md`.
   - Fix the contradicted rows of `CONSUMER-OPEN-ITEMS.md` (§3.4).
5. **Consumer-app deletions:** follow `CONSUMER.md` §14.1, then run `pnpm --filter @cfc/consumer build`.
6. **Shared-package deletions** (`service-card.tsx`, `form-shell.tsx`, and their `index.ts` lines `L195`,
   `L209`). Only do this by following `APP-BOUNDARIES.md` §10–11, because all three apps build against
   `packages/ui`.
7. **`cfc-handoff/`:** after client sign-off (§4.3).
8. **Git refs**, when comfortable (§9).
   - Delete `backup-before-author-rewrite` and the `refs/original/*` refs.
   - Decide on `backup/pre-handoff-port`.
9. **Commit** in reviewable pieces when you decide to. **Push** only with explicit approval.

---

## 12. What this audit could not check

- **The contents of `ORIGINAL Website Development Agreement.docx` and `cfcplatform.pdf`.** They were not read;
  `SCREEN-INVENTORY.md` and `PLATFORM-FACTS.md` were taken as faithful extracts.
- **Whether the admin and pro "pending" and "open" items are still pending.** Those apps' screens were not audited.
- **Whether the repository is public** (`.gitignore:L4` says so).
- **Which domain is correct**, `cfcservice.in` or `cityfamilycare.in` (§3.2).
- **The Vercel connection and the real state of the GitHub remotes** beyond the local tracking refs.
- **Whether `w-24` really compiles now** (§3.1). This is reasoned from the preset and was not compile-checked,
  because the Tailwind CLI in this environment did not scan content (`CONSUMER.md` §17).
- **Type-level usage inside `packages/types`.** Files were checked for use; individual type names were not.
