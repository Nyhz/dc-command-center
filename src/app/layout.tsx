import Script from "next/script";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Cinzel } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/navbar";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WoW Command Center",
  description: "Guild management, raid calendar, wishlists, and performance tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cinzel.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <TooltipProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
          </TooltipProvider>
        </Providers>
        <Script id="wowhead-config" strategy="lazyOnload">
          {`const whTooltips = { colorLinks: true, iconizeLinks: true, renameLinks: false, iconSize: "small" };`}
        </Script>
        <Script
          src="https://wow.zamimg.com/js/tooltips.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
