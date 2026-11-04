// No trailing slash: Next renders the root canonical without one, so the sitemap and JSON-LD match it.
export const SITE_URL = "https://sheet-tools.quicko.org.in"

export const OG_IMAGE_ALT = "Sheet Tools – build, visualize and generate sheet-json schemas"
export const OG_IMAGE_SIZE = { width: 1200, height: 630 }

// Child routes that set their own openGraph lose the root file-based image, so they pass these.
export const OG_IMAGE = [{ url: "/opengraph-image", ...OG_IMAGE_SIZE, alt: OG_IMAGE_ALT, type: "image/png" }]
export const TWITTER_IMAGE = [{ url: "/twitter-image", ...OG_IMAGE_SIZE, alt: OG_IMAGE_ALT, type: "image/png" }]

export const PUBLISHER = {
  "@type": "Organization",
  name: "Labs@Quicko",
  url: "https://quicko.company/labs",
}

export function webApplication(name: string, path: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url: `${SITE_URL}${path}`,
    description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (browser)",
    isAccessibleForFree: true,
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: PUBLISHER,
    sameAs: ["https://github.com/org-quicko/sheet-json"],
  }
}

export type Faq = { question: string; answer: string }

export function faqPage(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }
}
