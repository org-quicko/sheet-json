import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified, priority: 1 },
    { url: `${SITE_URL}/sheet-schema-builder`, lastModified, priority: 0.8 },
    { url: `${SITE_URL}/sheet-visualiser`, lastModified, priority: 0.8 },
  ]
}
