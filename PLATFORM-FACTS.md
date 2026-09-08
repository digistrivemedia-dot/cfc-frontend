# CFC — Platform facts

> Source: `cfcplatform.pdf`, Sections A and B (pages 1–16). Extracted verbatim.
> Nothing on any screen may state a rule, threshold, or figure that is not on
> this page. If a screen needs a number that is not here, ask the client — do
> not invent one.

## Roles — 7 across 3 tiers

**Tier 1 — Customer**
1. **Customer / User** — books via app or PWA, tracks the pro live, pays
   digitally or cash, rates and reviews. Receives quotations for complex jobs,
   accepts with a 50% advance or declines.

**Tier 2 — Admin** *(these three reach the admin panel)*
2. **Super Admin** — only one. Full platform control: pro onboarding, service
   and pricing, quotation approvals, commission settings, dispute resolution,
   reports, analytics, all configuration.
3. **Sub Admin** — supports the Super Admin day to day: bookings, support
   tickets, quotation queue, vendor approvals, as delegated.
4. **Area Admin** — operations within one assigned geographic area.
   **No external tool or third-party access at this level.** Local pro
   management and job oversight only.

**Tier 3 — Service professionals**
5. **Pro / Captain** — ground level. Accepts or rejects within 30 seconds,
   navigates, completes with OTP and before/after photos.
6. **Associate Partner** — mid-level, manages a small team of pros.
7. **Major Partner** — same structure as Associate; higher volume, larger team,
   negotiated commission.

## Domain constants

Every one of these is a real rule from the agreement.

| Rule | Value | Where it appears |
|---|---|---|
| Quotation approval window | **15 minutes** | Admin 4, 5 — pro cannot wait longer |
| Phone confirmation threshold | **above ₹5,000** | Admin 4, 5 |
| Before-photos on a quotation | **minimum 2** — none means auto-reject | Admin 5 |
| Template pricing | Admin sets fixed rates per service type; quotes exceeding the template trigger review | Admin 5, 28 |
| Pro accept timer | **30 seconds**, countdown shown, auto-reject on timeout | Pro 12 |
| No-pro-available alert | **2 minutes** with no acceptance | Admin 9, 10 |
| Pros notified per job | **3 nearest, simultaneously** — first to accept wins | Admin 10 |
| Auto-assign radius | **2 KM / 5 KM / 10 KM**, editable from the admin panel | Admin 47 |
| Rating priority | At equal distance, the higher-rated pro is notified first | Admin 47 |
| GPS proof | Pro must be **within 100 m** of the customer to mark complete | Admin 47 |
| Auto offline | Pro goes offline on accept, online on completion | Pro 11 |
| CFC commission | **15%** deducted from pro earning. **First 20 jobs at 0%** (onboarding offer) | Admin 29 |
| GST | **CGST 9% + SGST 9%**, on the **platform fee only** — never on the pro's professional fee | Admin 32, 34 |
| Platform fee | Admin-editable per service category, shown to the customer at checkout | Admin 28 |
| Pro payout | Daily payout option; auto-transfer to bank/UPI **within 48 hours** of completion | Admin 18 |
| Customer advance on quote accept | **50%**, balance on completion | Admin 5 |
| Auto-block threshold | Pro rating **below 2.5** | Admin 17 |
| Reviews | **OTP-gated** — rating only after OTP confirmation | Customer 30 |

## Billing — three layers

| Layer | Who sees it | Contents |
|---|---|---|
| Customer Invoice | Customer | Service name, pro name, total paid, payment mode, CFC branding |
| Tax Invoice | Customer + Admin | Service fee, platform fee, CGST 9%, SGST 9%, total payable |
| Internal Settlement | **Admin only** | Customer paid total, pro share, CFC platform fee, GST collected, net to each party |

Invoice PDF is auto-generated per booking and downloadable by the customer.

## Service categories — admin managed, 50+ services

All categories, sub-categories, services and pricing are created and managed
entirely by the Admin. **Nothing is hardcoded.** Launch categories:

| Category | Sample services |
|---|---|
| Home & Maintenance | Electrical, Plumbing, Painting, Carpentry, Civil Work, AC, RO, Appliance Service, Home Cleaning, Pest Control, Water Service |
| Lifestyle & Personal | Laundry, Tailoring, Beautician, Salon, Computer/Laptop/Mobile Repair, Vehicle Repair, Cab, Auto, Ticket Booking, Parcel, Packers & Movers, Home Tuition |
| Health & Care | Medicine Delivery, Doctor Booking, Ambulance 24x7, Clinical Home Care, Nurse Service |
| Event & Function | Marriage/Anniversary Organiser, Catering, Photography, Decoration, Sound & Light, Security Guard, Equipment Rental |
| Business & Others | Rental Management, Real Estate, HR Consulting, College Admissions, Family Travel Packages |

## Quotation flow — the panel's priority path

1. **Pro app** — pro visits the site, assesses, submits a quotation with
   before-photos, material list and labour cost.
2. **Admin panel** — reviews quote, photos, material list.
   **Approve / Edit & Approve / Reject within 15 minutes.**
3. **Customer app** — receives the notification, views details and photos.
   Accepts (pays 50% advance) or declines.
4. **Pro app** — confirmation, starts work, uploads before/after photos,
   completes with the customer's OTP.
5. **All** — balance collected, invoice auto-generated, pro wallet credited,
   CFC platform fee settled.

## Standard booking flow — 3-click target

Service select → Service details + slot → Address + contact →
Payment summary → Booking confirmed.

## Brand and design requirements

- **CFC design system — "Blue + Orange"** (Phase 1 deliverable).
- Domain: **cfcservice.in** (client owned).
- Complete editable **Figma** source file with components, colour styles and
  icons must be handed over (clause 4.7).
- **Multi-language, customer screens**: JSON-based translation —
  English, Tamil, Kannada, Hindi, Telugu. Switching must not need an app
  restart (clause 4.6). *Admin panel is not named in this clause.*
- Customer Settings screen requires **dark mode** (Customer 43).
- Admin panel must be **mobile friendly** (section 4.3 heading).

## Not stated anywhere — do not claim

These have been asserted on screens before and have **no source**:

- Session length or inactivity timeout
- Password-reset link expiry
- Any city as the product's scope. Trichy/Tamil Nadu is the legal jurisdiction
  in Section C, not a limit on where the platform operates. The doc says
  "city-level operations and scale across all over india".
- Screen counts, role counts or language counts used as marketing figures

## Tech stack — admin panel

Next.js. Backend Node.js + Express + MongoDB, Firebase Auth + JWT, RBAC for the
7 roles. Razorpay. Google Maps SDK. FCM push. MSG91 SMS (DLT compliant).
WhatsApp via a client-managed BSP.
