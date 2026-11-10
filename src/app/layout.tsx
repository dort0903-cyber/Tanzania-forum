import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

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
    default: "Tanzania Forums",
    template: "%s · Tanzania Forums",
  },
  description:
    "Tanzania’s open forum for ideas, truth, and community. Discuss politics, relationships, business, tech, and more.",
  keywords: [
    "Tanzania",
    "forum",
    "discussion",
    "JamiiCheck",
    "Siasa",
    "community",
  ],
  openGraph: {
    type: "website",
    locale: "en_TZ",
    siteName: "Tanzania Forums",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
