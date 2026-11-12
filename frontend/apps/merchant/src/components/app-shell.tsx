"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Store, X } from "lucide-react";
import { cn } from "@cfc/ui";
import { getMerchantDashboard } from "@cfc/mocks";
import { MERCHANT_NAV, type MerchantNavBadge } from "@/config/nav";

/**
 * The frame around every signed-in screen.
 *
 * Below `lg` the rail becomes an off-canvas drawer behind a top bar, because a
 * fixed rail on a phone costs a third of the width for navigation that is used
 * once a session. From `lg` the rail is sticky and always visible.
 *
 * Counts in the nav come from the same call the dashboard makes, so a request
 * answered on one screen is reflected in the rail without a reload.
 */

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isDrawerOpen, setDrawerOpen] = React.useState(false);
  const [counts, setCounts] = React.useState<
    Record<MerchantNavBadge, number> | null
  >(null);

  React.useEffect(() => {
    let active = true;
    void getMerchantDashboard()
      .then((summary) => {
        if (active) {
          setCounts({ pending: summary.pending, ready: summary.ready });
        }
      })
      .catch(() => {
        // A failed count is not worth blocking navigation over; the badge
        // simply does not render.
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  // A route change closes the drawer: tapping a link and finding the drawer
  // still covering the screen is the single most common mobile nav defect.
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile bar */}
      <header className="flex h-bar items-center gap-2 border-b border-border bg-surface px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="inline-flex size-8 items-center justify-center rounded-md text-ink hover:bg-border/40"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <BrandMark />
      </header>

      {isDrawerOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div className="lg:flex">
        <Rail
          pathname={pathname}
          counts={counts}
          isDrawerOpen={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <main id="main" className="min-w-0 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-flex size-mark items-center justify-center rounded-md bg-action text-white">
        <Store className="size-4" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold tracking-tight text-ink">
        CFC Merchant
      </span>
    </span>
  );
}

function Rail({
  pathname,
  counts,
  isDrawerOpen,
  onClose,
}: {
  pathname: string;
  counts: Record<MerchantNavBadge, number> | null;
  isDrawerOpen: boolean;
  onClose: () => void;
}) {
  return (
    <nav
      aria-label="Main"
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-rail-drawer flex-col bg-structure transition-transform",
        isDrawerOpen ? "translate-x-0" : "-translate-x-full",
        "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
      )}
    >
      <div className="flex h-bar shrink-0 items-center justify-between px-4">
        <span className="flex items-center gap-2">
          <span className="inline-flex size-mark items-center justify-center rounded-md bg-action text-on-action">
            <Store className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-on-structure">
            CFC Merchant
          </span>
        </span>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="inline-flex size-8 items-center justify-center rounded-md text-on-structure-muted hover:bg-structure-raised lg:hidden"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {MERCHANT_NAV.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const count = item.badge ? counts?.[item.badge] : undefined;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors",
                  isActive
                    ? "bg-action text-on-action"
                    : "text-on-structure-muted hover:bg-structure-raised hover:text-on-structure",
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>

                {count !== undefined && count > 0 ? (
                  <span
                    className={cn(
                      "inline-flex min-w-5 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold tabular-nums",
                      isActive ? "bg-white text-action" : "bg-action text-white",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="shrink-0 border-t border-structure-line p-3">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-on-structure-muted transition-colors hover:bg-structure-raised hover:text-on-structure"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          Sign out
        </Link>
      </div>
    </nav>
  );
}
