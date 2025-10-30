"use client"

import { useEffect } from "react"

export function PerformanceMonitor() {
    useEffect(() => {
        if (typeof window === "undefined") return

        // Report Web Vitals
        const reportWebVitals = () => {
            if ("PerformanceObserver" in window) {
                // Largest Contentful Paint
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries()
                    const lastEntry = entries[entries.length - 1] as any
                    console.log("LCP:", lastEntry.renderTime || lastEntry.loadTime)
                })
                lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })

                // First Input Delay
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries()
                    entries.forEach((entry: any) => {
                        console.log("FID:", entry.processingStart - entry.startTime)
                    })
                })
                fidObserver.observe({ entryTypes: ["first-input"] })

                // Cumulative Layout Shift
                let clsValue = 0
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!(entry as any).hadRecentInput) {
                            clsValue += (entry as any).value
                            console.log("CLS:", clsValue)
                        }
                    }
                })
                clsObserver.observe({ entryTypes: ["layout-shift"] })
            }
        }

        // Run after page load
        if (document.readyState === "complete") {
            reportWebVitals()
        } else {
            window.addEventListener("load", reportWebVitals)
            return () => window.removeEventListener("load", reportWebVitals)
        }
    }, [])

    return null
}
