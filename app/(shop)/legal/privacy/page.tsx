export const metadata = {
  title: 'Privacy Policy',
  description: 'StarBy Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pt-32 pb-16 px-5 md:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-display-md text-bone mb-8">Privacy Policy.</h1>
        <div className="font-mono text-body-sm text-pearl space-y-8">
          <section>
            <h2 className="text-bone uppercase tracking-widest mb-4">1. Data Collection</h2>
            <p className="leading-relaxed">
              We collect information that you provide directly to us, such as when you create or
              modify your account, request on-demand services, contact customer support, or
              otherwise communicate with us.
            </p>
          </section>

          <section>
            <h2 className="text-bone uppercase tracking-widest mb-4">2. Use of Information</h2>
            <p className="leading-relaxed">
              We may use the information we collect about you to provide, maintain, and improve our
              services, including to process transactions, develop new products and features, and
              personalize your experience.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
