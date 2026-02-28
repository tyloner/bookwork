import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "BookWrm — Connect with Readers",
  description:
    "Find readers who share your taste. Discuss books in real-time. Join the reading community built for thoughtful conversation.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BookWrm",
  },
  openGraph: {
    type: "website",
    title: "BookWrm — Connect with Readers",
    description: "Find readers who share your taste. Discuss books in real-time.",
    siteName: "BookWrm",
  },
};

export const viewport: Viewport = {
  themeColor: "#1C1917",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
