import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sheet Tools – Sheet-JSON Builder & Schema Generator | Labs at Quicko',
  description: 'Create sheet-JSON workbooks, build schemas, visualize data, and generate code effortlessly with your Excel-like JSON toolkit.',
  generator: 'v0.dev',
  icons: {
    icon: [
      {
        url: '/favicon-light.svg',
        media: '(prefers-color-scheme: light)',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon-dark.svg',
        media: '(prefers-color-scheme: dark)',
        type: 'image/svg+xml',
      },
    ],
  },
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
