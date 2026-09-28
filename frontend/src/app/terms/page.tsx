export default function TermsAndConditions() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-6 mt-12">
      <h1 className="text-3xl font-bold">Terms and Conditions</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold">1. Acceptable Use</h2>
        <p>
          You agree not to use this service for any illegal activities or to upload harmful, offensive, or inappropriate content.
        </p>
      </section>

      <section className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold">2. Service Availability</h2>
        <p>
          This is an experimental tool provided &quot;as is&quot; without any warranties. We reserve the right to limit or terminate access at any time.
        </p>
      </section>
    </div>
  );
}
