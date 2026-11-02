import Link from "next/link"
import { JsonLd } from "@/components/json-ld"
import { faqPage, type Faq } from "@/lib/site"

const TOOLS = [
  { href: "/sheet-schema-builder", label: "Schema Builder" },
  { href: "/sheet-visualiser", label: "Sheet Visualizer" },
]

// Server-rendered intro below the full-screen tool, so crawlers get visible text and links.
export function ToolIntro({
  title,
  description,
  steps,
  faqs,
  currentHref,
}: {
  title: string
  description: string
  steps: string[]
  faqs: Faq[]
  currentHref: string
}) {
  return (
    <section className="border-t bg-white px-4 py-12">
      <JsonLd data={faqPage(faqs)} />
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-3 text-gray-600">{description}</p>
        <h2 className="mt-8 text-lg font-semibold text-gray-900">How to use it</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-600">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <h2 className="mt-8 text-lg font-semibold text-gray-900">Frequently asked questions</h2>
        <div className="mt-3 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-medium text-gray-900">{faq.question}</h3>
              <p className="mt-1 text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
        <nav aria-label="Sheet Tools" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/" className="font-medium text-blue-600 underline underline-offset-2">
            Sheet Tools home
          </Link>
          {TOOLS.filter((tool) => tool.href !== currentHref).map((tool) => (
            <Link key={tool.href} href={tool.href} className="font-medium text-blue-600 underline underline-offset-2">
              {tool.label}
            </Link>
          ))}
          <Link href="/#generators" className="font-medium text-blue-600 underline underline-offset-2">
            Code Generators
          </Link>
        </nav>
      </div>
    </section>
  )
}
