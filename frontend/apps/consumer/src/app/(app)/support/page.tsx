"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, MessageSquare, Phone, Plus, Send, Sparkles } from "lucide-react";
import {
  AI_ASSISTANT_IS_SHELL,
  SUPPORT_HOURS,
  SUPPORT_PHONE,
  askAssistant,
  getMyTicket,
  getMyTickets,
  getSupportFaqs,
  raiseTicket,
  replyToTicket,
} from "@cfc/mocks";
import type { ServiceFaq, TicketDetail } from "@cfc/types";
import {
  Accordion,
  Button,
  EmptyState,
  ErrorState,
  FormField,
  InlineAlert,
  Input,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  TicketStatusBadge,
  Textarea,
  cn,
  formatSchedule,
  toast,
} from "@cfc/ui";
import { RequireAccount } from "@/components/require-account";

/**
 * Customer 40, 41, 42 — help, tickets, and the assistant.
 *
 * Three tabs on one route. A customer with a problem does not know whether
 * they want the FAQ, a ticket or the assistant — they want an answer — so
 * making them choose a destination before they can ask is the wrong shape.
 *
 * The helpline is above the tabs because a phone call is the fastest route for
 * anyone who is already frustrated, and burying it behind a tab reads as
 * avoidance.
 */

type Tab = "help" | "tickets" | "assistant";

const TABS: { id: Tab; label: string }[] = [
  { id: "help", label: "Help" },
  { id: "tickets", label: "My tickets" },
  { id: "assistant", label: "Assistant" },
];

function SupportInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get("tab") as Tab | null) ?? "help";

  return (
    <div className="mx-auto max-w-screen-md px-4 pt-4 md:px-6 md:pb-12">
      <h1 className="text-title font-semibold text-ink">Help and support</h1>

      {/* The helpline, first. */}
      <a
        href={`tel:${SUPPORT_PHONE}`}
        className={cn(
          "mt-3 flex items-center gap-3 rounded-card border border-action-line bg-action-subtle p-4",
          "transition-opacity duration-fast hover:opacity-90",
        )}
      >
        <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-action text-on-action">
          <Phone className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-small font-semibold text-ink">
            Call our team
          </span>
          <span className="tabular block text-caption text-ink-muted">
            {SUPPORT_HOURS} · {displayPhone(SUPPORT_PHONE)}
          </span>
        </span>
      </a>

      <div
        role="tablist"
        aria-label="Support sections"
        className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:px-0"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() =>
                router.push(t.id === "help" ? "/support" : `/support?tab=${t.id}`)
              }
              className={cn(
                "flex h-touch shrink-0 items-center rounded-pill border px-3 text-small",
                "transition-colors duration-fast",
                active
                  ? "border-action bg-action text-on-action"
                  : "border-border bg-surface text-ink hover:border-action-line hover:bg-action-subtle",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "help" && <HelpTab />}

      {/* The FAQ and the helpline stay public — a stranger with a question
          should not need an account to get an answer, and refusing one is a
          good way to turn a question into a lost customer. Tickets are a
          personal thread, so only that tab asks for a sign-in. */}
      {tab === "tickets" && (
        <RequireAccount
          title="Sign in to see your tickets"
          description="Your support conversations are kept with your account. The FAQ and the helpline are open to everyone."
        >
          <TicketsTab />
        </RequireAccount>
      )}

      {tab === "assistant" && <AssistantTab />}
    </div>
  );
}

/** Customer 40 — FAQ accordion plus raising a ticket. */
function HelpTab() {
  const [faqs, setFaqs] = React.useState<ServiceFaq[] | null>(null);
  const [error, setError] = React.useState(false);
  const [raiseOpen, setRaiseOpen] = React.useState(false);

  React.useEffect(() => {
    getSupportFaqs().then(setFaqs).catch(() => setError(true));
  }, []);

  return (
    <div className="mt-4 space-y-4">
      <section>
        <h2 className="mb-2 text-heading font-semibold text-ink">
          Common questions
        </h2>
        {error ? (
          <ErrorState title="We could not load these" />
        ) : faqs === null ? (
          <Skeleton className="h-block-md rounded-card" />
        ) : (
          <Accordion
            items={faqs.map((f) => ({
              id: f.id,
              question: f.question,
              answer: f.answer,
            }))}
          />
        )}
      </section>

      <section className="rounded-card border border-border bg-surface p-4">
        <h2 className="text-small font-semibold text-ink">
          Still need help?
        </h2>
        <p className="mt-1 text-caption text-ink-muted">
          Raise a ticket and our team will get back to you.
        </p>
        <Button
          variant="secondary"
          className="mt-3 w-full"
          onClick={() => setRaiseOpen(true)}
        >
          <Plus />
          Raise a ticket
        </Button>
      </section>

      <RaiseTicketSheet open={raiseOpen} onOpenChange={setRaiseOpen} />
    </div>
  );
}

/** Customer 41 — the customer's tickets, and one thread. */
function TicketsTab() {
  const [rows, setRows] = React.useState<TicketDetail[] | null>(null);
  const [error, setError] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(false);
    getMyTickets().then(setRows).catch(() => setError(true));
  }, []);

  React.useEffect(() => load(), [load]);

  return (
    <div className="mt-4">
      {error ? (
        <ErrorState
          title="We could not load your tickets"
          action={{ label: "Try again", onClick: load }}
        />
      ) : rows === null ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-block-xs rounded-card" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-border bg-surface">
          <EmptyState
            icon={<MessageSquare />}
            title="No tickets yet"
            description="Anything you raise with our team appears here."
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setOpenId(t.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-card border border-border bg-surface p-4 text-left",
                  "transition-colors duration-fast hover:border-action-line",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-small font-medium text-ink">
                    {t.subject}
                  </span>
                  <span className="tabular mt-px block text-caption text-ink-muted">
                    {t.messages.length}{" "}
                    {t.messages.length === 1 ? "message" : "messages"} ·{" "}
                    {formatSchedule(t.updatedAt)}
                  </span>
                </span>
                <TicketStatusBadge status={t.status} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <TicketThreadSheet
        ticketId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        onReplied={load}
      />
    </div>
  );
}

/**
 * Customer 41 — one thread.
 *
 * Internal notes are stripped in the API, not here. An agent's private note
 * ("second no-show for this pro") is staff-only, and filtering it in the UI
 * would mean a later refactor could drop the filter silently.
 */
function TicketThreadSheet({
  ticketId,
  onOpenChange,
  onReplied,
}: {
  ticketId: string | null;
  onOpenChange: (open: boolean) => void;
  onReplied: () => void;
}) {
  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [reply, setReply] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (ticketId === null) {
      setTicket(null);
      return;
    }
    setReply("");
    getMyTicket(ticketId).then(setTicket).catch(() => setTicket(null));
  }, [ticketId]);

  const send = () => {
    if (ticketId === null || reply.trim() === "") return;
    setBusy(true);
    replyToTicket(ticketId, reply)
      .then(() => {
        setReply("");
        toast.success("Reply sent");
        getMyTicket(ticketId).then(setTicket);
        onReplied();
      })
      .catch(() => toast.error("We could not send that. Try again."))
      .finally(() => setBusy(false));
  };

  return (
    <Sheet open={ticketId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-detail">
        <SheetHeader>
          <SheetTitle>{ticket?.subject ?? "Ticket"}</SheetTitle>
        </SheetHeader>

        <SheetBody>
          {ticket === null ? (
            <Skeleton className="h-block-md rounded-card" />
          ) : (
            <ul className="space-y-3">
              {ticket.messages.map((m) => {
                const mine = m.author === "You";
                return (
                  <li
                    key={m.id}
                    className={cn("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-prose rounded-card p-3",
                        mine
                          ? "bg-action text-on-action"
                          : "border border-border bg-surface text-ink",
                      )}
                    >
                      {!mine && (
                        <p className="text-caption font-medium text-ink-muted">
                          {m.author}
                        </p>
                      )}
                      <p className="mt-px text-small">{m.body}</p>
                      <p
                        className={cn(
                          "tabular mt-1 text-caption",
                          mine ? "text-on-action" : "text-ink-faint",
                        )}
                      >
                        {formatSchedule(m.sentAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SheetBody>

        <SheetFooter>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex w-full gap-2"
          >
            <Input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply"
              aria-label="Your reply"
            />
            <Button
              type="submit"
              variant="primary"
              size="icon-md"
              loading={busy}
              disabled={reply.trim() === ""}
              aria-label="Send reply"
            >
              <Send />
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function RaiseTicketSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (open) {
      setSubject("");
      setBody("");
    }
  }, [open]);

  const valid = subject.trim() !== "" && body.trim() !== "";

  const submit = () => {
    if (!valid) return;
    setBusy(true);
    raiseTicket(subject, body)
      .then(() => {
        toast.success("Ticket raised. Our team will be in touch.");
        onOpenChange(false);
        router.push("/support?tab=tickets");
      })
      .catch(() => toast.error("We could not raise that. Try again."))
      .finally(() => setBusy(false));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Raise a ticket</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <FormField label="What is it about?" required>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Refund not received"
            />
          </FormField>
          <FormField
            label="Tell us more"
            required
            help="Include a booking reference if it relates to one."
          >
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="What happened, and what would you like us to do?"
            />
          </FormField>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="primary"
            className="w-full"
            loading={busy}
            disabled={!valid}
            onClick={submit}
          >
            Raise ticket
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Customer 42 — the assistant.
 *
 * A UI shell over scripted keyword replies. The notice is not optional: a
 * customer who believes they are talking to something that can act on their
 * booking, and is not, ends up in support with a worse problem.
 */
function AssistantTab() {
  const [messages, setMessages] = React.useState<
    { id: string; mine: boolean; body: string }[]
  >([
    {
      id: "seed",
      mine: false,
      body: "Ask me about prices, cancelling, the warranty, or finding a service.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const send = () => {
    const question = input.trim();
    if (question === "") return;
    const mineId = `m_${Date.now()}`;
    setMessages((c) => [...c, { id: mineId, mine: true, body: question }]);
    setInput("");
    setBusy(true);
    askAssistant(question)
      .then((reply) =>
        setMessages((c) => [
          ...c,
          { id: `${mineId}_r`, mine: false, body: reply },
        ]),
      )
      .finally(() => setBusy(false));
  };

  return (
    <div className="mt-4 space-y-3">
      {AI_ASSISTANT_IS_SHELL && (
        <InlineAlert tone="clock" title="Not a live assistant yet">
          This answers a few common questions from a script. It cannot see your
          bookings or make changes. For anything real, use Help or call our
          team.
        </InlineAlert>
      )}

      <div className="rounded-card border border-border bg-surface p-4">
        <ul className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn("flex", m.mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "flex max-w-prose gap-2 rounded-card p-3",
                  m.mine
                    ? "bg-action text-on-action"
                    : "border border-border bg-canvas text-ink",
                )}
              >
                {!m.mine && (
                  <Bot
                    className="mt-px size-4 shrink-0 text-ink-muted"
                    aria-hidden="true"
                  />
                )}
                <p className="text-small">{m.body}</p>
              </div>
            </li>
          ))}
          {busy && (
            <li className="flex justify-start">
              <div className="flex items-center gap-2 rounded-card border border-border bg-canvas p-3">
                <Sparkles
                  className="size-4 animate-pulse text-ink-muted"
                  aria-hidden="true"
                />
                <span className="text-small text-ink-muted">Thinking…</span>
              </div>
            </li>
          )}
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="mt-4 flex gap-2 border-t border-border pt-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question"
            aria-label="Ask the assistant"
          />
          <Button
            type="submit"
            variant="primary"
            size="icon-md"
            disabled={input.trim() === "" || busy}
            aria-label="Send"
          >
            <Send />
          </Button>
        </form>
      </div>
    </div>
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

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-md px-4 py-6 md:px-6">
          <Skeleton className="h-block-md rounded-card" />
        </div>
      }
    >
      <SupportInner />
    </Suspense>
  );
}
