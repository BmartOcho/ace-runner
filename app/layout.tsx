import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Disc Golf Challenge",
  description: "Record and verify disc golf challenge throws",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#55277F] min-h-screen">{children}</body>
    </html>
  )
}
