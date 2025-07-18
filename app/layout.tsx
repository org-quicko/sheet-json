import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sheet tools',
  description: 'A collection of utilities for interacting with sheet-json',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
