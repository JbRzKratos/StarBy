export const metadata = {
  title: 'Return Policy',
  description: 'StarBy Return Policy',
};

export default function ReturnsPage() {
  return (
    <main className="min-h-screen pt-32 pb-16 px-5 md:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-display-md text-bone mb-8">Return Policy.</h1>
        <div className="font-mono text-body-sm text-pearl space-y-8">
          <section>
            <h2 className="text-bone uppercase tracking-widest mb-4">Standard Products</h2>
            <p className="leading-relaxed">
              We accept returns for non-customized products within 14 days of delivery. The item
              must be unused, in its original packaging, and in the same condition that you received
              it.
            </p>
          </section>

          <section>
            <h2 className="text-bone uppercase tracking-widest mb-4">Custom Products</h2>
            <p className="leading-relaxed">
              Because custom products are made specifically to your design and specifications, we
              cannot accept returns or exchanges on custom orders unless the product is defective or
              damaged upon arrival.
            </p>
          </section>

          <section>
            <h2 className="text-bone uppercase tracking-widest mb-4">Defective Items</h2>
            <p className="leading-relaxed">
              If you receive a defective or damaged product, please contact our support team within
              48 hours of delivery with photos of the issue. We will arrange a replacement at no
              additional cost.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
