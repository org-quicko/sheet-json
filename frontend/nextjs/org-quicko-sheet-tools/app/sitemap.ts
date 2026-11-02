import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/sheet-schema-builder`, priority: 0.8 },
    { url: `${SITE_URL}/sheet-visualiser`, priority: 0.8 },
  ]
}
