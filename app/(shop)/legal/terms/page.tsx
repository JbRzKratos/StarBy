export const metadata = {
  title: 'Terms of Service',
  description: 'StarBy Terms of Service',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen pt-32 pb-16 px-5 md:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-display-md text-bone mb-8">Terms of Service.</h1>
        <div className="font-mono text-body-sm text-pearl space-y-8">
          <section>
            <h2 className="text-bone uppercase tracking-widest mb-4">1. Introduction</h2>
            <p className="leading-relaxed">
              Welcome to StarBy. By accessing our website, you agree to these terms of service.
              These terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-bone uppercase tracking-widest mb-4">2. Purchases</h2>
            <p className="leading-relaxed">
              If you wish to purchase any product or service made available through the Service, you
              may be asked to supply certain information relevant to your Purchase.
            </p>
          </section>

          <section>
            <h2 className="text-bone uppercase tracking-widest mb-4">3. Custom Products</h2>
            <p className="leading-relaxed">
              Customized products are created on-demand based on your specifications. Once an order
              enters the production phase, it cannot be cancelled or modified.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
