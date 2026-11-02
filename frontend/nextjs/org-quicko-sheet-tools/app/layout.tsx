import type { Metadata } from 'next'
import './globals.css'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  title: 'Sheet Tools – Sheet-JSON Builder & Schema Generator | Labs at Quicko',
  description: 'Create sheet-JSON workbooks, build schemas, visualize data, and generate code effortlessly with your Excel-like JSON toolkit.',
  applicationName: 'Sheet Tools',
  keywords: ['sheet-json', 'schema builder', 'sheet visualizer', 'JSON Schema', 'code generator', 'TypeScript', 'Java'],
  authors: [{ name: 'Labs@Quicko', url: 'https://quicko.company/labs' }],
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Sheet Tools',
    title: 'Sheet Tools – Sheet-JSON Builder & Schema Generator',
    description: 'Build schemas, visualize workbook data, and generate TypeScript and Java code for sheet-json.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sheet Tools – Sheet-JSON Builder & Schema Generator',
    description: 'Build schemas, visualize workbook data, and generate TypeScript and Java code for sheet-json.',
  },
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
