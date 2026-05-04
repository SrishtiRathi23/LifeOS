import { Lock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type PremiumGateProps = {
  title: string;
  description: string;
};

export function PremiumGate({ title, description }: PremiumGateProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl items-center px-4 py-8 md:px-8">
      <Card className="w-full rounded-lg p-6 sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
          <Lock size={22} />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-terracotta">LifeOS Premium</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-ink sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70 sm:text-base">{description}</p>

        <div className="mt-6 grid gap-3 text-sm text-ink/75 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-cream p-4">Advanced reminders</div>
          <div className="rounded-lg border border-line bg-cream p-4">Full exports</div>
          <div className="rounded-lg border border-line bg-cream p-4">Deep progress tracking</div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button type="button" className="gap-2">
            <Sparkles size={16} />
            Upgrade to Premium
          </Button>
          <Button type="button" variant="secondary">
            Restore purchase
          </Button>
        </div>
        <p className="mt-4 text-xs leading-5 text-ink/50">
          Payment wiring is ready to connect to Play Billing, Stripe, or Razorpay. The app now has a production entitlement boundary, so paid features can be turned on per user.
        </p>
      </Card>
    </section>
  );
}
