import { PageHeader } from "@/components/shared/PageHeader";

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description="The rules governing your use of LifeOS."
      />
      
      <div className="prose prose-stone prose-lg dark:prose-invert">
        <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
        
        <h3>1. Acceptance of Terms</h3>
        <p>By registering for and using LifeOS, you agree to form a binding contract with us. If you do not agree to these terms, please do not use the service.</p>
        
        <h3>2. Responsible Use</h3>
        <p>LifeOS is designed to manage personal productivity. You agree not to misuse the platform. This includes avoiding automated scraping, attempting to bypass rate limits, or uploading illegal/malicious content to the Vision Board.</p>
        
        <h3>3. Service Availability</h3>
        <p>We strive for 99.9% uptime, but LifeOS is provided "as is". We reserve the right to modify or discontinue features at any time without prior notice. Always ensure your most critical data is exported regularly.</p>

        <h3>4. Account Termination</h3>
        <p>We reserve the right to suspend or terminate accounts that violate these terms or present a security risk to other users. You may terminate your own account instantly from the Settings dashboard.</p>
      </div>
    </section>
  );
}
