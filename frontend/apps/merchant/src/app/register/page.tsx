"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Store } from "lucide-react";
import type { MerchantCategory } from "@cfc/types";
import { Button, Checkbox, Input, Textarea } from "@cfc/ui";
import { getMerchantCategories } from "@cfc/mocks";

/**
 * Shop registration (screen 1).
 *
 * Collects only what CFC needs in order to route a request: who the shop is,
 * where it is, and what it stocks. No documents and no bank details — nothing
 * is paid through this app, so there is nothing to verify financially.
 *
 * Submitting leaves the account pending. An admin approves before any request
 * reaches it, which is why the confirmation says so plainly rather than
 * implying the shop is live.
 */

export default function RegisterPage() {
  const router = useRouter();
  const [categories, setCategories] = React.useState<MerchantCategory[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [isSubmitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    shopName: "",
    ownerName: "",
    phone: "",
    addressLine: "",
    area: "",
    city: "Tiruchirappalli",
    pincode: "",
  });

  React.useEffect(() => {
    void getMerchantCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.shopName.trim() || !form.ownerName.trim()) {
      setError("Shop name and owner name are both required.");
      return;
    }
    if (form.phone.length !== 10) {
      setError("Enter a 10-digit mobile number.");
      return;
    }
    if (form.pincode.length !== 6) {
      setError("Enter a 6-digit pincode.");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one category of materials you supply.");
      return;
    }

    setSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-live-subtle text-live-ink">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </span>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">
            Registration received
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            CFC will verify {form.shopName} and call you on +91 {form.phone}.
            You can sign in now, but requests only start once the shop is
            approved.
          </p>

          <Button className="mt-6 w-full" onClick={() => router.push("/login")}>
            Go to sign in
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg p-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-action hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to sign in
      </Link>

      <header className="mt-6">
        <span className="inline-flex size-12 items-center justify-center rounded-lg bg-action text-on-action">
          <Store className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
          Register your shop
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Supply materials for CFC jobs in your area. No listing fee, and
          nothing is paid through this app.
        </p>
      </header>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <Field
          id="shopName"
          label="Shop name"
          value={form.shopName}
          onChange={set("shopName")}
          placeholder="Sri Balaji Electricals"
        />
        <Field
          id="ownerName"
          label="Owner name"
          value={form.ownerName}
          onChange={set("ownerName")}
          placeholder="Ramesh Kumar"
        />

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Mobile number
          </label>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-touch items-center rounded-md border border-border px-3 text-sm text-ink-muted">
              +91
            </span>
            <Input
              id="phone"
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={(event) =>
                set("phone")(event.target.value.replace(/\D/g, ""))
              }
              placeholder="9791964797"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="addressLine"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Shop address
          </label>
          <Textarea
            id="addressLine"
            rows={2}
            value={form.addressLine}
            onChange={(event) => set("addressLine")(event.target.value)}
            placeholder="14, Big Bazaar Street"
          />
        </div>

        {/* Stacks on a phone, side by side from `sm`. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            id="area"
            label="Area"
            value={form.area}
            onChange={set("area")}
            placeholder="Thillai Nagar"
          />
          <Field
            id="city"
            label="City"
            value={form.city}
            onChange={set("city")}
          />
          <div>
            <label
              htmlFor="pincode"
              className="mb-2 block text-sm font-medium text-ink"
            >
              Pincode
            </label>
            <Input
              id="pincode"
              inputMode="numeric"
              maxLength={6}
              value={form.pincode}
              onChange={(event) =>
                set("pincode")(event.target.value.replace(/\D/g, ""))
              }
              placeholder="620018"
            />
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">
            Materials you supply
          </legend>
          <p className="mb-3 text-sm text-ink-muted">
            You only receive requests that match these.
          </p>

          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-neutral-subtle">
                  <Checkbox
                    checked={selected.has(category.id)}
                    onCheckedChange={(checked) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (checked === true) next.add(category.id);
                        else next.delete(category.id);
                        return next;
                      });
                      setError(null);
                    }}
                    aria-label={category.name}
                  />
                  <span className="text-sm text-ink">{category.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full">
          Submit for approval
        </Button>
      </form>
    </main>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...(placeholder ? { placeholder } : {})}
      />
    </div>
  );
}
