import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Image Classification",
  description: "Image classification tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary">
        <main className="relative flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip flex-1">
          {children}
        </main>
        <footer className="w-full py-4 px-6 border-t border-border flex justify-center gap-6 text-sm text-muted-foreground">
          <a href="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</a>
          <a href="/terms" className="hover:text-foreground hover:underline">Terms & Conditions</a>
        </footer>
      </body>
    </html>
  );
}
