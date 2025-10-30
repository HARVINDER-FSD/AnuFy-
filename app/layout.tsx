import React, { Suspense } from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./ayes-font.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { AppLayout } from "@/components/layout/app-layout"
import { Toaster } from "@/components/ui/toaster"
import { CacheControl } from "@/components/cache-control"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "AnuFy - Connect with the World",
  description: "A modern social media platform for sharing moments and connecting with friends",
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className={`${inter.variable} antialiased font-sans`} data-version={Date.now()}>
        <ThemeProvider storageKey="anufy-theme">
          <AuthProvider>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              <CacheControl />
              <AppLayout>
                <div className="min-h-screen bg-background">{children}</div>
              </AppLayout>
              <Toaster />
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
