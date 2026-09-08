"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { canOpen, type Actor, type Role } from "@cfc/types";
import {
  Avatar,
  AvatarFallback,
  Button,
  cn,
  CommandPalette,
  ForbiddenState,
  initials,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Kbd,
  usePlatformModifier,
  type CommandItem,
  useCommandPalette,
} from "@cfc/ui";
import { Logo } from "@/components/auth-shell";
import { navFor, navLocation, type NavBadge, type NavGroup } from "@/config/nav";
import { useActor, useSignOut } from "@/lib/actor";
import { useNavCounts } from "@/lib/nav-counts";

/**
 * Admin shell.
 *
 * Navy rail, because navy is structure. The active item is raised and marked
 * with a teal left bar — teal marks position and action, and the rail itself
 * never looks clickable.
 *
 * Three things the previous shell did not do, all of which an eleven-section
 * panel needs:
 *
 *  - The nav is GROUPED. Eleven flat items is a list to be read; four groups is
 *    a shape to be recognised.
 *  - Counts are live on the rail. Seven quotes waiting was invisible until you
 *    navigated to quotations, which is backwards — the queue you are not
 *    looking at is the one that needs you.
 *  - Cmd-K reaches any screen without navigating. Forty-nine screens behind
 *    eleven entries is otherwise two or three clicks and a scan every time.
 *
 * Under lg the rail becomes a drawer. The admin panel being usable on a phone
 * is a contractual requirement, not a nice-to-have.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const actor = useActor();
  const counts = useNavCounts();
  const palette = useCommandPalette();

  // Close the drawer on navigation, otherwise it covers the page just reached.
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const signOut = useSignOut();
  const modKey = usePlatformModifier();

  const here = navLocation(pathname);

  // A section with no  field (the dashboard) is open to every admin.
  const allowedHere =
    here?.item.section === undefined || canOpen(actor, here.item.section);

  // One source for both the rail and the palette: a section this admin cannot
  // open must not be jumpable to with a keystroke either.
  const nav = React.useMemo(() => navFor(actor), [actor]);

  const commands: CommandItem[] = React.useMemo(
    () =>
      nav.flatMap((g) => g.items).map((item) => ({
        id: item.href,
        label: item.label,
        group: "Go to",
        keywords: item.keywords ?? "",
        onSelect: () => router.push(item.href),
      })),
    [nav, router],
  );

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* Mobile top bar */}
      <header className="flex h-bar items-center gap-1 border-b border-border bg-surface px-2 lg:hidden">
        <Button
          variant="ghost"
          size="icon-md"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <Menu />
        </Button>

        {/* Names the current section, which is what the desktop breadcrumb
            does. `min-w-0` + `truncate` is what stops a long label pushing the
            actions off the right edge at 390px. */}
        <span className="min-w-0 flex-1 truncate text-heading font-semibold text-ink">
          {here?.item.label ?? "City Family Care"}
        </span>

        <Button
          variant="ghost"
          size="icon-md"
          onClick={() => palette.setOpen(true)}
          aria-label="Search"
        >
          <Search />
        </Button>

        {/* Both were desktop-only, so a phone had no sign-out and no view of
            what was waiting. Same components, so the two bars cannot drift. */}
        <NotificationBell counts={counts} onGo={(href) => router.push(href)} />
        <AccountMenu
          actor={actor}
          onProfile={() => router.push("/settings?tab=profile")}
          onSignOut={() => {
            signOut();
            router.push("/login");
          }}
        />
      </header>

      {/* Drawer scrim */}
      {drawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-drawer-scrim bg-scrim lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        />
      )}

      <div className="lg:flex">
        <Sidebar
          groups={nav}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          pathname={pathname}
          actorName={actor.name}
          actorRoleLabel={ROLE_LABEL[actor.role]}
          actorArea={actor.area}
          counts={counts}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Desktop top bar — breadcrumb, command bar, identity. */}
          <header className="hidden h-bar shrink-0 items-center gap-4 border-b border-border bg-surface px-6 lg:flex">
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-2 text-small text-ink-muted">
                {here ? (
                  <>
                    <li>{here.group}</li>
                    <li aria-hidden="true" className="text-ink-faint">
                      /
                    </li>
                    <li className="font-medium text-ink" aria-current="page">
                      {here.item.label}
                    </li>
                  </>
                ) : (
                  <li className="font-medium text-ink">CFC Admin</li>
                )}
              </ol>
            </nav>

            <button
              type="button"
              onClick={() => palette.setOpen(true)}
              className={cn(
                "ml-auto flex h-8 min-w-search items-center gap-2 rounded-control",
                "border border-border-strong bg-surface px-3 text-small",
                "text-ink-faint transition-colors duration-fast hover:bg-canvas",
              )}
            >
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Search or jump to…</span>
              <Kbd>{modKey}K</Kbd>
            </button>

            <NotificationBell counts={counts} onGo={(href) => router.push(href)} />
            <AccountMenu
              actor={actor}
              showName
              onProfile={() => router.push("/settings?tab=profile")}
              onSignOut={() => {
                signOut();
                router.push("/login");
              }}
            />
          </header>

          <main id="main" className="min-w-0 flex-1 p-4 lg:p-6">
            {/* Hiding a nav item is not access control - the URL is still
                typeable, and a bookmark from a previous role still resolves.
                The route itself is guarded here, once, rather than in each of
                the eleven pages. */}
            {allowedHere ? (
              children
            ) : (
              <div className="rounded-card border border-border bg-surface">
                <ForbiddenState
                  title="You do not have access to this section"
                  description={`Your role does not include ${here?.item.label ?? "this section"}. Ask a super admin if you need it.`}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      <CommandPalette
        open={palette.open}
        onOpenChange={palette.setOpen}
        items={commands}
      />
    </div>
  );
}

/**
 * Every role gets a label, including the ones with no admin access — a Pro who
 * reaches this URL still sees the shell around the permission-denied state, and
 * an unlabelled role there would render as blank.
 */
const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super admin",
  sub_admin: "Sub admin",
  area_admin: "Area admin",
  customer: "Customer",
  pro: "Pro",
  associate_partner: "Associate partner",
  major_partner: "Major partner",
};

/**
 * The signed-in admin, and the two things they can do about it.
 *
 * One component for both top bars. It was written inline in the desktop
 * header, which is how the mobile bar ended up with no sign-out at all — the
 * only way to leave the panel on a phone was to edit the URL.
 */
function AccountMenu({
  actor,
  showName = false,
  onProfile,
  onSignOut,
}: {
  actor: Actor;
  /** The chevron is desktop affordance; a phone bar has no room for it. */
  showName?: boolean;
  onProfile: () => void;
  onSignOut: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-control p-1",
            "transition-colors duration-fast hover:bg-canvas",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
          )}
          aria-label={`Account menu for ${actor.name}`}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarFallback>{initials(actor.name)}</AvatarFallback>
          </Avatar>
          {showName && (
            <ChevronDown
              className="size-4 shrink-0 text-ink-faint"
              aria-hidden="true"
            />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-menu">
        {/* Who you are signed in as, and — for an Area Admin — the scope that
            explains why they see fewer rows than a colleague. */}
        <div className="border-b border-border px-2 py-2">
          <p className="truncate text-small font-medium text-ink">
            {actor.name}
          </p>
          <p className="text-caption text-ink-muted">
            {ROLE_LABEL[actor.role]}
            {actor.area ? ` · ${actor.area}` : ""}
          </p>
        </div>

        <DropdownMenuItem onSelect={onProfile}>
          <UserRound />
          My profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * What is waiting on someone, reachable from anywhere.
 *
 * Pending work was previously only visible on the screen that held it, or as a
 * sidebar badge that is off-screen on a phone. The counts come from
 * `useNavCounts` — the same source as those badges, so the two can never
 * disagree — and each row navigates to the queue rather than only reporting it.
 */
function NotificationBell({
  counts,
  onGo,
}: {
  counts: Partial<Record<NavBadge, number>>;
  onGo: (href: string) => void;
}) {
  const items = [
    {
      key: "pendingQuotes" as const,
      count: counts.pendingQuotes ?? 0,
      label: "quotations waiting for approval",
      href: "/quotations",
    },
    {
      key: "pendingPros" as const,
      count: counts.pendingPros ?? 0,
      label: "pros awaiting KYC verification",
      href: "/pros",
    },
    {
      key: "openTickets" as const,
      count: counts.openTickets ?? 0,
      label: "open support tickets",
      href: "/support",
    },
  ].filter((i) => i.count > 0);

  const total = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex size-8 shrink-0 items-center justify-center rounded-control",
            "text-ink-muted transition-colors duration-fast hover:bg-canvas hover:text-ink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
          )}
          aria-label={
            total > 0 ? `Notifications, ${total} waiting` : "Notifications"
          }
        >
          <Bell className="size-4" aria-hidden="true" />
          {total > 0 && (
            <span
              className="absolute right-1 top-1 size-2 rounded-full bg-critical"
              aria-hidden="true"
            />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-menu">
        <div className="border-b border-border px-2 py-2">
          <p className="text-small font-medium text-ink">Needs attention</p>
        </div>

        {items.length === 0 ? (
          <p className="px-2 py-3 text-caption text-ink-muted">
            Nothing waiting. Every queue is clear.
          </p>
        ) : (
          items.map((i) => (
            <DropdownMenuItem key={i.key} onSelect={() => onGo(i.href)}>
              <span className="tabular font-semibold text-ink">{i.count}</span>
              <span className="text-ink-muted">{i.label}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar({
  open,
  onClose,
  pathname,
  actorName,
  actorRoleLabel,
  actorArea,
  counts,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  actorName: string;
  actorRoleLabel: string;
  actorArea: string | undefined;
  counts: Partial<Record<NavBadge, number>>;
  /** Already filtered to what this admin may open. */
  groups: NavGroup[];
}) {
  return (
    <nav
      aria-label="Main"
      className={cn(
        "on-structure-surface",
        "fixed inset-y-0 left-0 z-drawer w-rail-drawer shrink-0 overflow-y-auto bg-structure",
        "transition-transform duration-base ease-out",
        "lg:sticky lg:top-0 lg:h-screen lg:w-rail lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-bar items-center justify-between gap-2 px-4">
        <span className="flex items-center gap-2">
          {/* The client's own mark. Its cyan already matches the brand token,
              so it needs no treatment against the navy rail. */}
          <Logo className="size-mark text-brand" />
          <span className="text-small font-semibold text-on-structure">
            City Family Care
          </span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-on-structure hover:bg-structure-raised lg:hidden"
          aria-label="Close menu"
        >
          <X />
        </Button>
      </div>

      <div className="border-b border-structure-line px-4 pb-3">
        <p className="truncate text-small font-medium text-on-structure">
          {actorName}
        </p>
        <p className="text-caption text-on-structure-muted">
          {actorRoleLabel}
          {actorArea ? ` · ${actorArea}` : ""}
        </p>
      </div>

      <div className="pb-8 pt-2">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-4 pb-1 pt-4 text-caption font-semibold uppercase tracking-wide text-on-structure-faint">
              {group.label}
            </p>
            <ul className="space-y-px px-2">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const count = item.badge ? counts[item.badge] : undefined;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-control py-2 pl-3 pr-2",
                        "border-l-nav text-small transition-colors duration-fast",
                        active
                          ? "border-brand bg-structure-active font-medium text-on-structure"
                          : "border-transparent text-on-structure-muted hover:bg-structure-raised hover:text-on-structure",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                      {count !== undefined && count > 0 && (
                        <span
                          className={cn(
                            "tabular ml-auto shrink-0 rounded-full px-2",
                            "bg-structure-muted text-caption font-semibold text-on-structure-muted",
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
