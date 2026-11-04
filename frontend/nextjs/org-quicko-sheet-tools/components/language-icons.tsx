import type { SVGProps } from "react"
import { siOpenjdk, siTypescript } from "simple-icons"

function BrandIcon({ path, ...props }: { path: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d={path} />
    </svg>
  )
}

export function TypeScriptIcon(props: SVGProps<SVGSVGElement>) {
  return <BrandIcon path={siTypescript.path} {...props} />
}

// simple-icons no longer ships the Java logo, so this uses the OpenJDK mark.
export function JavaIcon(props: SVGProps<SVGSVGElement>) {
  return <BrandIcon path={siOpenjdk.path} {...props} />
}
