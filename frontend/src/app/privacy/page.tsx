export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-6 mt-12">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold">1. Information Collection</h2>
        <p>
          We do not store or process your images beyond the immediate classification request. Images are sent directly to the API and are not retained on our servers.
        </p>
      </section>

      <section className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold">2. Camera Usage</h2>
        <p>
          Camera access is strictly local to your browser until you choose to capture and upload a frame. No video streams are transmitted to our servers.
        </p>
      </section>
    </div>
  );
}
