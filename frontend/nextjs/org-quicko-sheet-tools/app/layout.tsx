import type { Metadata } from 'next'
import './globals.css'
import { SITE_URL } from '@/lib/site'
import { ThemeProvider } from '@/components/theme-provider'

const title = 'Sheet-JSON Schema Builder & Visualizer | Sheet Tools'
const description =
  'Build draft-07 JSON Schemas for sheet-json workbooks, edit workbook data in a spreadsheet view, and generate TypeScript and Java classes in your browser.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  title,
  description,
  applicationName: 'Sheet Tools',
  keywords: ['sheet-json', 'schema builder', 'sheet visualizer', 'JSON Schema', 'code generator', 'TypeScript', 'Java'],
  authors: [{ name: 'Labs@Quicko', url: 'https://quicko.company/labs' }],
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Sheet Tools',
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
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
    // next-themes sets the theme class on <html> before hydration.
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
