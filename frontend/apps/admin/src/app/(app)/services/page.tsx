"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Search,
  Tags,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import {
  getCategories,
  getCommissionRules,
  getPricingRules,
  getServices,
  getSubCategories,
  createCategory,
  updateCategory,
  reorderCategories,
  createSubCategory,
  updateSubCategory,
  createService,
  updateService,
  deleteService,
  updatePricingRule,
  uploadCatalogImage,
} from "@cfc/mocks";
import { ApiError } from "@cfc/types";
import type {
  Category,
  CommissionRule,
  PricingRule,
  ServiceAddOn,
  ServiceDetail,
  ServiceVariant,
  SubCategory,
} from "@cfc/types";
import {
  Badge,
  Button,
  Combobox,
  DataTable,
  DetailList,
  DetailRow,
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
  FormField,
  InlineAlert,
  Input,
  NoResultsState,
  PageHeader,
  Skeleton,
  Switch,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  cn,
  formatCurrency,
  toast,
  useReorder,
  type CardLayout,
  type Column,
} from "@cfc/ui";

/**
 * Admin 22–29 — Service & Pricing Management.
 *
 * Nav restructure (approved plan): one sidebar item, four tabs.
 *
 *  - Categories (22)     — list with reorder + active toggle. Add/Edit (23)
 *                          opens as a dialog from this tab, not a page.
 *  - Sub-categories (24) — nested list. Add/Edit (25) opens as a dialog.
 *  - Services (26)       — searchable list. Add/Edit (27) opens as a dialog.
 *  - Pricing & Commission — Pricing (28) and Commission (29) share one tab as
 *                          two sections, per the approved plan: both are
 *                          editable rate tables an operator tunes together.
 *
 * The Add/Edit forms moved from standalone `FormShell` pages into dialogs
 * triggered from their own list, so no add/edit screen keeps a route or nav
 * presence of its own. Their fields are unchanged.
 */

/**
 * Extends a small control's hit area to 44px under a finger, without changing
 * what is painted.
 *
 * The `Button` component does this for its own compact sizes; these reorder
 * arrows are raw `<button>`s inside a segmented pair, so they need it applied
 * directly. `coarse:` is a pointer query — a mouse keeps the tight 24px
 * target, which is what makes the paired arrows readable as one control.
 */
const TOUCH_TARGET =
  "relative coarse:after:absolute coarse:after:left-1/2 coarse:after:top-1/2 " +
  "coarse:after:size-touch coarse:after:-translate-x-1/2 " +
  "coarse:after:-translate-y-1/2 coarse:after:content-['']";

const TAB_PARAM = "tab";
type ServicesTab = "categories" | "sub-categories" | "services" | "pricing";

/**
 * Reports a write that failed.
 *
 * The server's own message is shown when there is one. Those messages are
 * written for an operator and say what is in the way — *"That category still
 * has 3 sub-categories"* — which a generic "Could not save" would throw away.
 * The fallback is only for a network failure, where there is no server message
 * to show.
 */
function reportFailure(err: unknown, fallback: string): void {
  toast.error(err instanceof ApiError ? err.message : fallback);
}

/** Admin 27 — how many images a service can carry. */
const MAX_IMAGES = 3;

/**
 * Uploads service images and shows what is there.
 *
 * Replaces three dashed buttons that had no `onClick` and no file input — they
 * looked like an uploader and did nothing at all.
 *
 * The upload happens **immediately on choosing a file**, not on saving the
 * dialog. Deferring it would mean holding `File` objects in state and sending a
 * multipart body alongside the service JSON, and a failure then arrives while
 * the operator is trying to save something else. Uploading first means the
 * service only ever carries paths, and a rejected image is reported next to the
 * picker where it was chosen.
 *
 * The cost is an orphaned file if someone uploads and then cancels the dialog.
 * `ponytail:` orphans are left on disk; add a sweep for unreferenced uploads if
 * it ever amounts to anything worth reclaiming.
 */
function ImagePicker({
  paths,
  onChange,
}: {
  paths: string[];
  onChange: (next: string[]) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const { path } = await uploadCatalogImage(file);
      onChange([...paths, path].slice(0, MAX_IMAGES));
    } catch (err) {
      // The server checks the real bytes, not the extension, so a renamed file
      // is refused here with a message saying what is supported.
      reportFailure(err, "Could not upload that image.");
    } finally {
      setBusy(false);
      // Cleared so choosing the same file twice in a row fires onChange again.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {paths.map((src, i) => (
          <div
            key={src}
            className="group relative aspect-square overflow-hidden rounded-control border border-border"
          >
            {/* Plain <img>: the path is proxied to the API by the /uploads
                rewrite in next.config.js, so no loader config is involved. */}
            <img
              src={src}
              alt={i === 0 ? "Cover image" : `Image ${i + 1}`}
              className="size-full object-cover"
            />
            {/* `bg-on-media`, not `bg-ink/75`: an opacity modifier on a var()
                colour generates no CSS, so this badge and the button below it
                were white text on the bare photograph. */}
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded-pill bg-on-media px-2 py-1 text-caption text-white">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(paths.filter((p) => p !== src))}
              aria-label={`Remove image ${i + 1}`}
              className={cn(
                "absolute right-1 top-1 rounded-full bg-on-media p-1 text-white",
                "transition-opacity duration-fast",
                // Always visible on touch, where there is no hover to reveal it.
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 coarse:opacity-100",
              )}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}

        {paths.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1",
              "rounded-control border border-dashed border-border-strong",
              "text-caption text-ink-muted",
              "transition-colors duration-fast hover:bg-canvas hover:text-ink",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <Plus className="size-4" aria-hidden="true" />
            {busy ? "Uploading…" : "Upload"}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
        }}
      />
    </div>
  );
}

function ServiceAndPricingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get(TAB_PARAM) as ServicesTab | null) ?? "categories";

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, next);
    router.push(`/services?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Service & pricing management"
        description="The service catalog customers browse, and the rates behind it."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="sub-categories">Sub-categories</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="pricing">Pricing &amp; commission</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="sub-categories">
          <SubCategoriesTab />
        </TabsContent>
        <TabsContent value="services">
          <ServicesTab />
        </TabsContent>
        <TabsContent value="pricing">
          <PricingAndCommissionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}





/**
 * Admin 22–25 — Categories and sub-categories.
 *
 * Inventory 22: "All service categories, drag-to-reorder, active/inactive
 * toggle." 23: "Name, icon, description, sort order, status."
 * 24: "Nested categories management." 25: "Name, parent, icon, status."
 *
 * Order is the point of this screen. The sort order here is the order a
 * customer sees on the app home grid, so reordering is a merchandising
 * decision, not admin housekeeping — which is why the controls are on the row
 * rather than hidden in an edit form.
 *
 * Rows drag. Clicking an arrow repeatedly to move a category five places means
 * losing track of where it went, which is the failure the arrows alone had — so
 * dragging is the primary gesture and the list reorders live under the pointer.
 *
 * The arrows stay because drag is not reachable by keyboard, is awkward with a
 * screen reader, and does not work on touch without a long-press nobody
 * discovers. They are the accessible path, not the main one.
 */
function CategoriesTab() {
  const [rows, setRows] = React.useState<Category[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getCategories()
      .then((r) => setRows([...r].sort((a, b) => a.sortOrder - b.sortOrder)))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  // Sort order is renumbered from position on every change, so the number on
  // the row can never disagree with where the row actually is.
  const renumber = React.useCallback(
    (next: Category[]) => next.map((c, i) => ({ ...c, sortOrder: i + 1 })),
    [],
  );

  const { draggingIndex, overIndex, rowProps, move } = useReorder({
    items: rows ?? [],
    // Moves optimistically so the row follows the pointer, then persists on
    // drop. A reorder that waited for the server would lag behind the drag.
    onChange: (next) => setRows(renumber(next)),
    onCommit: (next) => {
      void reorderCategories(renumber(next).map((c) => c.id))
        .then((saved) => {
          setRows(saved);
          toast.success("Order updated — the app home grid follows this order");
        })
        .catch((err: unknown) => {
          // The optimistic move already happened, so a failure has to put the
          // list back. Leaving it would show an order the app does not use.
          reportFailure(err, "Could not save the new order.");
          load();
        });
    },
  });

  const toggle = (id: string) => {
    const row = rows?.find((c) => c.id === id);
    if (!row) return;
    const next = !row.active;

    setRows((rs) => rs?.map((c) => (c.id === id ? { ...c, active: next } : c)) ?? rs);

    void updateCategory(id, { active: next })
      .then(() => {
        toast.success(
          next
            ? `${row.name} is visible in the app`
            : `${row.name} is hidden from the app`,
        );
      })
      .catch((err: unknown) => {
        setRows((rs) =>
          rs?.map((c) => (c.id === id ? { ...c, active: row.active } : c)) ?? rs,
        );
        reportFailure(err, "Could not change that category.");
      });
  };

  /** Merges a row the server has already saved. */
  const upsert = (c: Category) => {
    setRows((rs) => {
      if (!rs) return [c];
      const exists = rs.some((x) => x.id === c.id);
      return exists ? rs.map((x) => (x.id === c.id ? c : x)) : [...rs, c];
    });
  };

  const hidden = (rows ?? []).filter((c) => !c.active).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-ink-muted">
          Drag a row to reorder. The order here is the order customers see on
          the app home grid.
          {hidden > 0 &&
            ` ${hidden} categor${hidden === 1 ? "y is" : "ies are"} hidden from the app.`}
        </p>
        <CategoryDialog onSaved={upsert} nextOrder={(rows?.length ?? 0) + 1} />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The categories could not load"
            action={{ label: "Try again", onClick: load }}
          />
        ) : !rows ? (
          <CatalogueSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Layers />}
            title="No categories yet"
            description="Categories are the top level of the service catalogue. Add one to get started."
          />
        ) : (
          <ul className="divide-y divide-border-soft">
            {rows.map((c, i) => (
              <li
                key={c.id}
                {...rowProps(i)}
                className={cn(
                  "flex flex-wrap items-center gap-3 p-4",
                  "transition-colors duration-fast",
                  c.active ? "hover:bg-canvas" : "bg-canvas",
                  // The row being carried dims; the row it would land on gets
                  // a teal edge, so the drop target is never a guess.
                  draggingIndex === i && "opacity-50",
                  overIndex === i &&
                    draggingIndex !== i &&
                    "border-t-2 border-action",
                )}
              >
                {/* The grip says the row is draggable; the arrows are the
                    keyboard and touch path to the same thing. */}
                <span className="flex shrink-0 items-center gap-2">
                  <GripVertical
                    className="size-4 cursor-grab text-ink-faint active:cursor-grabbing"
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "tabular grid size-6 place-items-center rounded-control",
                      "bg-neutral-subtle text-caption font-medium text-ink-muted",
                    )}
                    aria-hidden="true"
                  >
                    {c.sortOrder}
                  </span>
                  <span className="flex overflow-hidden rounded-control border border-border-strong">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move ${c.name} up, to position ${c.sortOrder - 1}`}
                      className={cn(
                        "grid size-6 place-items-center border-r border-border-strong",
                        "text-ink-muted transition-colors duration-fast",
                        "hover:bg-canvas hover:text-ink",
                        "disabled:bg-disabled disabled:text-disabled-ink",
                        // Drag does not work on touch, so these arrows are the
                        // only way to reorder on a phone. 24px painted, 44px
                        // to hit.
                        TOUCH_TARGET,
                      )}
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === rows.length - 1}
                      aria-label={`Move ${c.name} down, to position ${c.sortOrder + 1}`}
                      className={cn(
                        "grid size-6 place-items-center",
                        "text-ink-muted transition-colors duration-fast",
                        "hover:bg-canvas hover:text-ink",
                        "disabled:bg-disabled disabled:text-disabled-ink",
                        TOUCH_TARGET,
                      )}
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-small font-medium",
                        c.active ? "text-ink" : "text-ink-muted",
                      )}
                    >
                      {c.name}
                    </span>
                    {/* No status badge here: the switch beside it already
                        states the fact and is the thing that changes it. Two
                        controls for one state is what made this confusing. */}
                  </span>
                  <span className="mt-px block truncate text-caption text-ink-muted">
                    {c.description}
                  </span>
                </span>

                <span className="tabular shrink-0 text-caption text-ink-muted">
                  {c.serviceCount} service{c.serviceCount === 1 ? "" : "s"}
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "hidden text-caption font-medium sm:block",
                        c.active ? "text-ink" : "text-ink-muted",
                      )}
                    >
                      {c.active ? "Active" : "Hidden"}
                    </span>
                    <Switch
                      checked={c.active}
                      onCheckedChange={() => toggle(c.id)}
                      aria-label={`${c.name} is ${c.active ? "active" : "hidden"}`}
                    />
                  </span>
                  <CategoryDialog category={c} onSaved={upsert} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Admin 23 — add or edit a category.
 *
 * Inventory: "Name, icon, description, sort order, status."
 *
 * Sort order is a field AND a pair of row controls. They are not two ways to
 * say the same thing: the arrows are for nudging a category one place, the
 * field is for moving it from twelfth to second without twelve clicks. Both
 * write the same number, and the list renumbers from position afterwards.
 */
const ICON_CHOICES = [
  "Wrench",
  "Sparkles",
  "HeartPulse",
  "PartyPopper",
  "Briefcase",
  "Home",
  "Zap",
  "Droplet",
];

function CategoryDialog({
  category,
  nextOrder,
  onSaved,
}: {
  category?: Category | undefined;
  nextOrder?: number | undefined;
  onSaved: (c: Category) => void;
}) {
  const editing = category !== undefined;
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [iconName, setIconName] = React.useState(ICON_CHOICES[0] ?? "Wrench");
  const [sortOrder, setSortOrder] = React.useState(1);
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setDescription(category?.description ?? "");
    setIconName(category?.iconName ?? ICON_CHOICES[0] ?? "Wrench");
    setSortOrder(category?.sortOrder ?? nextOrder ?? 1);
    setActive(category?.active ?? true);
  }, [open, category, nextOrder]);

  const [saving, setSaving] = React.useState(false);

  /**
   * Saves through the API and merges what comes back.
   *
   * The id comes from the **server**, not from `cat_${Date.now()}` as this did
   * before — a client-minted id looks real until a reload replaces it with the
   * database's own and every link made in between breaks.
   */
  const save = async () => {
    if (name.trim() === "" || saving) return;
    setSaving(true);
    try {
      const saved = editing
        ? await updateCategory(category.id, {
            name: name.trim(),
            description: description.trim(),
            iconName,
            sortOrder,
            active,
          })
        : await createCategory({
            name: name.trim(),
            description: description.trim(),
            iconName,
            active,
          });

      onSaved(saved);
      toast.success(editing ? `${saved.name} updated` : `${saved.name} added`);
      setOpen(false);
    } catch (err) {
      // The dialog stays open with the typed values intact. Closing it on a
      // duplicate-name refusal would discard what the operator wrote and tell
      // them nothing about why.
      reportFailure(err, "Could not save that category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="ghost" size="sm" aria-label={`Edit ${category.name}`}>
            <Pencil />
          </Button>
        ) : (
          <Button variant="primary">
            <Plus />
            Add category
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit ${category.name}` : "Add a category"}
          </DialogTitle>
          <DialogDescription>
            Categories are the top level of the catalogue and appear on the app
            home grid.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormField label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Home &amp; Maintenance"
              autoFocus
            />
          </FormField>

          <FormField
            label="Description"
            help="One line, shown under the category name in the app."
          >
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Electrical, plumbing, painting and repairs"
            />
          </FormField>

          <FormField label="Icon">
            <IconPicker value={iconName} onChange={setIconName} />
          </FormField>

          <FormField
            label="Sort order"
            help="Position on the app home grid. 1 is first."
          >
            <Input
              type="number"
              min={1}
              value={String(sortOrder)}
              onChange={(e) =>
                setSortOrder(Math.max(1, Math.round(Number(e.target.value)) || 1))
              }
              aria-label="Sort order"
            />
          </FormField>

          {/* The same switch as the row, so status means one thing in one
              way everywhere. The label beside it states the CURRENT state
              rather than the action, which is what a switch reads as. */}
          <div className="flex items-center justify-between gap-3 rounded-control border border-border p-3">
            <span className="min-w-0">
              <span className="block text-small font-medium text-ink">
                {active ? "Active" : "Hidden"}
              </span>
              <span className="block text-caption text-ink-muted">
                {active
                  ? "Customers can see this category and everything under it."
                  : "Hidden from the app, along with every service under it."}
              </span>
            </span>
            <Switch
              checked={active}
              onCheckedChange={setActive}
              aria-label={`Category is ${active ? "active" : "hidden"}`}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="primary"
            onClick={() => {
              void save();
            }}
            disabled={name.trim() === ""}
            loading={saving}
          >
            {editing ? "Save changes" : "Add category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Admin 24 + 25 — sub-categories.
 *
 * Grouped under their parent rather than listed flat. A sub-category means
 * nothing without its category — "Cleaning" under Home & Maintenance is a
 * different thing from "Cleaning" under Business — and a flat list makes an
 * operator hold that relationship in their head.
 */
function SubCategoriesTab() {
  const [categories, setCategories] = React.useState<Category[] | null>(null);
  const [subs, setSubs] = React.useState<SubCategory[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    Promise.all([getCategories(), getSubCategories()])
      .then(([c, s]) => {
        setCategories([...c].sort((a, b) => a.sortOrder - b.sortOrder));
        setSubs(s);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const toggle = (id: string) => {
    const row = subs?.find((s) => s.id === id);
    if (!row) return;
    const next = !row.active;

    // Optimistic, then reverted on failure — a switch that waits for a round
    // trip before moving feels broken, and one that never reverts lies.
    setSubs((ss) => ss?.map((s) => (s.id === id ? { ...s, active: next } : s)) ?? ss);

    void updateSubCategory(id, { active: next }).catch((err: unknown) => {
      setSubs((ss) =>
        ss?.map((s) => (s.id === id ? { ...s, active: row.active } : s)) ?? ss,
      );
      reportFailure(err, "Could not change that sub-category.");
    });
  };

  /** Merges a row the server has already saved. */
  const upsert = (s: SubCategory) => {
    setSubs((ss) => {
      if (!ss) return [s];
      const exists = ss.some((x) => x.id === s.id);
      return exists ? ss.map((x) => (x.id === s.id ? s : x)) : [...ss, s];
    });
  };

  if (error) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <ErrorState
          icon={<TriangleAlert />}
          title="The sub-categories could not load"
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  if (!categories || !subs) return <CatalogueSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-ink-muted">
          {subs.length} sub-categories across {categories.length} categories.
        </p>
        <SubCategoryDialog categories={categories} onSaved={upsert} />
      </div>

      {categories.map((c) => {
        const own = subs.filter((s) => s.categoryId === c.id);
        return (
          <section
            key={c.id}
            className="overflow-hidden rounded-card border border-border bg-surface shadow-sm"
          >
            <header className="flex items-center justify-between gap-3 border-b border-border bg-canvas px-4 py-3">
              <span className="flex items-center gap-2">
                <span className="text-small font-medium text-ink">{c.name}</span>
                {!c.active && <Badge tone="neutral">Hidden</Badge>}
              </span>
              <span className="tabular text-caption text-ink-muted">
                {own.length} sub-categor{own.length === 1 ? "y" : "ies"}
              </span>
            </header>

            {own.length === 0 ? (
              <p className="px-4 py-6 text-center text-small text-ink-muted">
                Nothing under this category yet.
              </p>
            ) : (
              <ul className="divide-y divide-border-soft">
                {own.map((s) => (
                  <li
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      !s.active && "bg-canvas",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "text-small",
                          s.active ? "text-ink" : "text-ink-muted",
                        )}
                      >
                        {s.name}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "hidden text-caption font-medium sm:block",
                          s.active ? "text-ink" : "text-ink-muted",
                        )}
                      >
                        {s.active ? "Active" : "Hidden"}
                      </span>
                      <Switch
                        checked={s.active}
                        onCheckedChange={() => toggle(s.id)}
                        aria-label={`${s.name} is ${s.active ? "active" : "hidden"}`}
                      />
                    </span>
                    <SubCategoryDialog
                      categories={categories}
                      subCategory={s}
                      onSaved={upsert}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

/**
 * Icon picker.
 *
 * Shared by categories and sub-categories, because both take one from the same
 * set and two copies of a chooser eventually diverge.
 */
function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ICON_CHOICES.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={cn(
            "rounded-control border px-3 py-2 text-caption",
            "transition-colors duration-fast",
            value === n
              ? "border-action bg-action-subtle text-action-press"
              : "border-border-strong text-ink-muted hover:bg-canvas",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function SubCategoryDialog({
  categories,
  subCategory,
  onSaved,
}: {
  categories: Category[];
  subCategory?: SubCategory | undefined;
  onSaved: (s: SubCategory) => void;
}) {
  const editing = subCategory !== undefined;
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [iconName, setIconName] = React.useState(ICON_CHOICES[0] ?? "Wrench");
  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setName(subCategory?.name ?? "");
    setCategoryId(subCategory?.categoryId ?? categories[0]?.id ?? null);
    setIconName(subCategory?.iconName ?? ICON_CHOICES[0] ?? "Wrench");
    setActive(subCategory?.active ?? true);
  }, [open, subCategory, categories]);

  const parent = categories.find((c) => c.id === categoryId);
  const canSave = name.trim() !== "" && parent !== undefined;

  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!parent || saving) return;
    setSaving(true);
    try {
      const saved = editing
        ? await updateSubCategory(subCategory.id, {
            name: name.trim(),
            categoryId: parent.id,
            iconName,
            active,
          })
        : await createSubCategory({
            name: name.trim(),
            categoryId: parent.id,
            iconName,
            active,
          });

      onSaved(saved);
      toast.success(editing ? `${saved.name} updated` : `${saved.name} added`);
      setOpen(false);
    } catch (err) {
      reportFailure(err, "Could not save that sub-category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Edit ${subCategory.name}`}
          >
            <Pencil />
          </Button>
        ) : (
          <Button variant="primary">
            <Plus />
            Add sub-category
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit ${subCategory.name}` : "Add a sub-category"}
          </DialogTitle>
          <DialogDescription>
            Sub-categories group services inside a category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormField label="Parent category" required>
            <Combobox
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
                ...(c.active ? {} : { description: "Hidden in the app" }),
              }))}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Choose a category"
              aria-label="Parent category"
            />
          </FormField>

          <FormField label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Electrical &amp; AC"
            />
          </FormField>

          <FormField label="Icon">
            <IconPicker value={iconName} onChange={setIconName} />
          </FormField>

          <div className="flex items-center justify-between gap-3 rounded-control border border-border p-3">
            <span className="min-w-0">
              <span className="block text-small font-medium text-ink">
                {active ? "Active" : "Hidden"}
              </span>
              <span className="block text-caption text-ink-muted">
                {active
                  ? "Customers can see this sub-category."
                  : "Hidden from the app, along with its services."}
              </span>
            </span>
            <Switch
              checked={active}
              onCheckedChange={setActive}
              aria-label={`Sub-category is ${active ? "active" : "hidden"}`}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="primary"
            onClick={() => {
              void save();
            }}
            disabled={!canSave}
            loading={saving}
          >
            {editing ? "Save changes" : "Add sub-category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CatalogueSkeleton() {
  return (
    <div className="divide-y divide-border-soft">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="size-6 rounded-control" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-line-lg" />
            <Skeleton className="h-3 w-full max-w-line-2xl" />
          </div>
          <Skeleton className="h-6 w-line-xs" />
        </div>
      ))}
    </div>
  );
}

/**
 * Admin 28 — Pricing management.
 *
 * Inventory: "Base price, platform fee (editable), visit charge, night
 * surcharge, city-wise override."
 *
 * Every figure here ends up on a customer's checkout screen, so the row shows
 * what the customer will actually pay rather than only the parts. An operator
 * changing a platform fee should see the total move, because the total is the
 * number that gets disputed.
 *
 * GST is shown but not editable: the agreement fixes it at CGST 9% + SGST 9% on
 * the platform fee alone, never on the pro's professional fee.
 */

/** SRS 3.4 — CGST 9% + SGST 9%, applied to the platform fee only. */
const GST_RATE = 0.18;

function PricingSection() {
  const [rows, setRows] = React.useState<PricingRule[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getPricingRules()
      .then(setRows)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const save = (rule: PricingRule) => {
    // Not optimistic. Every other write on this screen moves first and reverts
    // on failure, but this one changes what a customer is charged — showing a
    // new price that did not save is the one failure here worth avoiding
    // outright, so the row waits for the server's own figures.
    void updatePricingRule(rule.serviceId, {
      basePricePaise: rule.basePricePaise,
      platformFeePaise: rule.platformFeePaise,
      visitChargePaise: rule.visitChargePaise,
      nightSurchargePaise: rule.nightSurchargePaise,
      cityOverride: rule.cityOverride ?? null,
    })
      .then((saved) => {
        setRows(
          (rs) =>
            rs?.map((r) => (r.serviceId === saved.serviceId ? saved : r)) ?? rs,
        );
        toast.success(`${saved.serviceName} pricing updated`);
      })
      .catch((err: unknown) =>
        reportFailure(err, "Could not update that pricing."),
      );
  };

  const visible = React.useMemo(() => {
    const items = rows ?? [];
    const q = search.trim().toLowerCase();
    return q
      ? items.filter((r) => r.serviceName.toLowerCase().includes(q))
      : items;
  }, [rows, search]);

  const withOverride = (rows ?? []).filter((r) => r.cityOverride).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Services priced"
          value={rows?.length ?? 0}
          loading={rows === null}
          hint="every one is admin-editable"
        />
        <StatCard
          label="City overrides"
          value={withOverride}
          loading={rows === null}
          hint="a different base price locally"
        />
        <StatCard
          label="Average platform fee"
          value={
            rows && rows.length > 0
              ? formatCurrency(
                  Math.round(
                    rows.reduce((s, r) => s + r.platformFeePaise, 0) /
                      rows.length,
                  ),
                )
              : "—"
          }
          loading={rows === null}
          hint="CFC revenue per booking"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by service name"
          searchLabel="Search pricing"
          resultLabel={rows ? `${visible.length} of ${rows.length}` : undefined}
        />

        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The pricing could not load"
            action={{ label: "Try again", onClick: load }}
          />
        ) : !rows ? (
          <CatalogueSkeleton />
        ) : visible.length === 0 ? (
          search ? (
            <NoResultsState onClearFilters={() => setSearch("")} />
          ) : (
            <EmptyState
              icon={<Tags />}
              title="Nothing priced yet"
              description="Add a service first, then set what it costs."
            />
          )
        ) : (
          <ul className="divide-y divide-border-soft">
            {visible.map((r) => (
              <PricingRow key={r.serviceId} rule={r} onSave={save} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** What a customer pays for one booking of this service, before any coupon. */
function customerTotal(r: PricingRule): number {
  const gst = Math.round(r.platformFeePaise * GST_RATE);
  return r.basePricePaise + r.platformFeePaise + gst + r.visitChargePaise;
}

function PricingRow({
  rule,
  onSave,
}: {
  rule: PricingRule;
  onSave: (r: PricingRule) => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 p-4 transition-colors duration-fast hover:bg-canvas">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-small font-medium text-ink">
            {rule.serviceName}
          </span>
          {rule.cityOverride && (
            <Badge tone="clock" dot>
              {rule.cityOverride.city} override
            </Badge>
          )}
        </span>
        <span className="tabular mt-px block text-caption text-ink-muted">
          {formatCurrency(rule.basePricePaise)} base ·{" "}
          {formatCurrency(rule.platformFeePaise)} fee ·{" "}
          {formatCurrency(rule.visitChargePaise)} visit
          {rule.nightSurchargePaise > 0 &&
            ` · ${formatCurrency(rule.nightSurchargePaise)} night`}
        </span>
      </span>

      {/* The number that ends up on a customer's screen. */}
      <span className="w-amount shrink-0 text-right">
        <span className="tabular block text-small font-semibold text-ink">
          {formatCurrency(customerTotal(rule))}
        </span>
        <span className="block text-caption text-ink-faint">customer pays</span>
      </span>

      <PricingDialog rule={rule} onSave={onSave} />
    </li>
  );
}

function PricingDialog({
  rule,
  onSave,
}: {
  rule: PricingRule;
  onSave: (r: PricingRule) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [base, setBase] = React.useState(0);
  const [fee, setFee] = React.useState(0);
  const [visit, setVisit] = React.useState(0);
  const [night, setNight] = React.useState(0);
  const [overrideOn, setOverrideOn] = React.useState(false);
  const [overrideCity, setOverrideCity] = React.useState("");
  const [overrideBase, setOverrideBase] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    setBase(rule.basePricePaise);
    setFee(rule.platformFeePaise);
    setVisit(rule.visitChargePaise);
    setNight(rule.nightSurchargePaise);
    setOverrideOn(rule.cityOverride !== undefined);
    setOverrideCity(rule.cityOverride?.city ?? "");
    setOverrideBase(rule.cityOverride?.basePricePaise ?? rule.basePricePaise);
  }, [open, rule]);

  const draft: PricingRule = {
    ...rule,
    basePricePaise: base,
    platformFeePaise: fee,
    visitChargePaise: visit,
    nightSurchargePaise: night,
    ...(overrideOn && overrideCity.trim() !== ""
      ? {
          cityOverride: {
            city: overrideCity.trim(),
            basePricePaise: overrideBase,
          },
        }
      : { cityOverride: undefined }),
  };

  const gst = Math.round(fee * GST_RATE);
  const total = customerTotal(draft);
  const wasTotal = customerTotal(rule);
  const delta = total - wasTotal;

  const save = () => {
    onSave(draft);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Edit pricing
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule.serviceName}</DialogTitle>
          <DialogDescription>
            These figures appear on the customer&apos;s checkout screen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <RupeeField label="Base price" value={base} onChange={setBase} />
            <RupeeField
              label="Platform fee"
              value={fee}
              onChange={setFee}
              help="CFC revenue. GST rides on this alone."
            />
            <RupeeField
              label="Visit charge"
              value={visit}
              onChange={setVisit}
              help="Charged even if the job is declined."
            />
            <RupeeField
              label="Night surcharge"
              value={night}
              onChange={setNight}
              help="Added after 9pm."
            />
          </div>

          <div className="rounded-card border border-border">
            <div className="flex items-center justify-between gap-3 border-b border-border p-3">
              <span>
                <span className="block text-small font-medium text-ink">
                  City-wise override
                </span>
                <span className="block text-caption text-ink-muted">
                  A different base price in one city.
                </span>
              </span>
              <Switch
                checked={overrideOn}
                onCheckedChange={setOverrideOn}
                aria-label="City-wise override"
              />
            </div>
            {overrideOn && (
              <div className="grid gap-3 p-3 sm:grid-cols-2">
                <FormField label="City" required>
                  <Input
                    value={overrideCity}
                    onChange={(e) => setOverrideCity(e.target.value)}
                    placeholder="e.g. Chennai"
                  />
                </FormField>
                <RupeeField
                  label="Base price there"
                  value={overrideBase}
                  onChange={setOverrideBase}
                />
              </div>
            )}
          </div>

          {/* The arithmetic, spelled out. A fee change that moves the total by
              ₹40 should show that before it is saved, not after a customer
              complains. */}
          <div className="rounded-card bg-canvas p-3">
            <DetailList>
              <DetailRow
                label="Base price"
                value={formatCurrency(base)}
                tabular
              />
              <DetailRow
                label="Platform fee"
                value={formatCurrency(fee)}
                tabular
              />
              <DetailRow
                label="GST on the fee (CGST 9% + SGST 9%)"
                value={formatCurrency(gst)}
                tabular
              />
              <DetailRow
                label="Visit charge"
                value={formatCurrency(visit)}
                tabular
              />
            </DetailList>
            <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
              <span className="text-small font-semibold text-ink">
                Customer pays
              </span>
              <span className="text-right">
                <span className="tabular block text-heading font-semibold text-ink">
                  {formatCurrency(total)}
                </span>
                {delta !== 0 && (
                  <span
                    className={cn(
                      "tabular block text-caption font-medium",
                      delta > 0 ? "text-clock-ink" : "text-live-ink",
                    )}
                  >
                    {delta > 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(delta))} vs. now
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="primary" onClick={save}>
            Save pricing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A money field that speaks rupees and stores paise. */
function RupeeField({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value: number;
  onChange: (paise: number) => void;
  help?: string | undefined;
}) {
  return (
    <FormField label={label} {...(help ? { help } : {})}>
      <Input
        type="number"
        min={0}
        value={String(value / 100)}
        onChange={(e) =>
          onChange(Math.max(0, Math.round(Number(e.target.value) * 100) || 0))
        }
        trailing="₹"
        aria-label={`${label} in rupees`}
      />
    </FormField>
  );
}

/**
 * Admin 29 — Commission settings.
 *
 * Inventory: "Platform commission % per category / per Pro / special rates for
 * partners."
 *
 * Grouped by scope, because the three kinds are read differently: a category
 * rate is policy, a per-pro rate is an exception that needs justifying, and a
 * partner rate is a negotiated deal. Showing them in one flat table hides which
 * is which.
 *
 * The platform default is stated at the top so any rate can be read as a
 * departure from it rather than as an isolated number.
 */
const DEFAULT_COMMISSION_BPS = 1500;

const SCOPE_LABEL: Record<CommissionRule["scope"], string> = {
  category: "By category",
  pro: "Per pro",
  partner: "Partner rates",
};

const SCOPE_NOTE: Record<CommissionRule["scope"], string> = {
  category: "Applies to every service in the category unless overridden below.",
  pro: "An exception for one professional. Overrides their category rate.",
  partner:
    "Negotiated with Associate and Major Partners, who run their own teams. These override every rate above.",
};

function CommissionSection() {
  const [rows, setRows] = React.useState<CommissionRule[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getCommissionRules()
      .then(setRows)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const setRate = (id: string, bps: number) => {
    setRows((rs) =>
      rs?.map((r) => (r.id === id ? { ...r, commissionBps: bps } : r)) ?? rs,
    );
  };

  if (error) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <ErrorState
          icon={<TriangleAlert />}
          title="The commission rules could not load"
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  if (!rows) return <CatalogueSkeleton />;

  const scopes: CommissionRule["scope"][] = ["category", "pro", "partner"];

  return (
    <div className="space-y-4">
      <InlineAlert title="Platform default is 15%">
        Every pro pays this on completed jobs, with the first 20 jobs at 0% as an
        onboarding offer. The rules below are departures from that default.
      </InlineAlert>

      {scopes.map((scope) => {
        const own = rows.filter((r) => r.scope === scope);
        if (own.length === 0) return null;
        return (
          <section
            key={scope}
            className="overflow-hidden rounded-card border border-border bg-surface shadow-sm"
          >
            <header className="border-b border-border bg-canvas px-4 py-3">
              <p className="text-small font-medium text-ink">
                {SCOPE_LABEL[scope]}
              </p>
              <p className="text-caption text-ink-muted">{SCOPE_NOTE[scope]}</p>
            </header>

            <ul className="divide-y divide-border-soft">
              {own.map((r) => {
                const pct = r.commissionBps / 100;
                const diff = r.commissionBps - DEFAULT_COMMISSION_BPS;
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-small text-ink",
                          scope === "partner" && "font-medium",
                        )}
                      >
                        {r.targetName}
                      </span>
                      {r.note && (
                        <span className="block text-caption text-ink-muted">
                          {r.note}
                        </span>
                      )}
                    </span>

                    {diff !== 0 && (
                      <span
                        className={cn(
                          "tabular shrink-0 text-caption font-medium",
                          diff < 0 ? "text-live-ink" : "text-clock-ink",
                        )}
                      >
                        {diff > 0 ? "+" : "−"}
                        {Math.abs(diff) / 100}% vs. default
                      </span>
                    )}

                    <span className="flex shrink-0 items-center gap-2">
                      <Input
                        inputSize="sm"
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={String(pct)}
                        onChange={(e) =>
                          setRate(
                            r.id,
                            Math.round(
                              Math.min(100, Math.max(0, Number(e.target.value))) *
                                100,
                            ),
                          )
                        }
                        trailing="%"
                        aria-label={`Commission for ${r.targetName}`}
                        className="w-line-xs text-right"
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => toast.success("Commission rates saved")}
        >
          Save commission rates
        </Button>
      </div>
    </div>
  );
}

/** Admin 26 — Services list. Inventory: all services with pricing preview, search, filter. */
function ServicesTab() {
  const [search, setSearch] = React.useState("");
  const [rows, setRows] = React.useState<ServiceDetail[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<ServiceDetail | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<ServiceDetail | null>(null);

  const load = React.useCallback((q?: string) => {
    setError(null);
    getServices(q).then(setRows).catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load."));
  }, []);

  const toggleActive = (id: string) => {
    const row = rows?.find((s) => s.id === id);
    if (!row) return;
    const next = !row.active;

    setRows((rs) => rs?.map((s) => (s.id === id ? { ...s, active: next } : s)) ?? rs);

    void updateService(id, { active: next })
      .then(() => {
        toast.success(
          next
            ? `${row.name} is bookable`
            : `${row.name} is hidden — existing bookings are unaffected`,
        );
      })
      .catch((err: unknown) => {
        setRows((rs) =>
          rs?.map((s) => (s.id === id ? { ...s, active: row.active } : s)) ?? rs,
        );
        reportFailure(err, "Could not change that service.");
      });
  };

  React.useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const columns: Column<ServiceDetail>[] = [
    {
      id: "name", header: "Service", skeletonWidth: "w-line-lg",
      cell: (s) => (
        <button
          type="button"
          onClick={() => setEditing(s)}
          className="rounded-pill text-left font-medium text-ink hover:text-action"
        >
          {s.name}
        </button>
      ),
    },
    { id: "category", header: "Category", hideBelow: 900, skeletonWidth: "w-line-md", cell: (s) => <span className="text-ink-muted">{s.categoryName}</span> },
    { id: "price", header: "Base price", align: "right", skeletonWidth: "w-line-xs", cell: (s) => <span className="tabular text-ink width-condensed">{formatCurrency(s.basePricePaise)}</span> },
    { id: "bookings", header: "Bookings", align: "right", hideBelow: 1100, skeletonWidth: "w-line-xs", cell: (s) => <span className="tabular text-ink-muted width-condensed">{s.bookingCount}</span> },
    {
      id: "status",
      header: "Status",
      skeletonWidth: "w-line-sm",
      cell: (s) => (
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "text-caption font-medium",
              s.active ? "text-ink" : "text-ink-muted",
            )}
          >
            {s.active ? "Active" : "Hidden"}
          </span>
          <Switch
            checked={s.active}
            onCheckedChange={() => toggleActive(s.id)}
            aria-label={`${s.name} is ${s.active ? "active" : "hidden"}`}
          />
          {/* Hiding is the reversible action and the one an operator almost
              always wants; deleting is beside it but confirms first, because a
              service removed by accident takes its variants, add-ons and
              pricing with it. */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleting(s)}
            aria-label={`Delete ${s.name}`}
          >
            <Trash2 />
          </Button>
        </span>
      ),
    },
    {
      id: "edit",
      header: "",
      align: "right",
      cell: (s) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(s)}
          aria-label={`Edit ${s.name}`}
        >
          <Pencil />
        </Button>
      ),
    },
  ];

  const card: CardLayout<ServiceDetail> = {
    title: (s) => s.name,
    badge: (s) => (
      <Badge tone="neutral" dot={s.active ? true : "hollow"}>
        {s.active ? "Active" : "Hidden"}
      </Badge>
    ),
    lines: [(s) => s.categoryName, (s) => `${s.bookingCount} bookings`],
    trailing: (s) => <span className="tabular">{formatCurrency(s.basePricePaise)}</span>,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-small text-ink-muted">Every service customers can book.</p>
        <Button variant="primary" onClick={() => setEditing("new")}><Plus />Add service</Button>
      </div>

      <div className="rounded-card border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services" icon={<Search />} className="h-8 min-w-search flex-1 text-small" aria-label="Search services" />
        </div>
        {error ? (
          <ErrorState icon={<TriangleAlert />} title="Could not load" action={{ label: "Try again", onClick: () => load(search || undefined) }} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows ?? []}
            rowKey={(s) => s.id}
            card={card}
            loading={!rows}
            empty={<EmptyState icon={<Wrench />} title={search ? "No services match" : "No services yet"} />}
          />
        )}
      </div>

      <ServiceDialog
        open={editing !== null}
        service={editing === "new" ? null : editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        onSaved={(saved) => {
          setRows((rs) => {
            if (!rs) return [saved];
            const exists = rs.some((x) => x.id === saved.id);
            return exists
              ? rs.map((x) => (x.id === saved.id ? saved : x))
              : [...rs, saved];
          });
        }}
      />

      {/* Confirmed, not immediate. Deleting a service takes its variants,
          add-ons and pricing with it, and there is no undo. */}
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name}?</DialogTitle>
            <DialogDescription>
              This removes the service, its variants, add-ons and pricing. It
              cannot be undone. To stop customers booking it while keeping the
              record, switch it to Hidden instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const target = deleting;
                if (!target) return;
                void deleteService(target.id)
                  .then(() => {
                    setRows((rs) => rs?.filter((x) => x.id !== target.id) ?? rs);
                    setDeleting(null);
                    toast.success(`${target.name} deleted`);
                  })
                  .catch((err: unknown) =>
                    reportFailure(err, "Could not delete that service."),
                  );
              }}
            >
              Delete service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Admin 27 — Add / edit service.
 *
 * Inventory: "Name, description, images, variants, inclusions, warranty info."
 *
 * Variants are the part that carries weight. A service is what a customer
 * searches for; a variant is what they actually book — "AC service" is the
 * service, "1.5 ton split" is the thing with a price and a duration. Without
 * them a service is one flat price for jobs that plainly differ.
 *
 * Variant prices are DELTAS against the base price, not absolute figures. A
 * base price change in Admin 28 then moves every variant with it, instead of
 * leaving a set of stale numbers that quietly disagree with the pricing screen.
 */
function ServiceDialog({
  open,
  service,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  service: ServiceDetail | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (service: ServiceDetail) => void;
}) {
  const isEdit = service !== null;

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [inclusions, setInclusions] = React.useState("");
  const [warrantyDays, setWarrantyDays] = React.useState(30);
  const [active, setActive] = React.useState(true);
  const [variants, setVariants] = React.useState<ServiceVariant[]>([]);
  const [saving, setSaving] = React.useState(false);

  /**
   * Which sub-category the service belongs to, and what it costs.
   *
   * **Both fields were missing from this dialog** (BACKEND-PLAN.md §0.8). A
   * service with no sub-category belongs to no category, so it would appear in
   * this admin table and nowhere a customer could reach it — and a service with
   * no price is not bookable. The form could not create a usable service, which
   * is the whole purpose of the form.
   *
   * The base price is here *and* on the Pricing tab on purpose: the full set of
   * rates (platform fee, visit charge, night surcharge, city override) belongs
   * on Admin 28, but making an operator visit a second tab before their new
   * service works at all is a trap rather than a workflow.
   */
  const [subCategoryId, setSubCategoryId] = React.useState<string | null>(null);
  const [basePriceRupees, setBasePriceRupees] = React.useState(0);
  const [subs, setSubs] = React.useState<SubCategory[]>([]);
  const [imagePaths, setImagePaths] = React.useState<string[]>([]);
  const [addOns, setAddOns] = React.useState<ServiceAddOn[]>([]);

  React.useEffect(() => {
    if (!open) return;
    getSubCategories()
      .then(setSubs)
      .catch(() => setSubs([]));
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    setName(service?.name ?? "");
    setDescription(service?.description ?? "");
    setInclusions((service?.inclusions ?? []).join("\n"));
    setWarrantyDays(service?.warrantyDays ?? 30);
    setActive(service?.active ?? true);
    setBasePriceRupees(Math.round((service?.basePricePaise ?? 0) / 100));
    // `imageUrls` comes back as the same relative paths that were stored, so
    // they round-trip without conversion.
    setImagePaths(service?.imageUrls ?? []);
    setAddOns(service?.addOns ?? []);
    setVariants(
      service?.variants ?? [
        {
          id: `v_${Date.now()}`,
          name: "Standard visit",
          priceDeltaPaise: 0,
          durationMinutes: 60,
          isDefault: true,
          active: true,
        },
      ],
    );
  }, [open, service]);

  // On edit the service knows its sub-category by name only, so it is matched
  // once the list arrives rather than guessed from the service itself.
  React.useEffect(() => {
    if (!open || subs.length === 0) return;
    setSubCategoryId(
      service
        ? (subs.find((s) => s.name === service.subCategoryName)?.id ?? null)
        : (subs[0]?.id ?? null),
    );
  }, [open, service, subs]);

  const base = basePriceRupees * 100;

  const addVariant = () =>
    setVariants((vs) => [
      ...vs,
      {
        id: `v_${Date.now()}`,
        name: "",
        priceDeltaPaise: 0,
        durationMinutes: 60,
        // The first one added is the default; later ones are not.
        isDefault: vs.length === 0,
        active: true,
      },
    ]);

  const patchVariant = (id: string, patch: Partial<ServiceVariant>) =>
    setVariants((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const removeVariant = (id: string) =>
    setVariants((vs) => {
      const next = vs.filter((v) => v.id !== id);
      // Removing the default leaves the list without one, so the first
      // survivor takes over rather than the customer seeing nothing selected.
      if (next.length > 0 && !next.some((v) => v.isDefault)) {
        const [first, ...rest] = next;
        return first ? [{ ...first, isDefault: true }, ...rest] : next;
      }
      return next;
    });

  const setDefault = (id: string) =>
    setVariants((vs) => vs.map((v) => ({ ...v, isDefault: v.id === id })));

  const namedVariants = variants.filter((v) => v.name.trim() !== "");
  const canSave =
    name.trim() !== "" &&
    namedVariants.length === variants.length &&
    subCategoryId !== null;

  const handleSave = async () => {
    if (!canSave || !subCategoryId || saving) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        subCategoryId,
        description: description.trim(),
        // One inclusion per line, blank lines dropped. The textarea is the
        // input an operator actually wants; the array is what the API takes.
        inclusions: inclusions
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== ""),
        warrantyDays,
        active,
        variants,
        imagePaths,
        // Dropped if the name was left blank — a nameless add-on would show as
        // a blank row with a price beside it on the customer's booking screen.
        addOns: addOns.filter((a) => a.name.trim() !== ""),
        basePricePaise: base,
      };

      const saved = isEdit
        ? await updateService(service.id, payload)
        : await createService(payload);

      onSaved(saved);
      toast.success(isEdit ? `${saved.name} saved` : `${saved.name} added`);
      onOpenChange(false);
    } catch (err) {
      reportFailure(err, "Could not save that service.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${service.name}` : "Add a service"}
          </DialogTitle>
          <DialogDescription>
            What customers see on the service detail screen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormField label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AC service &amp; repair"
            />
          </FormField>

          {/* Without this the service belongs to no category, so it shows in
              the admin table and nowhere a customer can reach it. */}
          <FormField
            label="Sub-category"
            required
            help={
              subs.length === 0
                ? "Create a category and a sub-category first — a service has to live under one."
                : "Decides where customers find this service when browsing."
            }
          >
            <Combobox
              options={subs.map((s) => ({
                value: s.id,
                label: s.name,
                description: s.categoryName,
              }))}
              value={subCategoryId}
              onChange={setSubCategoryId}
              placeholder="Choose a sub-category"
              searchPlaceholder="Search sub-categories"
              aria-label="Sub-category"
            />
          </FormField>

          {/* Editable here on create *and* edit. It is the service's own
              price and the figure every variant is a delta against, so sending
              an operator to another tab to correct a typo is a trap. The rest
              of the rates — fee, visit charge, surcharge, city override — stay
              on the Pricing tab, where they are tuned together. The server
              applies the same `services.edit_pricing` gate either way. */}
          <FormField
            label="Base price"
            required
            help="In rupees. The platform fee, visit charge and surcharges are set on the Pricing tab."
          >
            <Input
              type="number"
              min={0}
              value={basePriceRupees}
              onChange={(e) =>
                setBasePriceRupees(Math.max(0, Number(e.target.value) || 0))
              }
              aria-label="Base price in rupees"
            />
          </FormField>

          <FormField label="Description" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is included, and why it is worth booking"
              rows={3}
            />
          </FormField>

          <FormField
            label="Images"
            help="First image is used as the cover on the service card. JPG, PNG or WebP, up to 5 MB."
          >
            <ImagePicker paths={imagePaths} onChange={setImagePaths} />
          </FormField>

          {/* Admin 27 — variants. */}
          <FormField
            label="Variants"
            required
            help="What a customer picks when booking. Prices are added to the base price."
          >
            <div className="space-y-2">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className={cn(
                    "rounded-control border p-3",
                    v.isDefault
                      ? "border-action bg-action-subtle"
                      : "border-border",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      inputSize="sm"
                      value={v.name}
                      onChange={(e) =>
                        patchVariant(v.id, { name: e.target.value })
                      }
                      placeholder="e.g. 1.5 ton split"
                      aria-label="Variant name"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(v.id)}
                      disabled={variants.length === 1}
                      aria-label={`Remove ${v.name || "this variant"}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="mb-1 block text-caption text-ink-muted">
                        Price
                      </span>
                      <Input
                        inputSize="sm"
                        type="number"
                        value={String(v.priceDeltaPaise / 100)}
                        onChange={(e) =>
                          patchVariant(v.id, {
                            priceDeltaPaise: Math.round(
                              Number(e.target.value) * 100,
                            ) || 0,
                          })
                        }
                        trailing="₹"
                        aria-label={`Price difference for ${v.name || "variant"}`}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-caption text-ink-muted">
                        Duration
                      </span>
                      <Input
                        inputSize="sm"
                        type="number"
                        min={0}
                        value={String(v.durationMinutes)}
                        onChange={(e) =>
                          patchVariant(v.id, {
                            durationMinutes:
                              Math.max(0, Math.round(Number(e.target.value))) || 0,
                          })
                        }
                        trailing="min"
                        aria-label={`Duration for ${v.name || "variant"}`}
                      />
                    </label>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    {/* The number the customer actually sees for this option. */}
                    <span className="tabular text-caption text-ink-muted">
                      Customer sees{" "}
                      <span className="font-medium text-ink">
                        {formatCurrency(base + v.priceDeltaPaise)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setDefault(v.id)}
                      disabled={v.isDefault}
                      className={cn(
                        "rounded-pill text-caption transition-colors duration-fast",
                        v.isDefault
                          ? "font-medium text-action-press"
                          : "text-ink-muted hover:text-ink",
                      )}
                    >
                      {v.isDefault ? "Pre-selected" : "Make pre-selected"}
                    </button>
                  </div>
                </div>
              ))}

              <Button variant="secondary" size="sm" onClick={addVariant}>
                <Plus />
                Add variant
              </Button>
            </div>
          </FormField>

          {/* Admin 27 — add-ons. Customer 14 prices these at checkout, and
              until now there was no way for an admin to create one: the
              customer side was priced against data nobody could enter
              (CONSUMER-OPEN-ITEMS 7.15). Unlike a variant, an add-on is
              additive, independent, and priced absolutely rather than as a
              delta — so no default, and none is a perfectly normal service. */}
          <FormField
            label="Add-ons"
            help="Optional extras a customer can add to the booking. Priced in full, not as a difference."
          >
            <div className="space-y-2">
              {addOns.map((a) => (
                <div key={a.id} className="rounded-control border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      inputSize="sm"
                      value={a.name}
                      onChange={(e) =>
                        setAddOns((as) =>
                          as.map((x) =>
                            x.id === a.id ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="e.g. Deep clean of outdoor unit"
                      aria-label="Add-on name"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setAddOns((as) => as.filter((x) => x.id !== a.id))
                      }
                      aria-label={`Remove ${a.name || "this add-on"}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <Input
                    inputSize="sm"
                    value={a.description}
                    onChange={(e) =>
                      setAddOns((as) =>
                        as.map((x) =>
                          x.id === a.id
                            ? { ...x, description: e.target.value }
                            : x,
                        ),
                      )
                    }
                    placeholder="One line — what the customer gets"
                    aria-label="Add-on description"
                    className="mt-2"
                  />

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="mb-1 block text-caption text-ink-muted">
                        Price
                      </span>
                      <Input
                        inputSize="sm"
                        type="number"
                        min={0}
                        value={String(a.pricePaise / 100)}
                        onChange={(e) =>
                          setAddOns((as) =>
                            as.map((x) =>
                              x.id === a.id
                                ? {
                                    ...x,
                                    pricePaise:
                                      Math.max(
                                        0,
                                        Math.round(Number(e.target.value) * 100),
                                      ) || 0,
                                  }
                                : x,
                            ),
                          )
                        }
                        trailing="₹"
                        aria-label={`Price for ${a.name || "add-on"}`}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-caption text-ink-muted">
                        Extra time
                      </span>
                      <Input
                        inputSize="sm"
                        type="number"
                        min={0}
                        value={String(a.durationMinutes)}
                        onChange={(e) =>
                          setAddOns((as) =>
                            as.map((x) =>
                              x.id === a.id
                                ? {
                                    ...x,
                                    durationMinutes:
                                      Math.max(
                                        0,
                                        Math.round(Number(e.target.value)),
                                      ) || 0,
                                  }
                                : x,
                            ),
                          )
                        }
                        trailing="min"
                        aria-label={`Extra time for ${a.name || "add-on"}`}
                      />
                    </label>
                  </div>
                </div>
              ))}

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setAddOns((as) => [
                    ...as,
                    {
                      id: `a_${Date.now()}`,
                      name: "",
                      description: "",
                      pricePaise: 0,
                      durationMinutes: 0,
                      active: true,
                    },
                  ])
                }
              >
                <Plus />
                Add an add-on
              </Button>
            </div>
          </FormField>

          <FormField
            label="Inclusions"
            help="One per line — shown as a checklist on the service detail screen."
          >
            <Textarea
              value={inclusions}
              onChange={(e) => setInclusions(e.target.value)}
              placeholder={"Doorstep service\nSpare parts extra as needed\nVerified technician"}
              rows={3}
            />
          </FormField>

          <FormField
            label="Warranty"
            help="How long CFC covers rework at no charge."
          >
            <Input
              type="number"
              min={0}
              value={String(warrantyDays)}
              onChange={(e) =>
                setWarrantyDays(Math.max(0, Math.round(Number(e.target.value))) || 0)
              }
              trailing="days"
              aria-label="Warranty in days"
            />
          </FormField>

          <div className="flex items-center justify-between gap-3 rounded-control border border-border p-3">
            <span className="min-w-0">
              <span className="block text-small font-medium text-ink">
                {active ? "Active" : "Hidden"}
              </span>
              <span className="block text-caption text-ink-muted">
                {active
                  ? "Bookable by customers right now."
                  : "Not shown in the app. Existing bookings are unaffected."}
              </span>
            </span>
            <Switch
              checked={active}
              onCheckedChange={setActive}
              aria-label={`Service is ${active ? "active" : "hidden"}`}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="primary"
            onClick={() => {
              void handleSave();
            }}
            disabled={!canSave}
            loading={saving}
          >
            {isEdit ? "Save service" : "Add service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Admin 28 + 29 — Pricing management and Commission settings, two sections in one tab. */
function PricingAndCommissionTab() {
  return (
    <div className="space-y-6">
      <PricingSection />
      <CommissionSection />
    </div>
  );
}





export default function ServiceAndPricingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-block-lg rounded-card" />}>
      <ServiceAndPricingInner />
    </Suspense>
  );
}
