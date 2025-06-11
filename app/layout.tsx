import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Blind Navigation Dashboard",
  description: "Accessible navigation dashboard for blind users with real-time tracking and communication",
  keywords: "blind navigation, accessibility, GPS tracking, emergency alerts",
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
