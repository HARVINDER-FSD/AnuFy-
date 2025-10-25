"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ComponentProps, useTransition } from "react"

// Enhanced Link component with instant navigation feel
export function FastLink({ 
  href, 
  children, 
  className,
  ...props 
}: ComponentProps<typeof Link>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    startTransition(() => {
      router.push(href.toString())
    })
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={className}
      prefetch={true} // Prefetch on hover
      {...props}
    >
      {children}
    </Link>
  )
}
