"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { getRegisterableServices, getServiceAreas, sendProOtp } from "@cfc/mocks";
import {
  Badge,
  Button,
  Checkbox,
  FormField,
  Input,
  Skeleton,
  cn,
  toast,
} from "@cfc/ui";
import {
  OnboardingCard,
  OnboardingShell,
} from "@/components/onboarding-shell";

/**
 * Pro 3 — register.
 *
 * "Name, service type, area, mobile number."
 *
 * ## Services come from the catalogue, never free text
 *
 * A pro typing "AC repair" against a catalogue entry named "AC service &
 * repair" would never be matched to a single job, and nobody would find out
 * until they had waited a week for work. The admin owns the catalogue, so this
 * picks from it.
 *
 * With 50+ services the list needs filtering, and the filter is a plain
 * substring match on the service and its category — a pro looking for "ac"
 * should find "AC service & repair" whether they think of it as electrical or
 * not.
 *
 * ## The number is verified next, so it is collected last
 *
 * The order matters on a phone: name and services are easy and build momentum;
 * the number is the field that leads to an interruption (an SMS, switching
 * apps). Putting it last means everything else is already saved when that
 * happens.
 */

interface Service {
  id: string;
  name: string;
  categoryName: string;
}

export default function ProRegisterPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [chosen, setChosen] = React.useState<string[]>([]);
  const [area, setArea] = React.useState("");
  const [query, setQuery] = React.useState("");

  const [services, setServices] = React.useState<Service[] | null>(null);
  const [areas, setAreas] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void Promise.all([getRegisterableServices(), getServiceAreas()])
      .then(([s, a]) => {
        if (cancelled) return;
        setServices(s);
        setAreas(a);
      })
      .catch(() => {
        if (!cancelled) {
          setServices([]);
          toast.error("Could not load the service list. Check your connection.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const digits = phone.replace(/\D/g, "");
  const nameValid = name.trim().length >= 3;
  const phoneValid = digits.length === 10;
  const valid = nameValid && phoneValid && chosen.length > 0 && area !== "";

  const filtered = React.useMemo(() => {
    if (services === null) return [];
    const q = query.trim().toLowerCase();
    if (q === "") return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q),
    );
  }, [services, query]);

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      // The OTP is sent before the record is created: verifying the number is
      // what makes the registration real, and creating a record for an
      // unverified number would fill the platform with unreachable pros.
      await sendProOtp(`+91${digits}`);
      router.push(
        `/otp?phone=${encodeURIComponent(digits)}&from=register`,
      );
    } catch {
      toast.error("Could not send the code. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      heading="Tell us about yourself"
      subheading="Your name, what you do, and where you work."
      step="register"
      backHref="/onboarding"
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <OnboardingCard>
          <FormField
            label="Your full name"
            htmlFor="name"
            required
            help="As it appears on your Aadhaar — the office checks the two match."
            {...(name !== "" && !nameValid
              ? { error: "Enter your full name." }
              : {})}
          >
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoFocus
              placeholder="Murugan Velayudham"
            />
          </FormField>
        </OnboardingCard>

        {/* Services, from the catalogue. */}
        <OnboardingCard>
          <p className="text-small font-medium text-ink">
            What work do you do?
            <span className="ml-1 text-critical-ink" aria-hidden="true">
              *
            </span>
          </p>
          <p className="mt-px text-caption text-ink-muted">
            Choose everything you are qualified for. The office confirms these
            before you start.
          </p>

          {services === null ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-touch w-full rounded-control" />
              <Skeleton className="h-touch w-full rounded-control" />
              <Skeleton className="h-touch w-full rounded-control" />
            </div>
          ) : (
            <>
              {/* A filter, because the catalogue is 50+ services. */}
              <div className="relative mt-3">
                <Search
                  className="pointer-events-none absolute left-3 top-3 size-4 text-ink-muted"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search services"
                  aria-label="Search services"
                  // `pl-8` clears the icon at left-3. Off the closed scale here
                  // and the padding vanishes, putting the icon over the text.
                  className="pl-8"
                />
              </div>

              {chosen.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {chosen.map((id) => {
                    const service = services.find((s) => s.id === id);
                    if (service === undefined) return null;
                    return (
                      <li key={id}>
                        <Badge tone="neutral">{service.name}</Badge>
                      </li>
                    );
                  })}
                </ul>
              )}

              <ul className="mt-3 max-h-block-sm space-y-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <li className="p-3 text-small text-ink-muted">
                    Nothing matches “{query}”. Try a shorter word, or contact
                    the office if your trade is not listed.
                  </li>
                ) : (
                  filtered.map((service) => {
                    const checked = chosen.includes(service.id);
                    return (
                      <li key={service.id}>
                        <label
                          className={cn(
                            "flex min-h-touch cursor-pointer items-center gap-3 rounded-control px-3",
                            "transition-colors duration-fast hover:bg-canvas",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) =>
                              setChosen((current) =>
                                next === true
                                  ? [...current, service.id]
                                  : current.filter((c) => c !== service.id),
                              )
                            }
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-small text-ink">
                              {service.name}
                            </span>
                            <span className="block truncate text-caption text-ink-muted">
                              {service.categoryName}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })
                )}
              </ul>

              {chosen.length === 0 && (
                <p className="mt-2 text-caption text-ink-muted">
                  Choose at least one.
                </p>
              )}
            </>
          )}
        </OnboardingCard>

        {/* Area. */}
        <OnboardingCard>
          <p className="text-small font-medium text-ink">
            Where are you based?
            <span className="ml-1 text-critical-ink" aria-hidden="true">
              *
            </span>
          </p>
          <p className="mt-px text-caption text-ink-muted">
            You are alerted about jobs near you first. You can add more areas
            later.
          </p>

          <ul className="mt-3 flex flex-wrap gap-2">
            {areas.map((a) => (
              <li key={a}>
                <button
                  type="button"
                  onClick={() => setArea(a)}
                  aria-pressed={area === a}
                  className={cn(
                    "flex h-touch items-center rounded-pill px-4",
                    "text-small font-medium transition-colors duration-fast",
                    area === a
                      ? "bg-action text-on-action"
                      : "border border-border bg-surface text-ink-muted hover:text-ink",
                  )}
                >
                  {a}
                </button>
              </li>
            ))}
          </ul>
        </OnboardingCard>

        {/* The number, last. */}
        <OnboardingCard>
          <FormField
            label="Mobile number"
            htmlFor="phone"
            required
            help="We send a code to this number to confirm it. It becomes how you sign in."
            {...(phone !== "" && !phoneValid
              ? { error: "Enter your 10-digit mobile number." }
              : {})}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-touch shrink-0 items-center rounded-control border border-border bg-canvas px-3 tabular text-body text-ink-muted">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="90000 12345"
                className="min-w-0 flex-1 tabular"
              />
            </div>
          </FormField>
        </OnboardingCard>

        <Button
          type="submit"
          size="pro"
          className="w-full"
          disabled={!valid || busy}
        >
          {busy ? "Sending code…" : "Continue"}
          {!busy && <ArrowRight />}
        </Button>

        {/* Why the button is unavailable. A disabled control with no reason is
            the most frustrating thing in any form. */}
        {!valid && (
          <p className="text-center text-caption text-on-structure-muted">
            {!nameValid
              ? "Enter your full name to continue."
              : chosen.length === 0
                ? "Choose at least one service."
                : area === ""
                  ? "Choose where you are based."
                  : "Enter your mobile number."}
          </p>
        )}
      </form>
    </OnboardingShell>
  );
}
