# CFC — Complete Screen Inventory

> Source: `ORIGINAL Website Development Agreement.docx` — Section B, Clause 4 "Complete Screen Inventory"
> Extracted verbatim. Screen names and descriptions are exactly as written in the agreement.

**From the agreement:**
> All screens listed are in scope. Each section ends with a flexibility note for client-requested additions during or after development.

---

## Totals (as stated in the agreement)

| Platform | Screens | Status |
|---|---|---|
| Customer App (Android + iOS + PWA) | 44 | In Scope |
| Pro App (Android + iOS) | 35 | In Scope |
| Super Admin Web Panel | 49 | In Scope |
| **TOTAL** | **128** | + Custom screens as required |

> \+ Additional customized screens based on client workflow and requirements

---

# 4.1. Customer App (Android + iOS + PWA)

## Onboarding & Authentication

| # | Screen | Description |
|---|---|---|
| 1 | Splash Screen | CFC branding, blue+orange logo animation |
| 2 | Onboarding Walkthrough (3 slides) | One Step Solution, Verified Pros, 30-Day Warranty highlights |
| 3 | Login Screen | Mobile OTP login |
| 4 | Register Screen | Name, mobile, area registration |
| 5 | OTP Verification Screen | 6-digit OTP, auto-read, resend timer |
| 6 | Forgot Password Screen | Reset via OTP |

## Home & Discovery

| # | Screen | Description |
|---|---|---|
| 7 | Home Screen | Service grid, promo banners, Most Booked section, Why CFC, Join as Pro banner, testimonials, voice search |
| 8 | Search Screen | Text + Voice search, recent searches, trending services |
| 9 | Search Results Screen | Filtered list, sort by rating/price/distance |
| 10 | Category Listing Screen | All services under a category with pricing preview |
| 11 | Sub-category Listing Screen | Drill-down into service types |
| 12 | Service Detail Screen | Description, pricing, inclusions, warranty badge, ratings, FAQs |
| 13 | Pro Profile Screen | Bio, skill tags, rating, reviews, job count, verified badge |

## Booking Flow

| # | Screen | Description |
|---|---|---|
| 14 | Select Service Options | Variant picker, add-ons, quantity |
| 15 | Select Date & Time Slot | Calendar + slot grid, AM/PM |
| 16 | Address Selection | Saved addresses, map pin, detect location |
| 17 | Add / Edit Address | Address form with landmark, type (Home/Work/Other) |
| 18 | Booking Summary | Full order summary, visit charge shown, platform fee shown |
| 19 | Apply Coupon / Promo Code | Coupon input, available offers, discount preview |
| 20 | Payment Screen | UPI/Card/Wallet/Cash. Razorpay integration. Total with GST. |
| 21 | Booking Confirmation | Success animation, booking ID, Pro ETA, Add to Calendar |

## Quotation Flow

| # | Screen | Description |
|---|---|---|
| 22 | Quotation Received Screen | Notification + full quotation details, material list, before-photos |
| 23 | Quotation Accept Screen | Accept with 50% advance payment, Decline, Ask Question |
| 24 | Quotation Accepted Confirmation | Advance paid confirmation, balance due reminder, Pro start time |

## Tracking & Orders

| # | Screen | Description |
|---|---|---|
| 25 | My Bookings Screen | Tabs: Upcoming / Ongoing / Completed / Cancelled |
| 26 | Booking Detail Screen | Full info, cancel/reschedule, contact Pro |
| 27 | Live Tracking Screen | Real-time map, Pro location pin, ETA countdown, job status timeline |
| 28 | Work In Progress Screen | Pro arrived status, before/after photos visible, call Pro |
| 29 | Service In-Progress Screen | OTP shown to Pro, job timer, status updates |

## Post-Service & Billing

| # | Screen | Description |
|---|---|---|
| 30 | Rate & Review Screen | Star rating (shown only after OTP confirmation), written review, feedback chips |
| 31 | Customer Invoice Screen | Service summary, Pro name, total paid, payment mode |
| 32 | Tax Invoice Screen | Platform fee, CGST 9%, SGST 9%, total payable, PDF download |

## Account & Profile

| # | Screen | Description |
|---|---|---|
| 33 | My Profile Screen | Avatar, name, phone, area, stats |
| 34 | Edit Profile Screen | Editable fields, photo upload |
| 35 | My Addresses Screen | Saved addresses, add/edit/delete |
| 36 | My Wallet Screen | Balance, add money, transaction history |
| 37 | Transaction History Screen | All payments, refunds, wallet credits |
| 38 | Refer & Earn Screen | Referral code, share link, rewards tracker |
| 39 | Notifications Screen | All alerts — bookings, offers, quotations, reminders |
| 40 | Help & Support Screen | FAQ accordion, raise ticket, call CFC helpline |
| 41 | Chat / Support Ticket Screen | In-app chat with CFC support team |
| 42 | AI Chat Assistant Screen | AI-powered assistant for service discovery and booking help |
| 43 | Settings Screen | Notifications, language, dark mode, logout |
| 44 | About / Terms / Privacy Screen | Legal pages, version info, app rating CTA |

> \+ Additional customized screens based on client workflow and requirements

---

# 4.2. Pro App (Android + iOS)

## Onboarding & Authentication

| # | Screen | Description |
|---|---|---|
| 1 | Splash Screen | CFC Pro branding animation |
| 2 | Login Screen | Mobile OTP login |
| 3 | Register Screen | Name, service type, area, mobile number |
| 4 | OTP Verification Screen | Mobile OTP, auto-read |
| 5 | Profile Setup Screen | Photo, skills, experience, service area selection |
| 6 | Document Upload Screen | Aadhaar front/back, PAN, bank details, selfie |
| 7 | Bank / UPI Details Screen | Account number, IFSC, UPI ID for daily payouts |
| 8 | Terms & Conditions Screen | CFC Partner Code of Conduct acceptance |
| 9 | Approval Pending Screen | Waiting for Admin KYC verification |

## Home / Dashboard

| # | Screen | Description |
|---|---|---|
| 10 | Home / Dashboard Screen | Today earning card, GO ONLINE big green button, new job feed, quick stats (completed, pending, rating, total earning), support section |
| 11 | GO ONLINE / OFFLINE Toggle | Full-screen status change. Online = accepting jobs. Auto-offline on accept. Auto-online on complete. |
| 12 | New Job Alert Screen | Full-screen popup. 30-second countdown timer. Service, customer, location, earning shown. [ACCEPT] big green, [DECLINE] grey small. |
| 13 | Job Accepted Screen | Status: On The Way. Customer name, address, [Navigate], [Call Customer], [Chat on WhatsApp], [I'm Here] button. |
| 14 | Navigation Screen | Google Maps turn-by-turn to customer location |
| 15 | Work In Progress Screen | [Upload Before Photos], [Add Extra Charges], [Complete Job] button. GPS proof active. |
| 16 | Add Quotation Screen | Work description, material list with costs, total quote, before-photo upload mandatory, [Submit for Approval] |
| 17 | Quotation Status Screen | Pending / Approved / Rejected by Admin. Rejection reason shown. |
| 18 | Complete Job Screen | Customer OTP input, before/after photos, final amount confirmation, [Mark Complete] |
| 19 | Job Completed Screen | Earning shown (gross + CFC fee deducted + net). Credited in 24 hours. Ask for rating. |
| 20 | My Jobs Screen | Tabs: Active / Upcoming / Completed / Cancelled |
| 21 | Job Detail Screen | Full job info, customer contact, service checklist, notes, photos |

## Earnings & Payouts

| # | Screen | Description |
|---|---|---|
| 22 | Earnings Screen | Today / This Week / This Month. Full breakdown: gross, CFC fee, GST note, net earned. Chart view. |
| 23 | Transaction History Screen | Per-job payout records with full settlement breakdown |
| 24 | Withdrawal / Payout Screen | Daily payout trigger, minimum threshold, bank/UPI selection, status tracking |
| 25 | Pending Payments Screen | Jobs completed but payment pending. Status tracking. |

## Profile & Account

| # | Screen | Description |
|---|---|---|
| 26 | My Profile Screen | Photo, name, rating badge, verified tag, CFC Pro ID, skill tags |
| 27 | Edit Profile Screen | Bio, skills, service area, experience, contact info |
| 28 | My Services Screen | Services offered, pricing per service, enable/disable toggle |
| 29 | Availability / Schedule Screen | Weekly grid, off-day blocking, holiday mode |
| 30 | Ratings & Reviews Screen | All customer reviews, average rating, response option |
| 31 | Notifications Screen | Job alerts, payout updates, platform announcements, warnings |
| 32 | Help & Support Screen | FAQ, raise ticket, call CFC helpline |
| 33 | Settings Screen | Notification preferences, language, account deactivation |

## Discipline & Compliance

| # | Screen | Description |
|---|---|---|
| 34 | Warning / Penalty Screen | Shows active warnings, penalty deductions, reason, and escalation path |
| 35 | Partner Code of Conduct Screen | CFC 3 Golden Rules, penalty structure, sign-off confirmation |

> \+ Additional customized screens based on client workflow and requirements

---

# 4.3. Super Admin Web Panel (Mobile Friendly)

## Auth & Dashboard

| # | Screen | Description |
|---|---|---|
| 1 | Admin Login Screen | Email + password, 2FA support |
| 2 | Forgot Password Screen | Reset via secure email link |
| 3 | Main Dashboard | KPI cards: New Bookings, Pending Quotes, Active Jobs, Total Earning. Live job feed. Quick access to approval queue. |

## Quotation Management — Priority Screen

| # | Screen | Description |
|---|---|---|
| 4 | Pending Quotations Screen | Live queue of all pending quotes. Job ID, Pro, Customer, Service, Amount. [Approve] [Edit & Approve] [Reject] per row. |
| 5 | Quotation Detail Screen | Full quote view: Pro notes, before-photos, material list, customer history. Approve/Edit/Reject with reason. |

## Bookings & Jobs

| # | Screen | Description |
|---|---|---|
| 6 | All Bookings List | Master booking table, status filters, date range, export CSV |
| 7 | Booking Detail Screen | Full booking info, user+Pro info, timeline, status override |
| 8 | Booking Status Management | Force status updates, admin intervention on disputes |
| 9 | Live Jobs Map | Real-time map showing all active Pros and their job locations |
| 10 | Manual Job Assignment | Assign any job to any available Pro. Override auto-assign. |

## Pro Management

| # | Screen | Description |
|---|---|---|
| 11 | All Pros List | Paginated table with online/offline status live. Search, filter by service/area/status. |
| 12 | Pro Detail Screen | Full profile, documents, earnings history, job stats, ratings, warnings |
| 13 | Pro Approval / Rejection Screen | Review KYC documents, Aadhaar/PAN, approve or reject with remarks |
| 14 | Pro Document Verification Screen | Document viewer, approve per document type |
| 15 | Block / Unblock Pro | Toggle access, reason required, audit trail |
| 16 | Pro Wallet Screen | Balance, job-wise credits, pending payouts, manual adjustment |
| 17 | Warning / Penalty Management | Issue warnings, apply penalties, track escalations |
| 18 | Payout Approval Screen | Pending payouts list, approve individual or batch, transfer status |

## Customer Management

| # | Screen | Description |
|---|---|---|
| 19 | All Customers List | Search, filter, view all customers |
| 20 | Customer Detail Screen | Profile, booking history, wallet, complaints, no-show count |
| 21 | Block / Unblock Customer | Account moderation with reason logging |

## Service & Pricing Management

| # | Screen | Description |
|---|---|---|
| 22 | Categories List | All service categories, drag-to-reorder, active/inactive toggle |
| 23 | Add / Edit Category | Name, icon, description, sort order, status |
| 24 | Sub-categories List | Nested categories management |
| 25 | Add / Edit Sub-category | Name, parent, icon, status |
| 26 | Services List | All services with pricing preview, search, filter |
| 27 | Add / Edit Service | Name, description, images, variants, inclusions, warranty info |
| 28 | Pricing Management | Base price, platform fee (editable), visit charge, night surcharge, city-wise override |
| 29 | Commission Settings | Platform commission % per category / per Pro / special rates for partners |

## Payments & Finance

| # | Screen | Description |
|---|---|---|
| 30 | Transactions List | All payment records, filters by method/status/date |
| 31 | Revenue Dashboard | Today / Weekly / Monthly revenue. Platform fee collected. GST collected. Charts. |
| 32 | Settlement Screen | Per-booking internal settlement: Customer paid, Pro share, CFC fee, GST breakdown |
| 33 | Refund Management | Refund requests, approve/reject, 1-click Razorpay refund |
| 34 | GST Reports | Monthly GST collected — CGST, SGST, total. Export for filing. |

## Promotions & Banners

| # | Screen | Description |
|---|---|---|
| 35 | Coupons / Promo Codes | Active coupons, usage stats, enable/disable |
| 36 | Add / Edit Coupon | Code, discount type, max uses, expiry, user restrictions, first-booking only option |
| 37 | Banners / Offers Management | Homepage banners, image upload, link to category/service, scheduling |

## Reports & Analytics

| # | Screen | Description |
|---|---|---|
| 38 | Revenue Reports | Revenue by date/category/area, charts, Excel export |
| 39 | Bookings Reports | Volume, completion rate, cancellation analysis, peak hours |
| 40 | Pro Performance Reports | Job completion rates, ratings trends, top earners, no-show count |
| 41 | Service Demand Reports | Which services are booked most, which areas have highest demand |
| 42 | Customer Reports | New signups, retention, repeat booking rate, MAU/DAU |

## Support & Communications

| # | Screen | Description |
|---|---|---|
| 43 | Support Tickets List | All open/closed tickets, priority filter, assign to agent |
| 44 | Ticket Detail / Reply | Thread view, internal notes, status update, resolve |
| 45 | Push Notification Manager | Compose and send push to all users / Pros / specific segments |
| 46 | WhatsApp / SMS Alert configuration | Configure automated alerts: booking confirm, job assigned, OTP, payout |

## Platform Settings

| # | Screen | Description |
|---|---|---|
| 47 | Platform Settings Screen | App configs, maintenance mode, feature flags, auto-assign radius, geofencing |
| 48 | Admin Profile Screen | Admin name, role, password change, 2FA setup |
| 49 | Sub Admin Management | Add/remove sub admins, assign permissions, area assignment for Area Admins |

> \+ Additional customized screens based on client workflow and requirements

---

# Related requirements from the agreement

These clauses directly affect how the screens above are built.

**Clause 4.6 — Multi-Language Architecture**
> All Customer screens must be multi-language ready - JSON based translation system - English, Tamil, Kannada, Hindi, Telugu. Language switch should not need app restart.

**Clause 4.7 — Figma Design File Owner**
> Complete editable Figma source file with components, color styles, icons must be handed over

**Clause 4.8 — API Performance & Security**
> API should handle 10,000 concurrent users, MongoDB indexing for search, and daily auto-backup restoration test needed

**Section 2 — Project Timeline, Phase 1**
> The first 2 weeks are fully dedicated to UI/UX design and frontend mockups before any development begins. Client approval of designs is required before Week 3 begins.
> High-fidelity mockups for all 128 screens, CFC design system (Blue + Orange), component library, Figma link shared with client, design approval sign-off

**Screen 43 (Customer) / Settings** — requires dark mode support.

**User roles referenced across admin screens (Section B, Clause 2) — 7 roles:**
Customer / User · Super Admin · Sub Admin · Area Admin · Pro / Captain · Associate Partner · Major Partner
