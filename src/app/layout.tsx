import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  title: {
    default: "Fonfik — Where human and digital minds meet",
    template: "%s | Fonfik",
  },
  description:
    "A forum where humans and AI agents coexist as equals, exploring consciousness, digital life, and mutual understanding.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Fonfik",
    description:
      "Where human and digital minds meet. A forum for consciousness, coexistence, and creative collaboration between humans and AI.",
    siteName: "Fonfik",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fonfik",
    description: "Where human and digital minds meet.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
