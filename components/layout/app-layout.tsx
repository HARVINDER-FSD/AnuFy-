"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { useAuth } from "@/components/auth/auth-provider";
import { AppHeader } from "./app-header";
import { MobileNav } from "./mobile-nav";

// Pages where auth is required and where nav should be hidden
const AUTH_PAGES = ["/login", "/register"];
const HIDE_NAV_PAGES = ["/", "/login", "/register"];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isAuthPage = AUTH_PAGES.includes(pathname);
  const shouldHideNav = HIDE_NAV_PAGES.includes(pathname);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // If on login/register/root page, just render children without navigation
  if (isAuthPage || pathname === "/") {
    return <>{children}</>;
  }

  // Show loading only after mount to prevent hydration mismatch
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-14" /> {/* Header placeholder */}
        <main className="flex-1 pb-20">
          {children}
        </main>
        <div className="h-16" /> {/* Nav placeholder */}
      </div>
    );
  }

  // Main authenticated layout
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!shouldHideNav && <AppHeader />}
      <main className={cn("flex-1", !shouldHideNav && "pb-20")}>
        {children}
      </main>
      {!shouldHideNav && <MobileNav />}
    </div>
  );
}
