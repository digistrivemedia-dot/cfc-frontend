"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, Info } from "lucide-react";
import { getServiceAreas, saveProfileSetup } from "@cfc/mocks";
import {
  Button,
  Checkbox,
  FormField,
  Input,
  PhotoCapture,
  Textarea,
  cn,
  toast,
  type CapturedPhoto,
} from "@cfc/ui";
import {
  OnboardingCard,
  OnboardingShell,
} from "@/components/onboarding-shell";

/**
 * Pro 5 — profile setup.
 *
 * "Photo, skills, experience, service area selection."
 *
 * Skills were chosen at registration, so this step is the photo, the
 * experience, and the areas a pro will travel to — plus a bio, which the
 * inventory does not ask for here and which a customer profile is poor without.
 *
 * ## The photo is optional, and the reason it exists is stated
 *
 * A required photo is a wall for a pro registering on a bus at night. But a
 * customer opening their door to a stranger looks at the photo first, so it is
 * worth asking properly: this says the customer sees it, rather than treating
 * it as a form field with no purpose.
 *
 * It is deliberately not the KYC selfie. That one is matched against the
 * Aadhaar and never shown to a customer; this one is public. Conflating them
 * would mean either publishing an identity document photo or matching KYC
 * against a picture a pro chose to look good in.
 */

export default function ProProfileSetupPage() {
  const router = useRouter();

  const [photos, setPhotos] = React.useState<CapturedPhoto[]>([]);
  const [years, setYears] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [areas, setAreas] = React.useState<string[]>([]);
  const [allAreas, setAllAreas] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void getServiceAreas()
      .then((list) => {
        if (!cancelled) setAllAreas(list);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load the area list.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const yearsNum = Number(years);
  const yearsValid =
    years !== "" && Number.isInteger(yearsNum) && yearsNum >= 0 && yearsNum <= 60;
  const valid = yearsValid && areas.length > 0;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await saveProfileSetup("pro_new", {
        photo: photos.length > 0,
        // Chosen at registration; carried through so the backend receives the
        // whole setup in one call rather than assembling it from two.
        skills: [],
        experienceYears: yearsNum,
        areas,
      });
      router.push("/documents");
    } catch {
      toast.error("Could not save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      heading="Set up your profile"
      subheading="This is what a customer sees when they are matched with you."
      step="profile"
      backHref="/register"
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {/* The public photo. */}
        <OnboardingCard>
          <PhotoCapture
            photos={photos}
            onChange={setPhotos}
            label="Your photo"
            maximum={1}
            hint="Customers see this before they open the door to you. A clear photo of your face, in good light, without sunglasses."
          />
          {photos.length === 0 && (
            <p className="mt-2 flex items-start gap-2 text-caption text-ink-muted">
              <Camera className="mt-px size-4 shrink-0" aria-hidden="true" />
              You can add this later, but profiles with a photo get accepted by
              customers more often.
            </p>
          )}
        </OnboardingCard>

        {/* Experience and bio. */}
        <OnboardingCard>
          <FormField
            label="Years of experience"
            htmlFor="years"
            required
            {...(years !== "" && !yearsValid
              ? { error: "Enter a whole number of years, up to 60." }
              : {})}
          >
            <Input
              id="years"
              value={years}
              onChange={(e) => setYears(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="8"
              className="max-w-line-sm tabular"
            />
          </FormField>

          <FormField
            label="About your work"
            htmlFor="bio"
            help="A line or two on what you do. Customers read this on your profile."
            className="mt-4"
          >
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Eight years of plumbing work across Trichy. I handle concealed pipe leaks, tap and mixer fittings, and bathroom re-piping."
            />
          </FormField>
        </OnboardingCard>

        {/* Areas. */}
        <OnboardingCard>
          <p className="text-small font-medium text-ink">
            Where will you travel?
            <span className="ml-1 text-critical-ink" aria-hidden="true">
              *
            </span>
          </p>
          <p className="mt-px text-caption text-ink-muted">
            Choose every area you are willing to work in. More areas means more
            jobs offered to you.
          </p>

          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {allAreas.map((area) => {
              const checked = areas.includes(area);
              return (
                <li key={area}>
                  <label
                    className={cn(
                      "flex min-h-touch cursor-pointer items-center gap-3 rounded-control px-3",
                      "transition-colors duration-fast hover:bg-canvas",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        setAreas((current) =>
                          next === true
                            ? [...current, area]
                            : current.filter((a) => a !== area),
                        )
                      }
                    />
                    <span className="min-w-0 truncate text-small text-ink">
                      {area}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {areas.length === 0 && (
            <p className="mt-2 text-caption text-ink-muted">
              Choose at least one area.
            </p>
          )}
        </OnboardingCard>

        <Button
          type="submit"
          size="pro"
          className="w-full"
          disabled={!valid || busy}
        >
          {busy ? "Saving…" : "Continue to documents"}
          {!busy && <ArrowRight />}
        </Button>

        <p className="flex items-start gap-2 text-caption text-on-structure-faint">
          <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
          Next we need your Aadhaar, PAN and a selfie. Have them ready.
        </p>
      </form>
    </OnboardingShell>
  );
}
