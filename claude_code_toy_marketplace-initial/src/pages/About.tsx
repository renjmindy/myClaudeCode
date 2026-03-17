import { useState } from "react";
import * as Sentry from "@sentry/react";
import NavigationBar from "@/components/NavigationBar";
import { Button } from "@/components/ui/button";

const AboutContent = () => {
  const [crash, setCrash] = useState(false);
  const [sent, setSent] = useState(false);

  if (crash) {
    throw new Error("Intentional render crash from About page");
  }

  const handleCaptureError = () => {
    Sentry.captureException(new Error("Manual capture from About page"));
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      <main className="px-[var(--page-padding)] py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-display font-medium text-foreground mb-4">
            About Marketplace
          </h1>
          <p className="text-body text-foreground mb-4">
            Marketplace is your trusted platform for buying and selling authentic pre-owned products.
          </p>
          <p className="text-body text-foreground mb-6">
            We connect sellers with buyers in a safe, secure environment where quality and authenticity are guaranteed.
          </p>

          <div className="flex flex-col gap-3">
            <Button onClick={handleCaptureError} disabled={sent}>
              {sent ? "✓ Error sent to Sentry" : "Send Error to Sentry"}
            </Button>
            <Button variant="destructive" onClick={() => setCrash(true)}>
              Test Error Boundary (crash render)
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sentry.withErrorBoundary(AboutContent, {
  fallback: (
    <div className="p-8">
      <p className="text-destructive font-medium">Something went wrong — this crash has been reported to Sentry.</p>
    </div>
  ),
});
