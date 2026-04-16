import { PageHeader } from "@/components/shared/PageHeader";

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="How we collect, use, and protect your data."
      />
      
      <div className="prose prose-stone prose-lg dark:prose-invert">
        <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
        
        <h3>1. Data We Collect</h3>
        <p>We collect essential information required to provide the LifeOS service. This includes your email address for account creation and any personal data you explicitly enter into the application (e.g., tasks, diary entries, goals, settings).</p>
        
        <h3>2. Cloud Storage and AI</h3>
        <p>Images uploaded to your Vision Board are securely hosted on Cloudinary. When you use AI features (like diary reflection or image parsing), specific data points are securely transmitted to our AI partners solely for generating the requested insights. This data is not used to train global models.</p>
        
        <h3>3. Full Data Ownership</h3>
        <p>You fully own your data. We do not sell your personal information or metadata. You may export your entire LifeOS history at any time from the Settings page.</p>

        <h3>4. Account Deletion (Right to be Forgotten)</h3>
        <p>You can permanently delete your account and all associated data via the Danger Zone in the Settings page. This action immediately scrubs your records from our databases and deletes all associated images from cloud storage.</p>
        
        <h3>5. Cookies</h3>
        <p>We use essential cookies strictly to maintain your logged-in session securely. We do not use third-party analytics or tracking cookies without your consent.</p>
      </div>
    </section>
  );
}
