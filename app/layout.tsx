import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contexta",
  description: "AI-powered product management knowledge system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}
