"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Tag,
  TriangleAlert,
} from "lucide-react";
import {
  AREA_OPTIONS,
  SERVICE_NAMES,
  getBanners,
  getCategories,
  getCoupons,
  getServices,
} from "@cfc/mocks";
import type {
  Banner,
  Category,
  Coupon,
  ServiceDetail,
} from "@cfc/types";
import {
  Badge,
  Button,
  Combobox,
  DateRangePicker,
  FilterMultiSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterSelect,
  FormField,
  InlineAlert,
  Input,
  NoResultsState,
  PageHeader,
  Skeleton,
  StatCard,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
  formatCurrency,
  formatDate,
  toast,
  useReorder,
  type DateRange,
} from "@cfc/ui";

/**
 * Admin 35–37 — Promotions and banners.
 *
 * Inventory 35: "Active coupons, usage stats, enable/disable."
 * Inventory 36: "Code, discount type, max uses, expiry, user restrictions,
 * first-booking only option."
 * Inventory 37: "Homepage banners, image upload, link to category/service,
 * scheduling."
 *
 * A coupon is money being given away, so the list leads with how much of each
 * one has been spent rather than with the code. A code that has burned 90% of
 * its allowance in two days is the thing an operator needs to see; the string
 * itself tells them nothing.
 */
const TAB_PARAM = "tab";
type PromotionsTab = "coupons" | "banners";

function PromotionsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get(TAB_PARAM) as PromotionsTab | null) ?? "coupons";

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, next);
    router.push(`/promotions?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions"
        description="Discount codes customers redeem, and the banners on the app home screen."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons">
          <CouponsTab />
        </TabsContent>
        <TabsContent value="banners">
          <BannersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -- Admin 35 + 36: coupons --------------------------------------------------

/** A coupon this close to its limit is about to stop working mid-campaign. */
const NEARLY_SPENT = 0.85;

function isExpired(c: Coupon): boolean {
  return new Date(c.expiresAt).getTime() < Date.now();
}

function CouponsTab() {
  const [rows, setRows] = React.useState<Coupon[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [state, setState] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getCoupons()
      .then(setRows)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const toggle = (id: string) =>
    setRows(
      (rs) =>
        rs?.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) ?? rs,
    );

  const upsert = (c: Coupon) =>
    setRows((rs) => {
      if (!rs) return [c];
      return rs.some((x) => x.id === c.id)
        ? rs.map((x) => (x.id === c.id ? c : x))
        : [c, ...rs];
    });

  const visible = React.useMemo(() => {
    let items = rows ?? [];
    const q = search.trim().toLowerCase();
    if (q) items = items.filter((c) => c.code.toLowerCase().includes(q));
    if (state === "live")
      items = items.filter((c) => c.active && !isExpired(c));
    if (state === "expired") items = items.filter(isExpired);
    if (state === "paused") items = items.filter((c) => !c.active);
    return items;
  }, [rows, search, state]);

  const live = (rows ?? []).filter((c) => c.active && !isExpired(c));
  const redeemed = (rows ?? []).reduce((s, c) => s + c.usedCount, 0);
  const nearlySpent = live.filter(
    (c) => c.maxUses > 0 && c.usedCount / c.maxUses >= NEARLY_SPENT,
  );

  const activeFilters = state ? 1 : 0;
  const clearAll = () => {
    setState(null);
    setSearch("");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Live codes"
          value={live.length}
          loading={rows === null}
          hint="active and not expired"
        />
        <StatCard
          label="Redemptions"
          value={redeemed}
          loading={rows === null}
          hint="across every code"
        />
        <StatCard
          label="Nearly spent"
          value={nearlySpent.length}
          loading={rows === null}
          hint={`${Math.round(NEARLY_SPENT * 100)}% of the limit used`}
          goodWhen="down"
        />
      </div>

      {nearlySpent.length > 0 && (
        <InlineAlert
          tone="clock"
          title={`${nearlySpent.length} code${nearlySpent.length === 1 ? "" : "s"} close to the limit`}
        >
          {nearlySpent.map((c) => c.code).join(", ")} will stop working once the
          limit is reached. Raise the cap or let the campaign end.
        </InlineAlert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-ink-muted">
          Customers enter these at checkout.
        </p>
        <CouponDialog onSaved={upsert} />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by code"
          searchLabel="Search coupons"
          activeCount={activeFilters}
          onClearAll={clearAll}
          resultLabel={rows ? `${visible.length} of ${rows.length}` : undefined}
        >
          <FilterSelect
            label="State"
            value={state}
            onChange={setState}
            allLabel="All codes"
            options={[
              { value: "live", label: "Live" },
              { value: "paused", label: "Paused" },
              { value: "expired", label: "Expired" },
            ]}
          />
        </FilterBar>

        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The coupons could not load"
            action={{ label: "Try again", onClick: load }}
          />
        ) : !rows ? (
          <PromoSkeleton />
        ) : visible.length === 0 ? (
          activeFilters > 0 || search ? (
            <NoResultsState onClearFilters={clearAll} />
          ) : (
            <EmptyState
              icon={<Tag />}
              title="No coupons yet"
              description="Create a code and customers can redeem it at checkout."
            />
          )
        ) : (
          <ul className="divide-y divide-border-soft">
            {visible.map((c) => (
              <CouponRow
                key={c.id}
                coupon={c}
                onToggle={() => toggle(c.id)}
                onSaved={upsert}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * One coupon.
 *
 * The usage bar is the point of the row. "142 of 200" is a number an operator
 * has to think about; a bar that is three-quarters full is a fact they take in
 * while scrolling past.
 */
function CouponRow({
  coupon,
  onToggle,
  onSaved,
}: {
  coupon: Coupon;
  onToggle: () => void;
  onSaved: (c: Coupon) => void;
}) {
  const expired = isExpired(coupon);
  const uncapped = coupon.maxUses === 0;
  const fraction = uncapped
    ? 0
    : Math.min(1, coupon.usedCount / coupon.maxUses);
  const nearly = !uncapped && fraction >= NEARLY_SPENT;
  const spent = !uncapped && coupon.usedCount >= coupon.maxUses;

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-4 p-4 transition-colors duration-fast",
        expired || !coupon.active ? "bg-canvas" : "hover:bg-canvas",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "tabular rounded-control px-2 py-px text-small font-semibold",
              expired || !coupon.active
                ? "bg-neutral-subtle text-ink-muted"
                : "bg-action-subtle text-action-press",
            )}
          >
            {coupon.code}
          </span>
          {expired && <Badge tone="neutral">Expired</Badge>}
          {spent && !expired && <Badge tone="critical" dot>Limit reached</Badge>}
          {coupon.firstBookingOnly && (
            <Badge tone="neutral" dot="hollow">
              First booking only
            </Badge>
          )}
          {restrictionSummary(coupon) && (
            <Badge tone="neutral" dot="hollow">
              {restrictionSummary(coupon)}
            </Badge>
          )}
        </span>
        <span className="mt-px block text-caption text-ink-muted">
          {coupon.discountType === "percent"
            ? `${coupon.discountValue}% off`
            : `${formatCurrency(coupon.discountValue * 100)} off`}
          {" · "}
          <span className="tabular">
            {expired ? "Expired" : "Expires"} {formatDate(coupon.expiresAt)}
          </span>
        </span>
      </span>

      {/* Usage, as a bar. */}
      <span className="w-line-lg shrink-0">
        <span className="tabular flex items-baseline justify-between text-caption">
          <span className={nearly ? "text-clock-ink" : "text-ink-muted"}>
            {coupon.usedCount} used
          </span>
          <span className="text-ink-faint">
            {uncapped ? "no limit" : `of ${coupon.maxUses}`}
          </span>
        </span>
        {!uncapped && (
          <span className="mt-1 block h-1 overflow-hidden rounded-pill bg-neutral-subtle">
            <span
              className={cn(
                "block h-full rounded-pill transition-size duration-slow ease-out",
                spent ? "bg-critical" : nearly ? "bg-clock" : "bg-action",
              )}
              style={{ width: `${fraction * 100}%` }}
            />
          </span>
        )}
      </span>

      <span className="flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "hidden text-caption font-medium sm:block",
              coupon.active && !expired ? "text-ink" : "text-ink-muted",
            )}
          >
            {expired ? "Expired" : coupon.active ? "Live" : "Paused"}
          </span>
          <Switch
            checked={coupon.active && !expired}
            disabled={expired}
            onCheckedChange={onToggle}
            aria-label={`${coupon.code} is ${coupon.active ? "live" : "paused"}`}
          />
        </span>
        <CouponDialog coupon={coupon} onSaved={onSaved} />
      </span>
    </li>
  );
}

/**
 * A one-line reading of what a code is limited to.
 *
 * Named on the row because "the code did not work" is the most common support
 * call about coupons, and the answer is almost always a restriction nobody
 * remembered was set.
 */
function restrictionSummary(c: Coupon): string | null {
  const parts: string[] = [];
  if (c.restrictions.areas.length > 0) {
    parts.push(
      c.restrictions.areas.length === 1
        ? (c.restrictions.areas[0] ?? "")
        : `${c.restrictions.areas.length} areas`,
    );
  }
  if (c.restrictions.serviceNames.length > 0) {
    parts.push(
      c.restrictions.serviceNames.length === 1
        ? (c.restrictions.serviceNames[0] ?? "")
        : `${c.restrictions.serviceNames.length} services`,
    );
  }
  if (c.restrictions.minOrderPaise > 0) {
    parts.push(`over ${formatCurrency(c.restrictions.minOrderPaise)}`);
  }
  if (c.restrictions.perCustomerLimit > 0) {
    parts.push(
      c.restrictions.perCustomerLimit === 1
        ? "once per customer"
        : `${c.restrictions.perCustomerLimit}× per customer`,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Admin 36 — add or edit a coupon.
 *
 * Every field is a way to lose money, so the dialog states the exposure: what
 * one redemption costs and what the whole campaign costs if every code is used.
 * A 25% code with no cap is a decision somebody should make deliberately.
 */
function CouponDialog({
  coupon,
  onSaved,
}: {
  coupon?: Coupon | undefined;
  onSaved: (c: Coupon) => void;
}) {
  const editing = coupon !== undefined;
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [discountType, setDiscountType] =
    React.useState<Coupon["discountType"]>("percent");
  const [discountValue, setDiscountValue] = React.useState(10);
  const [maxUses, setMaxUses] = React.useState(100);
  const [expiresAt, setExpiresAt] = React.useState("");
  const [firstBookingOnly, setFirstBookingOnly] = React.useState(false);
  const [areas, setAreas] = React.useState<string[]>([]);
  const [serviceNames, setServiceNames] = React.useState<string[]>([]);
  const [minOrder, setMinOrder] = React.useState(0);
  const [maxDiscount, setMaxDiscount] = React.useState(0);
  const [perCustomer, setPerCustomer] = React.useState(0);
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setCode(coupon?.code ?? "");
    setDiscountType(coupon?.discountType ?? "percent");
    setDiscountValue(coupon?.discountValue ?? 10);
    setMaxUses(coupon?.maxUses ?? 100);
    setExpiresAt(
      coupon ? coupon.expiresAt.slice(0, 10) : defaultExpiry(),
    );
    setFirstBookingOnly(coupon?.firstBookingOnly ?? false);
    setAreas(coupon?.restrictions.areas ?? []);
    setServiceNames(coupon?.restrictions.serviceNames ?? []);
    setMinOrder(coupon?.restrictions.minOrderPaise ?? 0);
    setMaxDiscount(coupon?.restrictions.maxDiscountPaise ?? 0);
    setPerCustomer(coupon?.restrictions.perCustomerLimit ?? 0);
    setActive(coupon?.active ?? true);
  }, [open, coupon]);

  const canSave = code.trim() !== "" && discountValue > 0 && expiresAt !== "";

  // What this costs, on a booking of a typical size.
  const TYPICAL_BOOKING_PAISE = 100_000;
  const rawPerUse =
    discountType === "percent"
      ? Math.round((TYPICAL_BOOKING_PAISE * discountValue) / 100)
      : discountValue * 100;
  // A cap is the whole point of setting one, so the exposure has to respect it.
  const perUse =
    maxDiscount > 0 ? Math.min(rawPerUse, maxDiscount) : rawPerUse;
  const exposure = maxUses > 0 ? perUse * maxUses : null;

  const save = () => {
    onSaved({
      id: coupon?.id ?? `cpn_${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      maxUses,
      usedCount: coupon?.usedCount ?? 0,
      expiresAt: new Date(`${expiresAt}T23:59:59`).toISOString(),
      firstBookingOnly,
      restrictions: {
        areas,
        serviceNames,
        minOrderPaise: minOrder,
        maxDiscountPaise: maxDiscount,
        perCustomerLimit: perCustomer,
      },
      active,
    });
    toast.success(
      editing ? `${code.trim().toUpperCase()} updated` : `${code.trim().toUpperCase()} created`,
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="secondary" size="sm">
            Edit
          </Button>
        ) : (
          <Button variant="primary">
            <Plus />
            New coupon
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit ${coupon.code}` : "New coupon"}
          </DialogTitle>
          <DialogDescription>
            Customers enter this code at checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormField label="Code" required help="Shown to customers in capitals.">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. FIRST20"
              className="tabular"
              autoFocus
            />
          </FormField>

          <FormField label="Discount" required>
            <div className="flex gap-2">
              <div
                role="radiogroup"
                aria-label="Discount type"
                className="grid shrink-0 grid-cols-2 gap-1 rounded-control bg-neutral-subtle p-1"
              >
                {(["percent", "flat"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={discountType === t}
                    onClick={() => setDiscountType(t)}
                    className={cn(
                      "rounded-pill px-3 py-1 text-small transition-colors duration-fast",
                      discountType === t
                        ? "bg-surface font-semibold text-ink shadow-sm"
                        : "font-medium text-ink-muted hover:text-ink",
                    )}
                  >
                    {t === "percent" ? "%" : "₹"}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                value={String(discountValue)}
                onChange={(e) =>
                  setDiscountValue(Math.max(0, Number(e.target.value)) || 0)
                }
                trailing={discountType === "percent" ? "%" : "₹"}
                aria-label="Discount amount"
                className="flex-1"
              />
            </div>
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Maximum uses"
              help="0 means unlimited."
            >
              <Input
                type="number"
                min={0}
                value={String(maxUses)}
                onChange={(e) =>
                  setMaxUses(Math.max(0, Math.round(Number(e.target.value))) || 0)
                }
                aria-label="Maximum uses"
              />
            </FormField>

            <FormField label="Expires" required>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                aria-label="Expiry date"
              />
            </FormField>
          </div>

          {/* What this costs. A percentage with no cap is an open cheque, and
              the dialog should say so before it is signed. */}
          <div className="rounded-card bg-canvas p-3 text-small">
            <p className="flex items-baseline justify-between">
              <span className="text-ink-muted">
                Cost on a {formatCurrency(TYPICAL_BOOKING_PAISE)} booking
              </span>
              <span className="tabular font-medium text-ink">
                {formatCurrency(perUse)}
              </span>
            </p>
            <p className="mt-1 flex items-baseline justify-between">
              <span className="text-ink-muted">If every use is redeemed</span>
              <span
                className={cn(
                  "tabular font-semibold",
                  exposure === null ? "text-clock-ink" : "text-ink",
                )}
              >
                {exposure === null ? "No limit set" : formatCurrency(exposure)}
              </span>
            </p>
          </div>

          {/* Admin 36 — "user restrictions". Separate from first-booking-only,
              which is one flag about a customer's history; these narrow where
              the code works and on what. A campaign like "monsoon offer,
              Srirangam only, above ₹500" needs all three. */}
          <div className="space-y-3 rounded-card border border-border p-3">
            <p className="text-small font-medium text-ink">Restrictions</p>
            <p className="-mt-2 text-caption text-ink-muted">
              Leave anything empty to place no limit on it.
            </p>

            <FilterMultiSelect
              label="Areas"
              values={areas}
              onChange={setAreas}
              options={AREA_OPTIONS.map((a) => ({ value: a, label: a }))}
              searchable
              className="w-full justify-between"
            />

            <FilterMultiSelect
              label="Services"
              values={serviceNames}
              onChange={setServiceNames}
              options={SERVICE_NAMES.map((n) => ({ value: n, label: n }))}
              searchable
              className="w-full justify-between"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Minimum order"
                help="Booking must be at least this."
              >
                <Input
                  type="number"
                  min={0}
                  value={String(minOrder / 100)}
                  onChange={(e) =>
                    setMinOrder(
                      Math.max(0, Math.round(Number(e.target.value) * 100)) || 0,
                    )
                  }
                  trailing="₹"
                  aria-label="Minimum order value in rupees"
                />
              </FormField>

              <FormField
                label="Maximum discount"
                {...(discountType === "percent"
                  ? { help: "Caps what a percentage can take off." }
                  : { help: "Not used for a flat discount." })}
              >
                <Input
                  type="number"
                  min={0}
                  disabled={discountType === "flat"}
                  value={String(maxDiscount / 100)}
                  onChange={(e) =>
                    setMaxDiscount(
                      Math.max(0, Math.round(Number(e.target.value) * 100)) || 0,
                    )
                  }
                  trailing="₹"
                  aria-label="Maximum discount in rupees"
                />
              </FormField>
            </div>

            <FormField
              label="Uses per customer"
              help="0 means one customer can redeem it as often as they like."
            >
              <Input
                type="number"
                min={0}
                value={String(perCustomer)}
                onChange={(e) =>
                  setPerCustomer(
                    Math.max(0, Math.round(Number(e.target.value))) || 0,
                  )
                }
                aria-label="Uses per customer"
              />
            </FormField>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-control border border-border p-3">
            <span className="min-w-0">
              <span className="block text-small font-medium text-ink">
                First booking only
              </span>
              <span className="block text-caption text-ink-muted">
                Only customers who have never booked before can use it.
              </span>
            </span>
            <Switch
              checked={firstBookingOnly}
              onCheckedChange={setFirstBookingOnly}
              aria-label="First booking only"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-control border border-border p-3">
            <span className="min-w-0">
              <span className="block text-small font-medium text-ink">
                {active ? "Live" : "Paused"}
              </span>
              <span className="block text-caption text-ink-muted">
                {active
                  ? "Customers can redeem it right now."
                  : "Saved, but not accepted at checkout."}
              </span>
            </span>
            <Switch
              checked={active}
              onCheckedChange={setActive}
              aria-label={`Coupon is ${active ? "live" : "paused"}`}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="primary" onClick={save} disabled={!canSave}>
            {editing ? "Save coupon" : "Create coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Thirty days out, which is what most campaigns run for. */
function defaultExpiry(): string {
  const d = new Date(Date.now() + 30 * 86_400_000);
  return d.toISOString().slice(0, 10);
}

// -- Admin 37: banners -------------------------------------------------------

/**
 * Admin 37 — Banners and offers.
 *
 * Inventory: "Homepage banners, image upload, link to category/service,
 * scheduling."
 *
 * Order is merchandising here exactly as it is for categories, so banners drag
 * with the same hook and keep the arrows as the keyboard path.
 *
 * Scheduling is why a banner can be active and still invisible: a Diwali banner
 * set for next month is switched on and correctly not showing. The row says
 * which of the two it is rather than leaving an operator to wonder.
 */
function BannersTab() {
  const [rows, setRows] = React.useState<Banner[] | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [services, setServices] = React.useState<ServiceDetail[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    Promise.all([getBanners(), getCategories(), getServices()])
      .then(([b, c, s]) => {
        setRows([...b].sort((x, y) => x.sortOrder - y.sortOrder));
        setCategories(c);
        setServices(s);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const renumber = React.useCallback(
    (next: Banner[]) => next.map((b, i) => ({ ...b, sortOrder: i + 1 })),
    [],
  );

  const { draggingIndex, overIndex, rowProps, move } = useReorder({
    items: rows ?? [],
    onChange: (next) => setRows(renumber(next)),
    onCommit: () => toast.success("Banner order updated"),
  });

  const toggle = (id: string) =>
    setRows(
      (rs) =>
        rs?.map((b) => (b.id === id ? { ...b, active: !b.active } : b)) ?? rs,
    );

  const upsert = (b: Banner) =>
    setRows((rs) => {
      if (!rs) return [b];
      return rs.some((x) => x.id === b.id)
        ? rs.map((x) => (x.id === b.id ? b : x))
        : renumber([...rs, b]);
    });

  const showing = (rows ?? []).filter((b) => b.active && isShowingNow(b));
  const scheduled = (rows ?? []).filter((b) => b.active && !isShowingNow(b));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="On the app now"
          value={showing.length}
          loading={rows === null}
          hint="live on the home screen"
        />
        <StatCard
          label="Scheduled"
          value={scheduled.length}
          loading={rows === null}
          hint="switched on, not showing yet"
        />
        <StatCard
          label="Paused"
          value={(rows ?? []).filter((b) => !b.active).length}
          loading={rows === null}
          hint="saved but switched off"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-ink-muted">
          Drag a banner to reorder. The order here is the carousel order on the
          app home screen.
        </p>
        <BannerDialog
          categories={categories}
          services={services}
          nextOrder={(rows?.length ?? 0) + 1}
          onSaved={upsert}
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The banners could not load"
            action={{ label: "Try again", onClick: load }}
          />
        ) : !rows ? (
          <PromoSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ImageIcon />}
            title="No banners yet"
            description="Banners are the carousel at the top of the app home screen."
          />
        ) : (
          <ul className="divide-y divide-border-soft">
            {rows.map((b, i) => {
              const showing = b.active && isShowingNow(b);
              return (
                <li
                  key={b.id}
                  {...rowProps(i)}
                  className={cn(
                    "flex flex-wrap items-center gap-3 p-4",
                    "transition-colors duration-fast",
                    b.active ? "hover:bg-canvas" : "bg-canvas",
                    draggingIndex === i && "opacity-50",
                    overIndex === i &&
                      draggingIndex !== i &&
                      "border-t-2 border-action",
                  )}
                >
                  <span className="flex shrink-0 items-center gap-2">
                    <GripVertical
                      className="size-4 cursor-grab text-ink-faint active:cursor-grabbing"
                      aria-hidden="true"
                    />
                    <span className="flex overflow-hidden rounded-control border border-border-strong">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label={`Move ${b.title} up`}
                        className="grid size-6 place-items-center border-r border-border-strong text-ink-muted transition-colors duration-fast hover:bg-canvas hover:text-ink disabled:bg-disabled disabled:text-disabled-ink relative coarse:after:absolute coarse:after:left-1/2 coarse:after:top-1/2 coarse:after:size-touch coarse:after:-translate-x-1/2 coarse:after:-translate-y-1/2 coarse:after:content-['']"
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === rows.length - 1}
                        aria-label={`Move ${b.title} down`}
                        className="grid size-6 place-items-center text-ink-muted transition-colors duration-fast hover:bg-canvas hover:text-ink disabled:bg-disabled disabled:text-disabled-ink relative coarse:after:absolute coarse:after:left-1/2 coarse:after:top-1/2 coarse:after:size-touch coarse:after:-translate-x-1/2 coarse:after:-translate-y-1/2 coarse:after:content-['']"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </span>
                  </span>

                  {/* The artwork is the content, so it gets real space. */}
                  <span
                    className="flex h-block-xs w-line-lg shrink-0 items-center justify-center rounded-control bg-canvas text-ink-faint sm:w-line-2xl"
                    role="img"
                    aria-label={`${b.title} artwork`}
                  >
                    <ImageIcon className="size-6" aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-small font-medium",
                          b.active ? "text-ink" : "text-ink-muted",
                        )}
                      >
                        {b.title}
                      </span>
                      {b.active && !showing && (
                        <Badge tone="clock" dot>
                          Scheduled
                        </Badge>
                      )}
                    </span>
                    <span className="mt-px block truncate text-caption text-ink-muted">
                      {b.linkType === "none"
                        ? "No link"
                        : `Links to ${b.linkTarget ?? b.linkType}`}
                      {b.scheduledFrom && (
                        <>
                          {" · "}
                          <span className="tabular">
                            {formatDate(b.scheduledFrom, "datetime")}
                            {b.scheduledTo
                              ? ` – ${formatDate(b.scheduledTo, "datetime")}`
                              : " onwards"}
                          </span>
                        </>
                      )}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-3">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "hidden text-caption font-medium sm:block",
                          b.active ? "text-ink" : "text-ink-muted",
                        )}
                      >
                        {b.active ? "Active" : "Paused"}
                      </span>
                      <Switch
                        checked={b.active}
                        onCheckedChange={() => toggle(b.id)}
                        aria-label={`${b.title} is ${b.active ? "active" : "paused"}`}
                      />
                    </span>
                    <BannerDialog
                      banner={b}
                      categories={categories}
                      services={services}
                      onSaved={upsert}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** "14:30" out of a stored timestamp, in local time. */
function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * A date from the range picker plus an "HH:mm" string, as one timestamp.
 *
 * Built from local parts rather than by string concatenation, so a banner set
 * for 6pm goes live at 6pm here and not at whatever 18:00 UTC happens to be.
 */
function withTime(date: Date, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.toISOString();
}

/** Whether a banner's schedule window includes right now. */
function isShowingNow(b: Banner): boolean {
  const now = Date.now();
  if (b.scheduledFrom && new Date(b.scheduledFrom).getTime() > now) return false;
  if (b.scheduledTo && new Date(b.scheduledTo).getTime() < now) return false;
  return true;
}

function BannerDialog({
  banner,
  categories,
  services,
  nextOrder,
  onSaved,
}: {
  banner?: Banner | undefined;
  categories: Category[];
  services: ServiceDetail[];
  nextOrder?: number | undefined;
  onSaved: (b: Banner) => void;
}) {
  const editing = banner !== undefined;
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [linkType, setLinkType] = React.useState<Banner["linkType"]>("none");
  const [linkTarget, setLinkTarget] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange | undefined>();
  // Times are kept beside the date range rather than inside it: the picker
  // works in whole local days, and a festival banner has to go live at an
  // hour, not at midnight.
  const [fromTime, setFromTime] = React.useState("00:00");
  const [toTime, setToTime] = React.useState("23:59");
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setTitle(banner?.title ?? "");
    setLinkType(banner?.linkType ?? "none");
    setLinkTarget(banner?.linkTarget ?? null);
    setRange(
      banner?.scheduledFrom
        ? {
            from: new Date(banner.scheduledFrom),
            ...(banner.scheduledTo
              ? { to: new Date(banner.scheduledTo) }
              : {}),
          }
        : undefined,
    );
    setFromTime(banner?.scheduledFrom ? timeOf(banner.scheduledFrom) : "00:00");
    setToTime(banner?.scheduledTo ? timeOf(banner.scheduledTo) : "23:59");
    setActive(banner?.active ?? true);
  }, [open, banner]);

  const targets =
    linkType === "category"
      ? categories.map((c) => ({ value: c.name, label: c.name }))
      : linkType === "service"
        ? services.map((s) => ({
            value: s.name,
            label: s.name,
            description: s.categoryName,
          }))
        : [];

  const canSave =
    title.trim() !== "" && (linkType === "none" || linkTarget !== null);

  const save = () => {
    onSaved({
      id: banner?.id ?? `ban_${Date.now()}`,
      imageUrl: banner?.imageUrl ?? "/mock/banners/placeholder.jpg",
      title: title.trim(),
      linkType,
      linkTarget: linkType === "none" ? null : linkTarget,
      sortOrder: banner?.sortOrder ?? nextOrder ?? 1,
      active,
      scheduledFrom: range?.from ? withTime(range.from, fromTime) : null,
      scheduledTo: range?.to ? withTime(range.to, toTime) : null,
    });
    toast.success(editing ? `${title.trim()} updated` : `${title.trim()} added`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="secondary" size="sm">
            Edit
          </Button>
        ) : (
          <Button variant="primary">
            <Plus />
            New banner
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit ${banner.title}` : "New banner"}
          </DialogTitle>
          <DialogDescription>
            Banners are the carousel at the top of the app home screen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormField
            label="Artwork"
            help="Wide format. The title below is for the admin only — the offer text lives in the image."
          >
            <button
              type="button"
              className={cn(
                "flex h-block-sm w-full flex-col items-center justify-center gap-1",
                "rounded-control border border-dashed border-border-strong",
                "text-caption text-ink-muted",
                "transition-colors duration-fast hover:bg-canvas hover:text-ink",
              )}
            >
              <ImageIcon className="size-6" aria-hidden="true" />
              Upload artwork
            </button>
          </FormField>

          <FormField label="Title" required help="How you refer to it here.">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monsoon cleaning offer"
            />
          </FormField>

          <FormField label="Tapping it opens">
            <div
              role="radiogroup"
              aria-label="Link type"
              className="grid grid-cols-3 gap-1 rounded-control bg-neutral-subtle p-1"
            >
              {(
                [
                  ["none", "Nothing"],
                  ["category", "A category"],
                  ["service", "A service"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={linkType === v}
                  onClick={() => {
                    setLinkType(v);
                    setLinkTarget(null);
                  }}
                  className={cn(
                    "rounded-pill px-2 py-2 text-small transition-colors duration-fast",
                    linkType === v
                      ? "bg-surface font-semibold text-ink shadow-sm"
                      : "font-medium text-ink-muted hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </FormField>

          {linkType !== "none" && (
            <FormField label={linkType === "category" ? "Category" : "Service"} required>
              <Combobox
                options={targets}
                value={linkTarget}
                onChange={setLinkTarget}
                placeholder={`Choose a ${linkType}`}
                searchPlaceholder="Search"
                aria-label={linkType === "category" ? "Category" : "Service"}
              />
            </FormField>
          )}

          <FormField
            label="Schedule"
            help="Leave the dates empty to show it as soon as it is switched on."
          >
            <div className="space-y-3">
              <DateRangePicker
                value={range}
                onChange={setRange}
                direction="future"
                placeholder="Choose dates"
              />

              {/* Times are always shown, disabled until there are dates to
                  attach them to. Rendering them only after a date is picked
                  hides the fact that scheduling has an hour at all. */}
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-caption text-ink-muted">
                    Goes live at
                  </span>
                  <Input
                    inputSize="sm"
                    type="time"
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                    disabled={!range?.from}
                    aria-label="Time the banner goes live"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-caption text-ink-muted">
                    Comes down at
                  </span>
                  <Input
                    inputSize="sm"
                    type="time"
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    disabled={!range?.to}
                    aria-label="Time the banner comes down"
                  />
                </label>
              </div>

              <p className="tabular rounded-control bg-canvas p-2 text-caption text-ink-muted">
                {range?.from ? (
                  <>
                    Live from{" "}
                    <span className="font-medium text-ink">
                      {formatDate(withTime(range.from, fromTime), "datetime")}
                    </span>
                    {range.to ? (
                      <>
                        {" until "}
                        <span className="font-medium text-ink">
                          {formatDate(withTime(range.to, toTime), "datetime")}
                        </span>
                      </>
                    ) : (
                      " onwards"
                    )}
                    .
                  </>
                ) : (
                  "No schedule set — it shows as soon as it is switched on."
                )}
              </p>
            </div>
          </FormField>

          <div className="flex items-center justify-between gap-3 rounded-control border border-border p-3">
            <span className="min-w-0">
              <span className="block text-small font-medium text-ink">
                {active ? "Active" : "Paused"}
              </span>
              <span className="block text-caption text-ink-muted">
                {active
                  ? "Shows on the app during its scheduled window."
                  : "Saved, but never shown."}
              </span>
            </span>
            <Switch
              checked={active}
              onCheckedChange={setActive}
              aria-label={`Banner is ${active ? "active" : "paused"}`}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="primary" onClick={save} disabled={!canSave}>
            {editing ? "Save banner" : "Add banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PromoSkeleton() {
  return (
    <div className="divide-y divide-border-soft">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="h-block-xs w-line-lg shrink-0 rounded-control sm:w-line-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-line-lg" />
            <Skeleton className="h-3 w-full max-w-line-xl" />
          </div>
          <Skeleton className="h-6 w-line-xs" />
        </div>
      ))}
    </div>
  );
}

export default function PromotionsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-block-lg rounded-card" />}>
      <PromotionsInner />
    </Suspense>
  );
}
