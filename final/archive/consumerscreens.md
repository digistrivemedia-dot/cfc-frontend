Consumer App — File Map
Routes (src/app/) — one file per screen number, taken from each file's own header
(auth) group — no nav/footer shell, full-screen
Screen #	File	What it is
1	(auth)/splash/page.tsx	Brand splash, auto-advances to onboarding or home
2	(auth)/onboarding/page.tsx	Walkthrough carousel, first-run only
3	(auth)/login/page.tsx	Mobile number → OTP
4	(auth)/register/page.tsx	Name, mobile, area
5	(auth)/otp/page.tsx	Shared 6-digit OTP screen — used by login, register and forgot-password (one file, three entry points via ?from=)
6	(auth)/forgot-password/page.tsx	Reset via OTP
(auth)/layout.tsx — the shell wrapper for all six above (centred card, no header/footer).

(app) group — has nav bar, footer, mobile tab bar
Screen #	File	What it is
7	(app)/page.tsx	Home — served at / directly
8, 9	(app)/search/page.tsx	Search box + results, one file, ?q= driven
10, 11	(app)/categories/page.tsx	All categories → sub-category drill-down, one file via ?cat=&sub=
12	(app)/service/[id]/page.tsx	Service detail — gallery, variants, reviews, FAQs
13	(app)/pro/[id]/page.tsx	Pro profile — bio, jobs done, reviews
—	(app)/cart/page.tsx	Basket (not in the original 44 — added because the header linked to it and it 404'd)
15	(app)/book/[id]/page.tsx	Booking flow — slot picker, address, checkout steps
—	(app)/book/[id]/checkout-steps.tsx	Sub-component: the step-by-step form inside booking
—	(app)/book/[id]/confirmation.tsx	Sub-component: success state after a booking is placed
24	(app)/quotes/[id]/page.tsx	State after accepting a custom quote
25	(app)/bookings/page.tsx	My bookings list
26	(app)/bookings/[id]/page.tsx	One booking's detail
27	(app)/bookings/[id]/track/page.tsx	Live map + countdown while pro travels
30	(app)/bookings/[id]/review/page.tsx	Rate and review after job completion
31, 32	(app)/bookings/[id]/invoice/page.tsx	Customer invoice + tax invoice, one file
34	(app)/profile/page.tsx	Edit personal details
36, 37	(app)/wallet/page.tsx	Wallet balance + full transaction statement
38	(app)/refer/page.tsx	Refer and earn
39	(app)/notifications/page.tsx	Notifications list
40	(app)/support/page.tsx	FAQ accordion + raise a ticket
43, 44	(app)/settings/page.tsx	Account settings + links into legal
44	(app)/legal/[doc]/page.tsx	Terms/privacy/refund doc viewer
(app)/layout.tsx — the shell wrapper for everything above: top nav, mobile top bar, footer, cart bar, bottom tab bar.

app/layout.tsx — the root layout (fonts, providers: session/cart/area contexts).

Components (src/components/)
File	Role
consumer-nav.tsx	Desktop top nav + mobile top bar + mobile bottom tab bar (all three live here)
consumer-footer.tsx	Site footer
app-main.tsx	Content wrapper — reserves space for whichever fixed bars are showing
home-hero.tsx	Home screen's hero band
category-strip.tsx	Sticky filter strip pinned under the header on Home
shop-service-card.tsx	The reusable "service card with Add/stepper" used in every grid
subcategory-tile.tsx	Photo tile for one sub-category on Home/Categories
active-booking-card.tsx	The "job in progress" banner at top of Home when one exists
banner-carousel.tsx	Promo banner carousel on Home
quick-actions.tsx	Pill row of top services
area-picker.tsx	The "Serving [area] — Change" dropdown in the header
cart-button.tsx	Basket icon + count in the header
cart-bar.tsx	Persistent bottom checkout bar (appears once basket has items)
auth-dialog.tsx	Sign-in modal, triggered without leaving the page (e.g. from cart)
auth-shell.tsx	Shared two-column layout wrapping all six (auth) screens
require-account.tsx	Guard component — blocks a personal screen for a guest with a screen-specific message
logo.tsx	The CFC brand mark (shield + house)
coming-soon.tsx	Placeholder for a route not yet built
scenario-hook.tsx	Dev-only console hook (__cfc.empty() etc.) for testing states
Lib (src/lib/) — app-wide state, all React Context + localStorage
File	Holds
session.tsx	Signed-in/out state
cart.tsx	Basket contents
area.tsx	Selected service area
fonts.ts	Next.js font loading config
How to read a route: the folder path under app/ is the URL. (app) and (auth) are route groups — the parentheses mean they don't appear in the URL, they just pick which layout wraps the page. A [id] folder is a dynamic segment (/service/abc123). Several inventory screens share one file because they're really one interaction (search+results, category+drill-down, invoice+tax-invoice) — that's a deliberate choice recorded in each file's own header comment, not a missing screen.

Want this as a one-page reference doc you can keep open while reviewing, or is the list above enough?

