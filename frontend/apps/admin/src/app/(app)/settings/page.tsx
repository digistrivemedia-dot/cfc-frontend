"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Plus, Save, ShieldCheck, Trash2, TriangleAlert, UserCog } from "lucide-react";
import { AREA_OPTIONS, getSubAdmins } from "@cfc/mocks";
import { ADMIN_SECTIONS, can, type AdminSection, type SubAdmin } from "@cfc/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Checkbox,
  Combobox,
  DetailCard,
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
  FormField,
  InlineAlert,
  Input,
  PageHeader,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  cn,
  initials,
  toast,
} from "@cfc/ui";
import { useActor } from "@/lib/actor";

/**
 * Admin 47–49 — Settings.
 *
 * Nav restructure (approved plan): one sidebar item, three tabs, matching the
 * doc's own grouping exactly — kept together rather than split out to an
 * account menu, per the client's confirmed choice.
 *
 *  - Platform (47)   — app configs, feature flags, auto-assign, geofencing.
 *  - My Profile (48) — password change, 2FA.
 *  - Sub Admins (49) — add/remove sub admins, permissions, area assignment.
 */

const TAB_PARAM = "tab";
type SettingsTab = "platform" | "profile" | "sub-admins";

function SettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actor = useActor();

  // Every admin has an account to manage; only a Super Admin configures the
  // platform or creates other admins. A tab that is not permitted is not
  // rendered at all, so there is nothing to click and be refused.
  const canPlatform = can(actor, "settings.edit_platform");
  const canAdmins = can(actor, "settings.manage_admins");

  const requested = (searchParams.get(TAB_PARAM) as SettingsTab | null) ?? null;
  const permitted: SettingsTab[] = [
    ...(canPlatform ? (["platform"] as const) : []),
    "profile",
    ...(canAdmins ? (["sub-admins"] as const) : []),
  ];
  // Falling back to the first permitted tab keeps a stale bookmark working
  // instead of showing an empty panel.
  const tab: SettingsTab =
    requested && permitted.includes(requested)
      ? requested
      : (permitted[0] ?? "profile");

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, next);
    router.push(`/settings?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Platform configuration, your own account, and the admins you delegate to."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {canPlatform && <TabsTrigger value="platform">Platform</TabsTrigger>}
          <TabsTrigger value="profile">My profile</TabsTrigger>
          {canAdmins && <TabsTrigger value="sub-admins">Sub admins</TabsTrigger>}
        </TabsList>

        {canPlatform && (
          <TabsContent value="platform">
            <PlatformTab />
          </TabsContent>
        )}
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        {canAdmins && (
          <TabsContent value="sub-admins">
            <SubAdminsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

/**
 * Admin 47 — Platform settings.
 *
 * Inventory: "App configs, maintenance mode, feature flags, auto-assign
 * radius, geofencing."
 *
 * Maintenance mode is pulled out of the feature-flag list and given its own
 * section. It is the one switch here that takes the customer and pro apps
 * offline for everybody, so it should not sit in a row of three identical
 * toggles where it can be flipped by accident.
 */

/**
 * The five languages named in the agreement for customer screens (clause 4.6).
 *
 * Translation itself is another team's scope; this only sets which one a
 * customer app opens in before they choose for themselves.
 */
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ta", label: "Tamil" },
  { value: "kn", label: "Kannada" },
  { value: "hi", label: "Hindi" },
  { value: "te", label: "Telugu" },
];

/** Flags that turn optional behaviour on. Maintenance mode is not one of these. */
const FEATURE_FLAGS = [
  ["Voice search", "Android native speech recognition on the customer app."],
  ["AI chat assistant", "In-app assistant for service discovery."],
  ["Instant booking", "Lets customers book without waiting for a quotation."],
] as const;

/**
 * The documented radius options.
 *
 * The platform spec fixes these at 2, 5 and 10 km. A free number field invited
 * a 7 that the assignment engine has no meaning for, so the choice is discrete.
 */
const RADIUS_OPTIONS = [
  { value: "2", label: "2 km", hint: "Dense areas — fastest arrival" },
  { value: "5", label: "5 km", hint: "Default. Balances reach and travel time" },
  { value: "10", label: "10 km", hint: "Thin coverage — wider net, longer travel" },
];

function PlatformTab() {
  // The original screen had editable fields and switches but no way to commit
  // them — nothing on the page saved. Settings that can't be saved aren't
  // settings, so the section tracks its own dirty state and commits explicitly.
  const [radius, setRadius] = React.useState("5");
  const [acceptWindow, setAcceptWindow] = React.useState("30");
  const [prosNotified, setProsNotified] = React.useState("3");
  const [ratingPriority, setRatingPriority] = React.useState(true);
  // App configs — the values the customer and pro apps read at launch.
  const [supportPhone, setSupportPhone] = React.useState("+91 90000 12345");
  const [supportEmail, setSupportEmail] = React.useState("help@cityfamilycare.in");
  const [supportHours, setSupportHours] = React.useState("9:00 AM - 9:00 PM");
  const [defaultLanguage, setDefaultLanguage] = React.useState("en");
  const [minVersion, setMinVersion] = React.useState("2.4.0");
  const [forceUpdate, setForceUpdate] = React.useState(false);
  const [gpsRadius, setGpsRadius] = React.useState("100");
  const [maintenance, setMaintenance] = React.useState(false);
  const [maintenanceNote, setMaintenanceNote] = React.useState(
    "We are carrying out scheduled maintenance and will be back shortly.",
  );
  const [confirmMaintenance, setConfirmMaintenance] = React.useState(false);
  const [flags, setFlags] = React.useState<Record<string, boolean>>(
    Object.fromEntries(FEATURE_FLAGS.map(([label]) => [label, true])),
  );
  const [dirty, setDirty] = React.useState(false);

  const markDirty = () => setDirty(true);

  const handleSave = () => {
    if (!dirty) return;
    toast.success("Platform settings saved");
    setDirty(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-small text-ink-muted">
        Global configuration for the platform.
      </p>

      {/* Maintenance mode — its own section, above everything, because when it
          is on nothing else on this page matters. */}
      <section
        className={cn(
          "rounded-card border bg-surface p-4",
          maintenance ? "border-critical-line" : "border-border",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-heading font-semibold text-ink">Maintenance mode</h2>
            <p className="text-caption text-ink-muted">
              Takes the customer and pro apps offline for everyone. Bookings in
              progress are not cancelled.
            </p>
          </div>
          <Switch
            checked={maintenance}
            onCheckedChange={(checked) => {
              // Turning it ON asks first; turning it OFF is a relief and never
              // needs a confirmation.
              if (checked) {
                setConfirmMaintenance(true);
                return;
              }
              setMaintenance(false);
              markDirty();
            }}
            aria-label="Maintenance mode"
          />
        </div>

        {maintenance && (
          <div className="mt-3 space-y-3">
            <InlineAlert tone="critical" title="The apps are offline right now">
              Customers cannot book and pros cannot accept jobs until this is
              switched off.
            </InlineAlert>
            <FormField
              label="Message shown in the apps"
              help="Keep it short and say when you expect to be back."
            >
              <Textarea
                value={maintenanceNote}
                onChange={(e) => {
                  setMaintenanceNote(e.target.value);
                  markDirty();
                }}
                rows={2}
              />
            </FormField>
          </div>
        )}
      </section>

      {/* App configs — what the customer and pro apps read when they launch.
          These are not platform behaviour like auto-assign; they are the
          values the apps display and dial. */}
      <section className="space-y-4 rounded-card border border-border bg-surface p-4">
        <div>
          <h2 className="text-heading font-semibold text-ink">App configuration</h2>
          <p className="text-caption text-ink-muted">
            What the customer and pro apps show and use at launch.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Support phone" help="Shown on the help screen and in every booking.">
            <Input
              type="tel"
              value={supportPhone}
              onChange={(e) => {
                setSupportPhone(e.target.value);
                markDirty();
              }}
              aria-label="Support phone number"
            />
          </FormField>

          <FormField label="Support email">
            <Input
              type="email"
              value={supportEmail}
              onChange={(e) => {
                setSupportEmail(e.target.value);
                markDirty();
              }}
              aria-label="Support email address"
            />
          </FormField>

          <FormField label="Support hours" help="When a call will be answered.">
            <Input
              value={supportHours}
              onChange={(e) => {
                setSupportHours(e.target.value);
                markDirty();
              }}
              aria-label="Support hours"
            />
          </FormField>

          {/* The five languages the agreement names for customer screens. The
              admin panel is deliberately not in that clause. */}
          <FormField
            label="Default language"
            help="Customer app. A user can still switch."
          >
            <Select
              value={defaultLanguage}
              onValueChange={(v) => {
                setDefaultLanguage(v);
                markDirty();
              }}
            >
              <SelectTrigger className="w-full" aria-label="Default language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Minimum app version"
            help="Older builds are asked to update."
          >
            <Input
              value={minVersion}
              onChange={(e) => {
                setMinVersion(e.target.value);
                markDirty();
              }}
              className="tabular"
              aria-label="Minimum supported app version"
            />
          </FormField>

          <FormField label="Currency" help="Fixed. Every price is in rupees.">
            <Input value="INR (₹)" disabled aria-label="Currency" />
          </FormField>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-border p-3">
          <span className="min-w-0">
            <span className="block text-small font-medium text-ink">
              Force update
            </span>
            <span className="block text-caption text-ink-muted">
              {forceUpdate
                ? `Anyone below ${minVersion} cannot use the app until they update.`
                : `Anyone below ${minVersion} sees a dismissible prompt.`}
            </span>
          </span>
          <Switch
            checked={forceUpdate}
            onCheckedChange={(checked) => {
              setForceUpdate(checked);
              markDirty();
            }}
            aria-label="Force update"
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-4 rounded-card border border-border bg-surface p-4">
          <div>
            <h2 className="text-heading font-semibold text-ink">Auto-assign</h2>
            <p className="text-caption text-ink-muted">
              How a new booking finds a pro.
            </p>
          </div>

          <FormField
            label="Assignment radius"
            help="How far from the job a pro can be and still be offered it."
          >
            <RadioGroup
              value={radius}
              onValueChange={(v) => {
                setRadius(v);
                markDirty();
              }}
              className="space-y-2"
            >
              {RADIUS_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="flex items-start gap-2 rounded-control border border-border p-3 text-body text-ink has-[:checked]:border-action has-[:checked]:bg-action-subtle"
                >
                  <RadioGroupItem value={o.value} className="mt-1" />
                  <span className="min-w-0">
                    <span className="block font-medium">{o.label}</span>
                    <span className="block text-caption text-ink-muted">
                      {o.hint}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Acceptance window"
              help="Before the job passes on."
            >
              <Input
                type="number"
                min={10}
                max={120}
                value={acceptWindow}
                onChange={(e) => {
                  setAcceptWindow(e.target.value);
                  markDirty();
                }}
                trailing="sec"
                aria-label="Acceptance window in seconds"
              />
            </FormField>

            <FormField
              label="Pros notified"
              help="Simultaneously. First to accept wins."
            >
              <Input
                type="number"
                min={1}
                max={10}
                value={prosNotified}
                onChange={(e) => {
                  setProsNotified(e.target.value);
                  markDirty();
                }}
                trailing="nearest"
                aria-label="Number of pros notified per job"
              />
            </FormField>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-control border border-border p-3">
            <span className="min-w-0">
              <span className="block text-small font-medium text-ink">
                Rating priority
              </span>
              <span className="block text-caption text-ink-muted">
                At equal distance, notify the higher-rated pro first.
              </span>
            </span>
            <Switch
              checked={ratingPriority}
              onCheckedChange={(checked) => {
                setRatingPriority(checked);
                markDirty();
              }}
              aria-label="Rating priority"
            />
          </div>
        </section>

        <div className="space-y-4">
          <section className="space-y-3 rounded-card border border-border bg-surface p-4">
            <div>
              <h2 className="text-heading font-semibold text-ink">Geofencing</h2>
              <p className="text-caption text-ink-muted">
                Where the platform operates, and how close a pro must be to
                close a job.
              </p>
            </div>

            <FormField
              label="GPS proof radius (metres)"
              help="A pro must be within this distance of the customer to mark a job complete."
            >
              <Input
                type="number"
                min={50}
                max={500}
                step={10}
                value={gpsRadius}
                onChange={(e) => {
                  setGpsRadius(e.target.value);
                  markDirty();
                }}
                trailing="m"
                aria-label="GPS proof radius in metres"
              />
            </FormField>

            {/* "Geofencing" is not only a radius: it is also which areas the
                platform will accept a booking from at all. */}
            <div>
              <p className="text-caption font-medium text-ink">Service areas</p>
              <p className="text-caption text-ink-muted">
                Bookings outside these areas are refused at checkout.
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {AREA_OPTIONS.map((area) => (
                  <Badge key={area} tone="neutral" dot>
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-card border border-border bg-surface p-4">
            <div>
              <h2 className="text-heading font-semibold text-ink">Feature flags</h2>
              <p className="text-caption text-ink-muted">
                Optional behaviour, switched on per platform.
              </p>
            </div>
            {FEATURE_FLAGS.map(([label, description]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 rounded-control border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="text-small font-medium text-ink">{label}</p>
                  <p className="text-caption text-ink-muted">{description}</p>
                </div>
                <Switch
                  checked={flags[label] ?? false}
                  onCheckedChange={(checked) => {
                    setFlags((f) => ({ ...f, [label]: checked }));
                    markDirty();
                  }}
                  aria-label={label}
                />
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Sticky, because the settings above it are taller than one screen and a
          save button below the fold is a save button nobody presses. */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-surface py-3">
        {dirty && (
          <p className="text-caption text-ink-muted">Unsaved changes</p>
        )}
        <Button variant="primary" onClick={handleSave} disabled={!dirty}>
          <Save />
          Save settings
        </Button>
      </div>

      <AlertDialog open={confirmMaintenance} onOpenChange={setConfirmMaintenance}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take the apps offline?</AlertDialogTitle>
            <AlertDialogDescription>
              Customers will not be able to book and pros will not be able to
              accept jobs until you switch maintenance mode off again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="critical"
              onClick={() => {
                setMaintenance(true);
                markDirty();
              }}
            >
              Take apps offline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const ROLE_LABEL_ALL: Record<string, string> = {
  super_admin: "Super admin",
  sub_admin: "Sub admin",
  area_admin: "Area admin",
  customer: "Customer",
  pro: "Pro",
  associate_partner: "Associate partner",
  major_partner: "Major partner",
};

/**
 * Admin 48 — Admin profile.
 *
 * Inventory: "Admin name, role, password change, 2FA setup."
 *
 * "Setup" is the word that matters in the last clause: a bare switch claims
 * two-factor is on without ever showing a secret, a QR code, or asking for a
 * code back. That is a security control that does not exist. Turning it on
 * here walks the actual enrolment.
 */
function ProfileTab() {
  const actor = useActor();

  const [name, setName] = React.useState(actor.name);
  const [email, setEmail] = React.useState("admin@cityfamilycare.in");
  const [phone, setPhone] = React.useState("+91 98765 43210");
  const profileDirty =
    name.trim() !== actor.name ||
    email !== "admin@cityfamilycare.in" ||
    phone !== "+91 98765 43210";

  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const mismatch = confirm !== "" && next !== confirm;
  const canUpdate = current !== "" && next.length >= 8 && next === confirm;

  const [twoFactor, setTwoFactor] = React.useState(true);
  const [setupOpen, setSetupOpen] = React.useState(false);

  const handleSaveProfile = () => {
    if (!profileDirty || name.trim() === "") return;
    toast.success("Profile updated");
  };

  const handleUpdatePassword = () => {
    if (!canUpdate) return;
    toast.success("Password updated");
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  return (
    <div className="space-y-4">
      <p className="text-small text-ink-muted">
        Your account details and security settings.
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {/* Spec: "admin name". It was read-only text before, so the clause
              was displayed rather than met. */}
          <DetailCard title="Your details">
            <div className="space-y-3">
              <FormField label="Name" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FormField>
                <FormField label="Phone">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </FormField>
              </div>
              <FormField
                label="Role"
                help="Only a Super Admin can change a role, from Sub admin management."
              >
                <Input value={ROLE_LABEL_ALL[actor.role] ?? actor.role} disabled />
              </FormField>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                disabled={!profileDirty || name.trim() === ""}
              >
                <Save />
                Save details
              </Button>
            </div>
          </DetailCard>

          <DetailCard title="Change password">
            <div className="space-y-3">
              <FormField label="Current password" required>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </FormField>
              <FormField label="New password" required help="At least 8 characters.">
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                />
              </FormField>
              <FormField
                label="Confirm new password"
                required
                {...(mismatch ? { error: "Passwords don't match." } : {})}
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </FormField>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={handleUpdatePassword} disabled={!canUpdate}>
                <KeyRound />
                Update password
              </Button>
            </div>
          </DetailCard>

          <DetailCard title="Two-factor authentication">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-body text-ink">Require a code at sign-in</p>
                <p className="text-caption text-ink-muted">
                  {twoFactor
                    ? "An authenticator app is enrolled on this account."
                    : "Your password alone is enough to sign in right now."}
                </p>
              </div>
              <Switch
                checked={twoFactor}
                onCheckedChange={(checked) => {
                  // Enrolling needs a setup flow; removing it does not.
                  if (checked) {
                    setSetupOpen(true);
                    return;
                  }
                  setTwoFactor(false);
                  toast.success("Two-factor authentication turned off");
                }}
                aria-label="Two-factor authentication"
              />
            </div>

            {twoFactor && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                <Button variant="secondary" size="sm" onClick={() => setSetupOpen(true)}>
                  Reconfigure
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast.success("New recovery codes generated")}
                >
                  Regenerate recovery codes
                </Button>
              </div>
            )}
          </DetailCard>
        </div>

        <DetailCard title="Account">
          <div className="flex items-center gap-3 pb-3">
            <Avatar className="size-12">
              <AvatarFallback>{initials(name || actor.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{name || actor.name}</p>
              <p className="text-small text-ink-muted">
                {ROLE_LABEL_ALL[actor.role] ?? actor.role}
              </p>
            </div>
          </div>
          {/* Reads the live switch. It was hardcoded "Enabled" before, so it
              could contradict the control directly above it. */}
          <DetailRow
            label="Two-factor"
            value={
              twoFactor ? (
                <span className="inline-flex items-center gap-1 text-live-ink">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  On
                </span>
              ) : (
                <span className="text-ink-muted">Off</span>
              )
            }
          />
          <DetailRow label="Email" value={<span className="truncate">{email}</span>} />
          <DetailRow label="Phone" value={<span className="tabular">{phone}</span>} />
        </DetailCard>
      </div>

      <TwoFactorSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onEnrolled={() => {
          setTwoFactor(true);
          setSetupOpen(false);
          toast.success("Two-factor authentication is on");
        }}
      />
    </div>
  );
}

/**
 * The 2FA enrolment the spec asks for.
 *
 * Three steps, because that is what enrolling actually takes: show the secret,
 * let it be scanned or typed, then prove it worked by asking for a code back.
 * Skipping the last step is how people lock themselves out.
 */
function TwoFactorSetupDialog({
  open,
  onOpenChange,
  onEnrolled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrolled: () => void;
}) {
  const [code, setCode] = React.useState("");

  React.useEffect(() => {
    if (open) setCode("");
  }, [open]);

  const valid = /^\d{6}$/.test(code);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set up two-factor authentication</DialogTitle>
          <DialogDescription>
            Scan this with Google Authenticator, Authy, or any TOTP app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-canvas p-4">
            {/* A placeholder for the real QR the backend will issue. Drawn
                rather than imported so it needs no asset and no network. */}
            <div
              className="grid size-emblem grid-cols-5 gap-px rounded-control bg-structure p-2"
              role="img"
              aria-label="Enrolment QR code placeholder"
            >
              {Array.from({ length: 25 }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded-pill",
                    // A fixed pattern, so it does not flicker on re-render.
                    [0, 1, 3, 4, 5, 9, 10, 12, 14, 15, 19, 20, 21, 23, 24].includes(i)
                      ? "bg-on-action"
                      : "bg-structure",
                  )}
                />
              ))}
            </div>
            <div className="text-center">
              <p className="text-caption text-ink-muted">Or enter this key</p>
              <p className="tabular text-small font-medium text-ink">
                CFC4 X7QB 2M9K PL3T
              </p>
            </div>
          </div>

          <FormField
            label="Enter the 6-digit code"
            required
            help="Confirms the app is set up correctly before we turn this on."
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              className="tabular"
              aria-label="Six digit verification code"
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="primary" onClick={onEnrolled} disabled={!valid}>
            Verify and turn on
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const ROLE_LABEL: Record<SubAdmin["role"], string> = {
  sub_admin: "Sub admin",
  area_admin: "Area admin",
};

/** What each section is called in the sidebar, so a permission names something real. */
const SECTION_LABEL: Record<AdminSection, string> = {
  bookings: "Bookings & jobs",
  quotations: "Quotations",
  pros: "Pro management",
  customers: "Customers",
  services: "Service & pricing",
  payments: "Payments & finance",
  promotions: "Promotions",
  reports: "Reports",
  support: "Support",
  settings: "Settings",
};

/**
 * What each role may be granted at all, from the agreement.
 *
 * Sub Admin: "bookings, support tickets, quotation queue, vendor approvals, as
 * delegated." Area Admin: "local pro management and job oversight only", with
 * no external or third-party access.
 *
 * Anything outside these lists cannot be delegated by a Super Admin either —
 * the checkbox is shown disabled rather than hidden, so it reads as a rule and
 * not as a missing feature.
 */
const GRANTABLE: Record<SubAdmin["role"], AdminSection[]> = {
  sub_admin: ["bookings", "quotations", "pros", "support"],
  area_admin: ["bookings", "quotations", "pros"],
};

/**
 * Admin 49 — Sub admin management.
 *
 * Inventory: "Add/remove sub admins, assign permissions, area assignment for
 * Area Admins."
 *
 * All three clauses were incomplete: there was no remove, "assign permissions"
 * opened a dialog of descriptive text with a Save button that saved nothing,
 * and the area was a free-text box where a typo produced a scope matching no
 * real area.
 */
function SubAdminsTab() {
  const [rows, setRows] = React.useState<SubAdmin[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getSubAdmins()
      .then(setRows)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load."));
  }, []);

  React.useEffect(() => load(), [load]);

  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SubAdmin | null>(null);
  const [removing, setRemoving] = React.useState<SubAdmin | null>(null);

  // No real backend to persist against — the list is updated locally, the
  // visible effect a real invite would have.
  const handleAdd = (draft: {
    name: string;
    role: SubAdmin["role"];
    area: string;
    sections: AdminSection[];
  }) => {
    setRows((rs) => [
      ...(rs ?? []),
      {
        id: `adm_${Date.now()}`,
        name: draft.name,
        role: draft.role,
        ...(draft.role === "area_admin" && draft.area ? { area: draft.area } : {}),
        sections: draft.sections,
        active: true,
      },
    ]);
    toast.success(`${draft.name} added as ${ROLE_LABEL[draft.role].toLowerCase()}`);
    setAddOpen(false);
  };

  const handleSavePermissions = (id: string, sections: AdminSection[], area: string) => {
    setRows((rs) =>
      rs
        ? rs.map((a) =>
            a.id === id
              ? { ...a, sections, ...(a.role === "area_admin" ? { area } : {}) }
              : a,
          )
        : rs,
    );
    setEditing(null);
    toast.success("Permissions saved");
  };

  const handleRemove = (admin: SubAdmin) => {
    setRows((rs) => (rs ? rs.filter((a) => a.id !== admin.id) : rs));
    setRemoving(null);
    toast.success(`${admin.name} removed`);
  };

  const handleToggleActive = (admin: SubAdmin) => {
    setRows((rs) =>
      rs ? rs.map((a) => (a.id === admin.id ? { ...a, active: !a.active } : a)) : rs,
    );
    toast.success(
      admin.active ? `${admin.name} suspended` : `${admin.name} restored`,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-small text-ink-muted">
          Sub admins and area admins, and the scope each one has.
        </p>
        <AddSubAdminDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
      </div>

      {/* The agreement fixes the Super Admin at one. Saying so here stops
          someone looking for a way to add a second and assuming it is a bug. */}
      <InlineAlert tone="info" title="There is one Super Admin">
        Full platform control — pricing, commission, payouts and configuration —
        stays with that account. Everyone added here is a sub admin or an area
        admin working within the scope you give them.
      </InlineAlert>

      {error ? (
        <ErrorState
          icon={<TriangleAlert />}
          title="Could not load"
          action={{ label: "Try again", onClick: load }}
        />
      ) : !rows ? (
        <div className="space-y-1">
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-block-xs rounded-card" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-border bg-surface">
          <EmptyState
            icon={<UserCog />}
            title="No sub admins yet"
            description="Add a sub admin or area admin to delegate day-to-day operations."
            action={{ label: "Add sub admin", onClick: () => setAddOpen(true) }}
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => (
            <li
              key={a.id}
              className="rounded-card border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start gap-3">
                <Avatar className="size-tile">
                  <AvatarFallback>{initials(a.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{a.name}</p>
                    <Badge tone="neutral" dot={a.active}>
                      {ROLE_LABEL[a.role]}
                    </Badge>
                    {!a.active && <Badge tone="critical">Suspended</Badge>}
                  </div>
                  <p className="text-small text-ink-muted">
                    {a.role === "area_admin" ? (a.area ?? "No area set") : "All areas"}
                    {" · "}
                    {a.sections.length} of {ADMIN_SECTIONS.length} sections
                  </p>

                  {/* The permissions, visible without opening a dialog: the
                      point of this screen is seeing who can reach what. */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.sections.map((sec) => (
                      <Badge key={sec} tone="neutral">
                        {SECTION_LABEL[sec]}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditing(a)}>
                    Edit permissions
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(a)}
                  >
                    {a.active ? "Suspend" : "Restore"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemoving(a)}
                    aria-label={`Remove ${a.name}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PermissionsDialog
        admin={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={handleSavePermissions}
      />

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They lose access to the admin panel immediately. To keep the
              record and only pause access, suspend them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="critical"
              onClick={() => {
                if (removing) handleRemove(removing);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** The sections a new admin of each role starts with. */
const DEFAULT_SECTIONS: Record<SubAdmin["role"], AdminSection[]> = {
  sub_admin: [...GRANTABLE.sub_admin],
  area_admin: [...GRANTABLE.area_admin],
};

function AddSubAdminDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (draft: {
    name: string;
    role: SubAdmin["role"];
    area: string;
    sections: AdminSection[];
  }) => void;
}) {
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<SubAdmin["role"]>("sub_admin");
  const [area, setArea] = React.useState<string | null>(null);
  const [sections, setSections] = React.useState<AdminSection[]>(
    DEFAULT_SECTIONS.sub_admin,
  );

  React.useEffect(() => {
    if (open) {
      setName("");
      setRole("sub_admin");
      setArea(null);
      setSections(DEFAULT_SECTIONS.sub_admin);
    }
  }, [open]);

  const changeRole = (next: SubAdmin["role"]) => {
    setRole(next);
    // Switching to a narrower role drops anything that role cannot hold.
    setSections((current) => current.filter((s) => GRANTABLE[next].includes(s)));
  };

  const canAdd =
    name.trim() !== "" &&
    sections.length > 0 &&
    (role !== "area_admin" || area !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus />
          Add sub admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add sub admin</DialogTitle>
          <DialogDescription>
            Delegates day-to-day operations within their assigned scope.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormField label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vignesh T."
            />
          </FormField>

          <FormField label="Role" required>
            <RadioGroup
              value={role}
              onValueChange={(v) => changeRole(v as SubAdmin["role"])}
              className="space-y-2"
            >
              <label className="flex items-start gap-2 rounded-control border border-border p-3 text-body text-ink has-[:checked]:border-action has-[:checked]:bg-action-subtle">
                <RadioGroupItem value="sub_admin" className="mt-1" />
                <span className="min-w-0">
                  <span className="block font-medium">Sub admin</span>
                  <span className="block text-caption text-ink-muted">
                    Works across every area.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 rounded-control border border-border p-3 text-body text-ink has-[:checked]:border-action has-[:checked]:bg-action-subtle">
                <RadioGroupItem value="area_admin" className="mt-1" />
                <span className="min-w-0">
                  <span className="block font-medium">Area admin</span>
                  <span className="block text-caption text-ink-muted">
                    Sees only bookings, pros and customers in one area.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </FormField>

          {/* Spec: "area assignment for Area Admins". A picker, not free text —
              a typed area that matches nothing is a scope that sees nothing. */}
          {role === "area_admin" && (
            <FormField label="Area" required>
              <Combobox
                options={AREA_OPTIONS.map((a) => ({ value: a, label: a }))}
                value={area}
                onChange={setArea}
                placeholder="Choose an area"
                aria-label="Area"
              />
            </FormField>
          )}

          <SectionPicker role={role} value={sections} onChange={setSections} />
        </div>

        <DialogFooter>
          <Button
            variant="primary"
            onClick={() =>
              onAdd({ name: name.trim(), role, area: area ?? "", sections })
            }
            disabled={!canAdd}
          >
            Add sub admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Editing an existing admin's permissions and, for area admins, their area. */
function PermissionsDialog({
  admin,
  onOpenChange,
  onSave,
}: {
  admin: SubAdmin | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, sections: AdminSection[], area: string) => void;
}) {
  const [sections, setSections] = React.useState<AdminSection[]>([]);
  const [area, setArea] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (admin) {
      setSections(admin.sections);
      setArea(admin.area ?? null);
    }
  }, [admin]);

  const valid =
    sections.length > 0 && (admin?.role !== "area_admin" || area !== null);

  return (
    <Dialog open={admin !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{admin ? `${admin.name}'s access` : "Access"}</DialogTitle>
          <DialogDescription>
            Which sections they can open, and the area they are scoped to.
          </DialogDescription>
        </DialogHeader>

        {admin && (
          <div className="space-y-3">
            {admin.role === "area_admin" && (
              <FormField label="Area" required>
                <Combobox
                  options={AREA_OPTIONS.map((a) => ({ value: a, label: a }))}
                  value={area}
                  onChange={setArea}
                  placeholder="Choose an area"
                  aria-label="Area"
                />
              </FormField>
            )}
            <SectionPicker role={admin.role} value={sections} onChange={setSections} />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => {
              if (admin) onSave(admin.id, sections, area ?? "");
            }}
          >
            Save permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The permission checkboxes.
 *
 * Sections an area admin cannot hold are shown disabled rather than hidden, so
 * it is clear the restriction is deliberate and not a missing feature.
 */
function SectionPicker({
  role,
  value,
  onChange,
}: {
  role: SubAdmin["role"];
  value: AdminSection[];
  onChange: (next: AdminSection[]) => void;
}) {
  const toggle = (section: AdminSection, on: boolean) =>
    onChange(
      on ? [...value, section] : value.filter((s) => s !== section),
    );

  return (
    <FormField
      label="Sections"
      required
      help={
        role === "area_admin"
          ? "Area admins are limited to local pro management and job oversight."
          : "Sub admins cover bookings, quotations, vendor approvals and support."
      }
    >
      <div className="grid gap-1 sm:grid-cols-2">
        {ADMIN_SECTIONS.map((section) => {
          const blocked = !GRANTABLE[role].includes(section);
          const checked = value.includes(section) && !blocked;
          return (
            <label
              key={section}
              className={cn(
                "flex items-center gap-2 rounded-control p-2 text-body",
                blocked ? "text-ink-faint" : "text-ink hover:bg-canvas",
              )}
            >
              <Checkbox
                checked={checked}
                disabled={blocked}
                onCheckedChange={(c) => toggle(section, c === true)}
                aria-label={SECTION_LABEL[section]}
              />
              {SECTION_LABEL[section]}
            </label>
          );
        })}
      </div>
    </FormField>
  );
}


export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-block-lg rounded-card" />}>
      <SettingsInner />
    </Suspense>
  );
}
