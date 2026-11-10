"use client";

import { Header } from "./header";
import { Footer } from "./footer";
import { MobileNav } from "./mobile-nav";
import { SecondaryBar } from "./secondary-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      <Header />
      <SecondaryBar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {children}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
