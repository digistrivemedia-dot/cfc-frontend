"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { AI_ASSISTANT_IS_SHELL, askAssistant } from "@cfc/mocks";
import { Button, Input, cn } from "@cfc/ui";
import { useSession } from "@/lib/session";
import { useCart } from "@/lib/cart";

/**
 * Customer 42 — the AI assistant, as a widget.
 *
 * WHY IT MOVED
 *
 * This lived as the third tab on /support, which meant it could only be
 * reached by a customer who had already decided they needed help and gone
 * looking for it. The agreement asks it for "service discovery and booking
 * help" — neither of which happens on the support screen. A customer stuck
 * choosing between two AC services would have had to leave the service page,
 * navigate to Help, and find a tab.
 *
 * As a floating control it is present wherever the question actually arises,
 * and costs nothing to ignore.
 *
 * WHERE IT IS SUPPRESSED
 *
 *   /support      the tab already lives there; two of the same thing on one
 *                 screen is a bug, not a convenience
 *   /book/*       it must not float over a payment step. A customer mid-
 *                 checkout with a card number on screen does not want a chat
 *                 bubble over the Pay button.
 *   signed out    the assistant answers questions about *your* bookings
 *
 * It is a shell over scripted replies, and says so — a customer who believes
 * they are talking to something that can act on their booking, and is not,
 * ends up in support with a worse problem than they started with.
 */
export function AssistantWidget() {
  const pathname = usePathname();
  const { signedIn } = useSession();
  const { count } = useCart();
  const [open, setOpen] = React.useState(false);

  /* The checkout bar is a full-width pill pinned to the bottom edge, so at
     `bottom-4` this button would sit on top of it. Lifting clear of it is the
     only option: moving the button to the left would put it under the page's
     own content, and hiding it would remove the assistant exactly when a
     customer has a basket and a question about it. */
  const cartBarShowing = count > 0 && pathname !== "/cart";

  const suppressed =
    pathname === "/support" ||
    pathname.startsWith("/book/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/otp") ||
    pathname.startsWith("/forgot-password");

  // `signedIn` is null until localStorage has been read. Rendering the button
  // during that window would flash it at a signed-out visitor.
  if (signedIn !== true || suppressed) return null;

  return (
    <>
      {open && (
        <AssistantPanel
          onClose={() => setOpen(false)}
          raised={cartBarShowing}
        />
      )}

      {/* The launcher. Bottom-right, above the checkout bar's own space so the
          two never overlap on a phone. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Ask the assistant"}
        className={cn(
          "fixed right-4 z-popover grid size-touch-lg place-items-center rounded-full",
          "shadow-lg transition-all duration-base",
          "focus-visible:outline-none focus-visible:outline-focus",
          cartBarShowing ? "bottom-24" : "bottom-4",
          open
            ? "bg-structure text-on-action"
            : "bg-action text-on-action hover:bg-action-hover hover:shadow-xl",
        )}
      >
        {open ? (
          <X className="size-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="size-6" aria-hidden="true" />
        )}
      </button>
    </>
  );
}

function AssistantPanel({
  onClose,
  raised,
}: {
  onClose: () => void;
  /** True while the checkout bar is on screen — see the note at the launcher. */
  raised: boolean;
}) {
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
  const endRef = React.useRef<HTMLDivElement | null>(null);

  // A reply that lands below the fold is a reply the customer does not see.
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  // Escape closes, as it does for every other overlay in the app.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    <div
      role="dialog"
      aria-label="Assistant"
      className={cn(
        // Full width on a phone, a panel on a desktop. A 380px box on a 390px
        // screen leaves a 5px margin that reads as a mistake.
        "fixed inset-x-3 z-popover flex max-h-panel flex-col overflow-hidden",
        "rounded-card border border-border bg-surface shadow-lg",
        "sm:inset-x-auto sm:right-4 sm:w-[380px]",
        // The scale runs 0/1/2/3/4/5/6/8/12/16/20/24 and stops there, so `24`
        // (96px) is the top of it. Clearing the checkout bar as well needs
        // more than that, and stacking two utilities cannot express it - hence
        // the one arbitrary value on this component.
        raised ? "bottom-40" : "bottom-24",
      )}
    >
      <header className="flex items-center gap-2 bg-action px-4 py-3 text-on-action">
        <Bot className="size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-body font-bold">Assistant</p>
          <p className="text-caption opacity-80">Answers in a few seconds</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="grid size-8 shrink-0 place-items-center rounded-control transition-colors hover:bg-[rgba(255,255,255,0.15)]"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>

      {AI_ASSISTANT_IS_SHELL && (
        <p className="border-b border-border bg-clock-subtle px-4 py-2 text-caption text-clock-ink">
          Answers a few common questions from a script. It cannot see your
          bookings or make changes.
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <ul className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn("flex", m.mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "flex max-w-detail gap-2 rounded-card p-3",
                  m.mine
                    ? "bg-action text-on-action"
                    : "border border-border bg-canvas text-ink",
                )}
              >
                {!m.mine && (
                  <Bot
                    className="mt-px size-4 shrink-0 text-action"
                    aria-hidden="true"
                  />
                )}
                <p className="text-small leading-relaxed">{m.body}</p>
              </div>
            </li>
          ))}
          {busy && (
            <li className="flex justify-start">
              <div className="flex items-center gap-2 rounded-card border border-border bg-canvas p-3">
                <Sparkles
                  className="size-4 animate-pulse text-action"
                  aria-hidden="true"
                />
                <span className="text-small text-ink-muted">Thinking…</span>
              </div>
            </li>
          )}
        </ul>
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 border-t border-border p-3"
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
  );
}
