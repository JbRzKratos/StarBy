export const metadata = {
  title: 'About Us',
  description: 'Learn about StarBy and our vision for customized apparel.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-32 pb-16 px-5 md:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-display-md md:text-display-lg text-bone mb-8">
          About Us.
        </h1>
        <div className="font-mono text-body-md text-pearl space-y-6">
          <p>
            StarBy was born from a simple belief: you shouldn't have to fit into a brand's
            narrative. The brand should fit into yours.
          </p>
          <p>
            We are a premium customizable streetwear and accessories label. We don't just print
            designs; we engineer objects of self-expression.
          </p>
          <p>
            Every piece we create is designed with intention and made on demand. By removing
            mass-production waste, we focus entirely on quality, detail, and ensuring your story is
            told exactly how you want it.
          </p>
        </div>
      </div>
    </main>
  );
}
