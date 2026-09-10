import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SUPPORT_HOURS, SUPPORT_PHONE } from "@cfc/mocks";
import { Logo } from "@/components/logo";

/**
 * The site footer.
 *
 * A footer is not decoration on a marketplace. It is where a customer checks
 * whether the business is real before handing over an address and a card: a
 * phone number that answers, an operating area, and terms that exist. Its
 * absence is one of the first things that reads as unfinished.
 *
 * It used to be `hidden md:block` — desktop only — on the reasoning that the
 * mobile tab bar already carried every destination. That was wrong twice over.
 * The argument contradicted itself: a footer that proves the business is real
 * cannot do that while being hidden from the roughly ninety per cent of
 * visitors who arrive on a phone, which is exactly the audience that has never
 * heard of CFC and most needs convincing. And the premise no longer held — a
 * signed-out visitor has no tab bar at all now, so they were left with no
 * phone number, no service area and no legal links anywhere on the site.
 *
 * On a phone it condenses rather than disappearing: contact details stay open,
 * the three link columns stack, and the type steps down. Extra bottom padding
 * clears the tab bar for signed-in customers, who do still have one.
 */

// These used to point at `?cat=cat_01` - the five ADMIN category buckets,
// which /categories no longer surfaces as a browsing concept (see that
// file's header comment). Pointed at real sub-categories instead: the same
// ten Home's "Browse by category" grid shows, so a footer link lands on
// exactly the screen a customer would reach by clicking the equivalent tile
// on Home, not a dead `cat=` param that now falls through to "all services".
const SERVICE_LINKS = [
  { label: "All services", href: "/categories" },
  { label: "Cleaning", href: "/categories?sub=Cleaning" },
  { label: "Electrical & AC", href: "/categories?sub=Electrical+%26+AC" },
  { label: "Plumbing", href: "/categories?sub=Plumbing" },
];

const ACCOUNT_LINKS = [
  { label: "My bookings", href: "/bookings" },
  { label: "Wallet", href: "/wallet" },
  { label: "Refer and earn", href: "/refer" },
  { label: "Help and support", href: "/support" },
];

const LEGAL_LINKS = [
  { label: "Terms of service", href: "/legal/terms" },
  { label: "Privacy policy", href: "/legal/privacy" },
  { label: "Refund and cancellation", href: "/legal/refunds" },
];

export function ConsumerFooter() {
  return (
    <footer className="mt-12 bg-structure">
      {/* `pb-tab-bar` on a phone clears the fixed bottom tab bar a signed-in
          customer has, so the last row of links is never sitting underneath
          it. Harmless for a guest, who has no tab bar. */}
      <div className="mx-auto max-w-screen-xl px-4 pb-tab-bar pt-8 md:px-6 md:py-panel md:pb-panel lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr]">
          {/* Who we are, and how to reach a person. */}
          <div className="min-w-0">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="size-mark text-brand" />
              <span className="text-heading font-semibold tracking-tight text-on-structure">
                City Family Care
              </span>
            </Link>

            <p className="mt-3 max-w-prose text-small text-on-structure-muted">
              Verified professionals for repairs, cleaning, beauty and care —
              booked at a fixed price, with a 30-day warranty on every job.
            </p>

            <ul className="mt-4 space-y-2 text-small">
              <li>
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="flex items-center gap-2 text-on-structure hover:text-brand-bright"
                >
                  <Phone className="size-4 shrink-0 text-on-structure-muted" aria-hidden="true" />
                  <span className="tabular">{displayPhone(SUPPORT_PHONE)}</span>
                  <span className="text-caption text-on-structure-muted">
                    · {SUPPORT_HOURS}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:help@cityfamilycare.in"
                  className="flex items-center gap-2 text-on-structure hover:text-brand-bright"
                >
                  <Mail className="size-4 shrink-0 text-on-structure-muted" aria-hidden="true" />
                  help@cityfamilycare.in
                </a>
              </li>
              {/* Where we operate, not a claim about scope. The agreement
                  names Tamil Nadu as the jurisdiction, not a limit — so this
                  says where service is available today. */}
              <li className="flex items-center gap-2 text-on-structure-muted">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                Serving Tiruchirappalli and nearby areas
              </li>
            </ul>
          </div>

          <FooterColumn title="Services" links={SERVICE_LINKS} />
          <FooterColumn title="Your account" links={ACCOUNT_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-structure-line pt-4">
          <p className="text-caption text-on-structure-muted">
            © {new Date().getFullYear()} City Family Care. All rights reserved.
          </p>
          <Link
            href="/register?role=pro"
            className="text-caption font-medium text-brand-bright hover:underline"
          >
            Work with us as a professional
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-small font-semibold text-on-structure">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-small text-on-structure-muted transition-colors duration-fast hover:text-brand-bright"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "+919000012345" reads as "+91 90000 12345". */
function displayPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return e164;
}
