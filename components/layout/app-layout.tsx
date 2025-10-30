"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { useAuth } from "@/components/auth/auth-provider";
import { AppHeader } from "./app-header";
import { MobileNav } from "./mobile-nav";

// Pages where auth is required and where nav should be hidden
const AUTH_PAGES = ["/login", "/register"];
const HIDE_NAV_PAGES = ["/login", "/register", "/stories/create", "/stories", "/reels", "/create"];
const HIDE_HEADER_PAGES = ["/login", "/register", "/reels", "/stories/create", "/stories", "/profile", "/create"];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isAuthPage = AUTH_PAGES.includes(pathname);
  const shouldHideNav = HIDE_NAV_PAGES.includes(pathname);
  const shouldHideHeader = HIDE_HEADER_PAGES.includes(pathname) || pathname.startsWith('/profile/');

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // If on login/register page, just render children without navigation
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Instant render - no loading state
  if (!mounted) {
    return null; // Quick hydration
  }

  // Main authenticated layout
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!shouldHideHeader && <AppHeader />}
      <main className={cn("flex-1", !shouldHideNav && "pb-20")}>
        {children}
      </main>
      {!shouldHideNav && <MobileNav />}
    </div>
  );
}
