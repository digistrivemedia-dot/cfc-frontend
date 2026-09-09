"use client";

import * as React from "react";
import { MessageSquarePlus, Phone, Send } from "lucide-react";
import {
  SUPPORT_HOURS,
  SUPPORT_PHONE,
  getProFaqs,
  getProTickets,
  raiseTicket,
} from "@cfc/mocks";
import type { ServiceFaq, TicketListItem } from "@cfc/types";
import {
  Accordion,
  Badge,
  Button,
  FormField,
  Input,
  Skeleton,
  Textarea,
  toast,
} from "@cfc/ui";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 32 — help and support.
 *
 * "FAQ, raise ticket, call CFC helpline."
 *
 * ## The FAQ is pro-specific, and it is the point of the screen
 *
 * The consumer FAQ set answers customer questions and is useless here. These
 * twelve answer the questions this build has established a pro will actually
 * have — "why did I go offline after accepting", "is GST taken out of my
 * payment", "why can I not mark this job complete" — and every one is a rule
 * the app enforces somewhere.
 *
 * That matters more than it sounds. Most of this app's rules are invisible
 * until they bite: a pro who accepts a job and finds themselves offline
 * concludes the app dropped them. A well-aimed FAQ is cheaper than the support
 * call it prevents, and it is the only screen where all those rules sit
 * together.
 *
 * ## The phone number comes before the form
 *
 * A pro raising a ticket is usually standing in a customer's house with a
 * problem that needs answering now. The helpline is first, with its hours, so
 * nobody fills in a form when they needed a person — and the hours are shown so
 * a pro at 10pm knows to use the form instead of waiting for a callback.
 */

export default function ProSupportPage() {
  const [faqs, setFaqs] = React.useState<ServiceFaq[] | null>(null);
  const [tickets, setTickets] = React.useState<TicketListItem[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void Promise.all([getProFaqs(), getProTickets(currentProId())])
      .then(([f, t]) => {
        if (cancelled) return;
        setFaqs(f);
        setTickets(t);
      })
      .catch(() => {
        if (!cancelled) {
          setFaqs([]);
          setTickets([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-detail px-4 py-4 pb-12 md:px-6 md:py-6">
      <h1 className="text-title font-semibold text-ink">Help and support</h1>
      <p className="mt-1 text-small text-ink-muted">
        Most questions about jobs, payments and your account are answered below.
      </p>

      {/* The helpline, first. */}
      <section className="mt-4 overflow-hidden rounded-card bg-structure">
        <div className="flex items-start gap-3 p-4">
          <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-structure-raised text-brand">
            <Phone className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-small font-semibold text-on-structure">
              CFC helpline
            </p>
            <p className="mt-px text-caption text-on-structure-muted">
              Open {SUPPORT_HOURS}. Call if you are on a job and need an answer
              now.
            </p>
          </div>
        </div>
        <div className="border-t border-structure-line p-4">
          <Button variant="secondary" size="pro" className="w-full" asChild>
            <a href={`tel:${SUPPORT_PHONE}`}>
              <Phone />
              {displayPhone(SUPPORT_PHONE)}
            </a>
          </Button>
        </div>
      </section>

      {/* The FAQ. */}
      <section className="mt-6">
        <h2 className="text-heading font-semibold text-ink">
          Common questions
        </h2>

        {faqs === null ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-touch w-full rounded-control" />
            <Skeleton className="h-touch w-full rounded-control" />
            <Skeleton className="h-touch w-full rounded-control" />
          </div>
        ) : (
          <Accordion
            className="mt-3"
            items={faqs}
          />
        )}
      </section>

      {/* Existing tickets, if any. */}
      {tickets !== null && tickets.length > 0 && (
        <section className="mt-6">
          <h2 className="text-heading font-semibold text-ink">Your tickets</h2>
          <ul className="mt-3 space-y-2">
            {tickets.slice(0, 5).map((ticket) => (
              <li key={ticket.id}>
                <div className="rounded-card border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-small font-medium text-ink">
                      {ticket.subject}
                    </p>
                    <Badge
                      tone={ticket.status === "open" ? "clock" : "neutral"}
                    >
                      {ticket.status === "open" ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-caption text-ink-muted">
                    Last updated{" "}
                    {new Date(ticket.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RaiseTicket />
    </div>
  );
}

/**
 * Raise a ticket.
 *
 * Collapsed by default. A pro arriving here has a question, and most of them
 * are answered by the FAQ above — putting an open form at the top would send
 * people to the slowest channel first.
 */
function RaiseTicket() {
  const [open, setOpen] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const valid = subject.trim() !== "" && body.trim().length >= 10;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await raiseTicket(subject.trim(), body.trim());
      setSent(true);
      setOpen(false);
      setSubject("");
      setBody("");
      toast.success("Ticket raised. The office will get back to you.");
    } catch {
      toast.error("Could not raise the ticket. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  if (sent && !open) {
    return (
      <section className="mt-6 rounded-card border border-live-line bg-live-subtle p-4">
        <p className="text-small font-semibold text-live-ink">
          Your ticket is with the office
        </p>
        <p className="mt-px text-caption text-live-ink">
          They will reply on this screen. If it is urgent, call the helpline.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => setOpen(true)}
        >
          Raise another
        </Button>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-card border border-border bg-surface">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-touch w-full items-center gap-3 p-4 text-left transition-colors duration-fast hover:bg-canvas"
        >
          <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-action-subtle text-action">
            <MessageSquarePlus className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-small font-medium text-ink">
              Still need help?
            </span>
            <span className="block text-caption text-ink-muted">
              Raise a ticket and the office will reply.
            </span>
          </span>
        </button>
      ) : (
        <form
          className="p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <h2 className="text-small font-semibold text-ink">Raise a ticket</h2>

          <FormField
            label="What is it about?"
            htmlFor="ticket-subject"
            required
            className="mt-3"
          >
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Payment for job CFC12345678 has not arrived"
              maxLength={120}
            />
          </FormField>

          <FormField
            label="Tell us what happened"
            htmlFor="ticket-body"
            required
            help="Include the job reference and the date if it is about a specific job — it saves a round of questions."
            className="mt-4"
            {...(body !== "" && body.trim().length < 10
              ? { error: "A little more detail, so the office can act on it." }
              : {})}
          >
            <Textarea
              id="ticket-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={1000}
            />
          </FormField>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              type="submit"
              className="min-w-0 flex-1"
              disabled={!valid || busy}
            >
              <Send />
              {busy ? "Sending…" : "Send to the office"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-w-0 flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
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
