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
  title: "Lumina | AI Image Classification",
  description: "Advanced AI image classification system powered by custom PyTorch CNNs. Next-gen UI with real-time detection and custom dataset training.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground bg-wave font-sans selection:bg-primary/30 selection:text-primary">
        <main className="relative flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          {children}
        </main>
      </body>
    </html>
  );
}
