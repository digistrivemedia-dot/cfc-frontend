"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { Button, FormField, InlineAlert, Input } from "@cfc/ui";
import { AuthShell } from "@/components/auth-shell";

/**
 * Admin 2 — Forgot password.
 *
 * Inventory: "Reset via secure email link."
 *
 * Frontend only — no mail is sent. What the screen owes is the interaction:
 * a field that says when it is empty or malformed, a button that cannot be
 * pressed twice, and a confirmation that names the address it went to.
 *
 * That last part matters more than it looks. "Check your email" is useless to
 * someone who has two accounts and has just typed the wrong one; echoing the
 * address back is what lets them notice.
 *
 * The resend has a cooldown for the same reason a real one would: a person who
 * sees nothing arrive will press it repeatedly, and a counter tells them
 * waiting is the right move.
 */

const RESEND_SECONDS = 30;

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  return (
    <AuthShell
      title={sentTo === null ? "Reset your password" : "Check your email"}
      subtitle={
        sentTo === null
          ? "Enter the email on your admin account and we will send a secure link."
          : undefined
      }
      aside={
        <Link
          href="/login"
          className="inline-flex items-center gap-1 rounded-pill transition-colors duration-fast hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to sign in
        </Link>
      }
    >
      {sentTo === null ? (
        <RequestForm email={email} onEmailChange={setEmail} onSent={setSentTo} />
      ) : (
        <SentPanel address={sentTo} onUseAnother={() => setSentTo(null)} />
      )}
    </AuthShell>
  );
}

function RequestForm({
  email,
  onEmailChange,
  onSent,
}: {
  email: string;
  onEmailChange: (value: string) => void;
  onSent: (address: string) => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (trimmed === "") {
      setError("Enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("That does not look like an email address.");
      return;
    }

    setError(null);
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      // Deliberately confirms for any well-formed address. Saying "no such
      // account" here tells an attacker which addresses are real, and the
      // backend team will want the same behaviour.
      onSent(trimmed);
    }, 600);
  };

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <FormField label="Email" required {...(error ? { error } : {})}>
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            onEmailChange(e.target.value);
            if (error) setError(null);
          }}
          placeholder="admin@cityfamilycare.in"
          icon={<Mail />}
          autoComplete="email"
          autoFocus
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={busy}
      >
        Send reset link
      </Button>

    </form>
  );
}

function SentPanel({
  address,
  onUseAnother,
}: {
  address: string;
  onUseAnother: () => void;
}) {
  const [left, setLeft] = React.useState(RESEND_SECONDS);

  React.useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 text-center" role="status">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-live-subtle text-live">
          <MailCheck className="size-6" aria-hidden="true" />
        </span>
        <p className="text-body text-ink">
          A reset link is on its way to{" "}
          <span className="font-medium">{address}</span>.
        </p>
      </div>

      <InlineAlert>
        If it has not arrived in a few minutes, check your spam folder before
        requesting another.
      </InlineAlert>

      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={left > 0}
        onClick={() => setLeft(RESEND_SECONDS)}
      >
        {left > 0 ? (
          <>
            Resend in <span className="tabular">{left}s</span>
          </>
        ) : (
          "Resend link"
        )}
      </Button>

      <p className="text-center">
        <button
          type="button"
          onClick={onUseAnother}
          className="rounded-pill text-small font-medium text-action hover:underline"
        >
          Use a different email
        </button>
      </p>
    </div>
  );
}
