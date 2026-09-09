import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SUPPORT_HOURS, SUPPORT_PHONE } from "@cfc/mocks";
import { Logo } from "@/components/logo";

/**
 * The site footer.
 *
 * Desktop only, and deliberately so. On a phone the bottom tab bar is fixed to
 * the same edge, and a footer above it means a customer scrolls past a wall of
 * links to reach nothing — the tab bar already carries every destination that
 * matters. The legal links stay reachable on mobile through Settings.
 *
 * A footer is not decoration on a marketplace. It is where a customer checks
 * whether the business is real before handing over an address and a card: a
 * phone number that answers, an operating area, and terms that exist. Its
 * absence is one of the first things that reads as unfinished.
 */

const SERVICE_LINKS = [
  { label: "All services", href: "/categories" },
  { label: "Home & maintenance", href: "/categories?cat=cat_01" },
  { label: "Lifestyle & personal", href: "/categories?cat=cat_02" },
  { label: "Health & care", href: "/categories?cat=cat_03" },
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
    <footer className="mt-12 hidden border-t border-border bg-surface md:block">
      <div className="mx-auto max-w-screen-xl px-6 py-panel lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr]">
          {/* Who we are, and how to reach a person. */}
          <div className="min-w-0">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="size-mark text-action" />
              <span className="text-heading font-semibold tracking-tight text-ink">
                City Family Care
              </span>
            </Link>

            <p className="mt-3 max-w-prose text-small text-ink-muted">
              Verified professionals for repairs, cleaning, beauty and care —
              booked at a fixed price, with a 30-day warranty on every job.
            </p>

            <ul className="mt-4 space-y-2 text-small">
              <li>
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="flex items-center gap-2 text-ink hover:text-action"
                >
                  <Phone className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="tabular">{displayPhone(SUPPORT_PHONE)}</span>
                  <span className="text-caption text-ink-faint">
                    · {SUPPORT_HOURS}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:help@cityfamilycare.in"
                  className="flex items-center gap-2 text-ink hover:text-action"
                >
                  <Mail className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  help@cityfamilycare.in
                </a>
              </li>
              {/* Where we operate, not a claim about scope. The agreement
                  names Tamil Nadu as the jurisdiction, not a limit — so this
                  says where service is available today. */}
              <li className="flex items-center gap-2 text-ink-muted">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                Serving Tiruchirappalli and nearby areas
              </li>
            </ul>
          </div>

          <FooterColumn title="Services" links={SERVICE_LINKS} />
          <FooterColumn title="Your account" links={ACCOUNT_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-caption text-ink-faint">
            © {new Date().getFullYear()} City Family Care. All rights reserved.
          </p>
          <Link
            href="/register?role=pro"
            className="text-caption font-medium text-action hover:underline"
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
      <h2 className="text-small font-semibold text-ink">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-small text-ink-muted hover:text-action hover:underline"
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
