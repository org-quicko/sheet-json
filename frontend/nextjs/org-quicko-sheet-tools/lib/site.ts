export const SITE_URL = "https://sheet-tools.quicko.org.in"

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
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: PUBLISHER,
    sameAs: ["https://github.com/org-quicko/sheet-json"],
  }
}
