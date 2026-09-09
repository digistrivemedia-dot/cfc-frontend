"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Landmark, Smartphone, TriangleAlert } from "lucide-react";
import {
  isValidAccountNumber,
  isValidIfsc,
  isValidUpi,
  saveBankDetails,
} from "@cfc/mocks";
import { Button, FormField, Input, InlineAlert, toast } from "@cfc/ui";
import {
  OnboardingCard,
  OnboardingShell,
} from "@/components/onboarding-shell";

/**
 * Pro 7 — bank and UPI details.
 *
 * "Account number, IFSC, UPI ID for daily payouts."
 *
 * ## Everything is validated here, not two days later
 *
 * This is the screen where a typo costs real money and real time. A wrong IFSC
 * or a transposed digit does not fail now — it fails when the first payout is
 * attempted, days after the pro has finished the work, and the pro is the one
 * left chasing it while assuming the platform simply has not paid them.
 *
 * So: the IFSC shape (four letters, a zero, six alphanumerics) is checked, the
 * account number is checked for length, and the account number is **entered
 * twice**. Confirming an account number is a banking convention precisely
 * because a single-entry field silently accepts a plausible wrong answer.
 *
 * ## The account name warning
 *
 * A transfer to an account in someone else's name is a fraud problem and a
 * failed-payment problem at once. The screen says the name must match the
 * Aadhaar the pro just uploaded, because a pro using a spouse's or parent's
 * account is a genuinely common and genuinely blocking situation — and one they
 * should discover here rather than after their first job.
 */

export default function ProBankDetailsPage() {
  const router = useRouter();

  const [accountName, setAccountName] = React.useState("");
  const [account, setAccount] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [ifsc, setIfsc] = React.useState("");
  const [upi, setUpi] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const nameValid = accountName.trim().length >= 3;
  const accountValid = isValidAccountNumber(account);
  const matches = account !== "" && account === confirm;
  const ifscValid = isValidIfsc(ifsc);
  // UPI is optional, so an empty field is valid and a filled one must be right.
  const upiValid = upi.trim() === "" || isValidUpi(upi.trim());

  const valid = nameValid && accountValid && matches && ifscValid && upiValid;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await saveBankDetails("pro_new", {
        accountName: accountName.trim(),
        accountNumber: account,
        ifsc: ifsc.toUpperCase(),
        upiId: upi.trim() === "" ? null : upi.trim(),
      });
      router.push("/terms");
    } catch {
      toast.error("Could not save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      heading="Where should we pay you?"
      subheading="Money from a completed job clears within 48 hours, straight to this account."
      step="bank"
      backHref="/documents"
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {/* The bank account. */}
        <OnboardingCard>
          <h2 className="flex items-center gap-2 text-small font-semibold text-ink">
            <Landmark className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
            Bank account
          </h2>

          <FormField
            label="Name on the account"
            htmlFor="account-name"
            required
            help="Must match the name on your Aadhaar. A transfer to an account in someone else's name will fail."
            className="mt-3"
            {...(accountName !== "" && !nameValid
              ? { error: "Enter the full name on the account." }
              : {})}
          >
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              autoComplete="name"
            />
          </FormField>

          <FormField
            label="Account number"
            htmlFor="account"
            required
            className="mt-4"
            {...(account !== "" && !accountValid
              ? { error: "An account number is 9 to 18 digits." }
              : {})}
          >
            <Input
              id="account"
              value={account}
              onChange={(e) =>
                setAccount(e.target.value.replace(/\D/g, "").slice(0, 18))
              }
              inputMode="numeric"
              // Not `autoComplete="off"` alone: a browser offering to save an
              // account number is fine, but offering to autofill it from an
              // unrelated field is not.
              autoComplete="off"
              className="tabular"
            />
          </FormField>

          {/* Entered twice, as every bank does, because a single field
              silently accepts a plausible wrong answer. */}
          <FormField
            label="Confirm account number"
            htmlFor="account-confirm"
            required
            className="mt-4"
            {...(confirm !== "" && !matches
              ? { error: "The two account numbers do not match." }
              : {})}
          >
            <Input
              id="account-confirm"
              value={confirm}
              onChange={(e) =>
                setConfirm(e.target.value.replace(/\D/g, "").slice(0, 18))
              }
              inputMode="numeric"
              autoComplete="off"
              // Pasting defeats the point of a confirmation field.
              onPaste={(e) => {
                e.preventDefault();
                toast.error("Type the account number again to confirm it.");
              }}
              className="tabular"
            />
          </FormField>

          <FormField
            label="IFSC code"
            htmlFor="ifsc"
            required
            help="Eleven characters, on your passbook or cheque book. For example HDFC0001234."
            className="mt-4"
            {...(ifsc !== "" && !ifscValid
              ? { error: "That is not a valid IFSC. Check it on your passbook." }
              : {})}
          >
            <Input
              id="ifsc"
              value={ifsc}
              onChange={(e) =>
                setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))
              }
              autoCapitalize="characters"
              autoComplete="off"
              className="max-w-line-2xl tabular"
            />
          </FormField>
        </OnboardingCard>

        {/* UPI, optional. */}
        <OnboardingCard>
          <h2 className="flex items-center gap-2 text-small font-semibold text-ink">
            <Smartphone className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
            UPI
            <span className="text-caption font-normal text-ink-muted">
              Optional
            </span>
          </h2>

          <FormField
            label="UPI ID"
            htmlFor="upi"
            help="UPI payouts usually arrive faster. Leave this empty to be paid to your bank account only."
            className="mt-3"
            {...(upi.trim() !== "" && !upiValid
              ? { error: "A UPI ID looks like name@bank." }
              : {})}
          >
            <Input
              id="upi"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              inputMode="email"
              autoComplete="off"
              placeholder="name@okhdfcbank"
              className="max-w-line-2xl"
            />
          </FormField>
        </OnboardingCard>

        <InlineAlert tone="clock" title="Check these before you continue">
          A wrong account number or IFSC means a failed transfer days later, and
          changing these afterwards needs a verified request to the CFC office.
        </InlineAlert>

        <Button
          type="submit"
          size="pro"
          className="w-full"
          disabled={!valid || busy}
        >
          {busy ? "Saving…" : "Continue"}
          {!busy && <ArrowRight />}
        </Button>

        {!valid && (
          <p className="flex items-start justify-center gap-2 text-center text-caption text-on-structure-muted">
            <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
            {!nameValid
              ? "Enter the name on the account."
              : !accountValid
                ? "Enter a valid account number."
                : !matches
                  ? "Confirm the account number."
                  : !ifscValid
                    ? "Enter a valid IFSC code."
                    : "Check your UPI ID."}
          </p>
        )}
      </form>
    </OnboardingShell>
  );
}
