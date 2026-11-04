"use client"

import {
  ArrowRight,
  ChevronDown,
  Heart,
  Code,
  Eye,
  Layers,
  Zap,
  FileSpreadsheet,
  Settings,
  Database,
  Download,
  Terminal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Github } from "@/components/github-icon"
import { JavaIcon, TypeScriptIcon } from "@/components/language-icons"
import { JsonLd } from "@/components/json-ld"
import { ThemeToggle } from "@/components/theme-toggle"
import { faqPage, webApplication } from "@/lib/site"

const EXAMPLE_WORKBOOK = `{
  "@entity": "workbook",
  "name": "report_workbook",
  "sheets": [
    {
      "@entity": "sheet",
      "name": "report_sheet",
      "blocks": [
        {
          "@entity": "table",
          "name": "payment_table",
          "header": ["date", "amount"],
          "rows": [["2026-04-01", 1500], ["2026-04-02", null]]
        },
        {
          "@entity": "list",
          "name": "settings_list",
          "items": [{ "currency": "INR" }]
        }
      ]
    }
  ]
}`

const FAQS = [
  {
    question: "How do I store Excel spreadsheet data as sheet-json?",
    answer:
      "In sheet-json, a workbook holds sheets, each sheet holds table or list blocks, and a table has a header array and row arrays. Use the Sheet Tools Schema Builder to design this structure without writing JSON by hand.",
  },
  {
    question: "How do I view a sheet-json file as a spreadsheet?",
    answer:
      "Open your sheet-json workbook in the Sheet Visualizer. It shows each table or list as a spreadsheet grid, where you can edit cells and add rows.",
  },
  {
    question: "How do I validate sheet-json data against a sheet-json schema online?",
    answer:
      "Import the data and its schema into the Sheet Visualizer. It checks each cell and marks the values that do not match in red, with the error message. The check runs in your browser, so your data is not uploaded.",
  },
  {
    question: "How do I generate TypeScript classes from a sheet-json schema?",
    answer:
      "Run the schema-to-objects command from the @org-quicko/sheet-generator npm package. It creates TypeScript classes with decorators for workbooks, sheets, tables, rows and lists. It needs Node.js 20 or higher.",
  },
  {
    question: "How do I generate Java classes from a sheet-json schema with Maven?",
    answer:
      "Add the in.org.quicko.sheet:generator Maven plugin to your pom.xml, and set sourcePath to the schema and targetPackage to your package. It runs in the generate-sources phase and creates Java classes and Jackson mixins.",
  },
  {
    question: "Is Sheet Tools free?",
    answer:
      "Yes. Sheet Tools is free, needs no account and is open source under the GNU Affero General Public License v3.0 only (AGPL-3.0-only). Your workbooks stay in your browser. If you import from a URL, your browser fetches that URL directly.",
  },
]

const JSON_LD = [
  webApplication(
    "Sheet Tools",
    "",
    "Browser tools to build JSON Schemas for sheet-json workbooks, view workbook data as a spreadsheet, and generate TypeScript and Java classes.",
  ),
  faqPage(FAQS),
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <JsonLd data={JSON_LD} />
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span className="text-2xl font-bold text-foreground">Sheet Tools</span>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Link href="https://github.com/org-quicko/sheet-json" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            Utility Tools for Sheet-JSON
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Build, Visualize & Generate
            <span className="text-blue-600 dark:text-blue-400 block">Sheet-JSON Schemas</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Sheet JSON represents a workbook as JSON: a workbook contains sheets, and each sheet contains table or list
            blocks. Sheet Tools lets you build a JSON Schema for your workbook, view its data as a spreadsheet, and
            generate TypeScript or Java classes from it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sheet-schema-builder">
              <Button size="lg" className="w-full sm:w-auto">
                <Settings className="w-5 h-5 mr-2" />
                Schema Builder
              </Button>
            </Link>
            <Link href="/sheet-visualiser">
              <Button size="lg" className="w-full sm:w-auto">
                <Eye className="w-5 h-5 mr-2" />
                Sheet Visualizer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Overview */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">Design schemas, visualize data, and generate code for sheet-json</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Schema Builder Card */}
            <Card className="relative overflow-hidden border-2 hover:border-blue-200 hover:dark:border-blue-800 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/40 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">Sheet Schema Builder</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Design and build JSON schemas for your sheet structures with visual interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm">Create workbooks, sheets, and blocks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm">Define field types and validations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm">Export JSON Schema</span>
                  </div>
                </div>
                <Link href="/sheet-schema-builder" className="block">
                  <Button className="w-full mt-4">
                    Start Building
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Visualizer Card */}
            <Card className="relative overflow-hidden border-2 hover:border-green-200 hover:dark:border-green-800 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 dark:bg-green-900/40 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                    <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-xl">Sheet Visualizer</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Visualize your sheet data with an Excel-like interface for better data management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm">Excel-like interface</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm">Edit cells and add rows</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm">Schema-based validation</span>
                  </div>
                </div>
                <Link href="/sheet-visualiser" className="block">
                  <Button className="w-full mt-4">
                    Start Visualizing
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Generators Section */}
      <section id="generators" className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Language Generators</h2>
            <p className="text-lg text-muted-foreground">
              Convert your schemas into code for your favorite programming languages
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* TypeScript Generator */}
            <Card className="border-2 hover:border-blue-200 hover:dark:border-blue-800 transition-colors">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <TypeScriptIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">TypeScript Generator</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Generate TypeScript classes, with decorators, from your sheet JSON schemas
                </CardDescription>
                <Link
                  href="https://www.npmjs.com/package/@org-quicko/sheet-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  <code>@org-quicko/sheet-generator</code> on npm
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Zap className="w-4 h-4 mt-0.5 shrink-0 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm">Classes for workbooks, sheets, tables, rows and lists</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Terminal className="w-4 h-4 mt-0.5 shrink-0 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm">Run it as a CLI or from an npm script</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Database className="w-4 h-4 mt-0.5 shrink-0 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm">Requires Node.js 20 or higher</span>
                  </div>
                </div>
                <Link
                  href="https://github.com/org-quicko/sheet-json/tree/main/lib/nodejs/org-quicko-sheet-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full mt-4">
                    View on GitHub
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Java Generator */}
            <Card className="border-2 hover:border-orange-200 hover:dark:border-orange-800 transition-colors">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                    <JavaIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-xl">Java Generator</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Generate Java classes and Jackson mixins from your sheet JSON schemas
                </CardDescription>
                <Link
                  href="https://central.sonatype.com/artifact/in.org.quicko.sheet/generator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  <code>in.org.quicko.sheet:generator</code> on Maven Central
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Zap className="w-4 h-4 mt-0.5 shrink-0 text-orange-500 dark:text-orange-400" />
                    <span className="text-sm">Classes for workbooks, sheets, tables, rows and lists, plus Jackson mixins</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Terminal className="w-4 h-4 mt-0.5 shrink-0 text-orange-500 dark:text-orange-400" />
                    <span className="text-sm">Runs as a Maven plugin in the <code>generate-sources</code> phase</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Database className="w-4 h-4 mt-0.5 shrink-0 text-orange-500 dark:text-orange-400" />
                    <span className="text-sm">Set the schema path, target package and optional output directory</span>
                  </div>
                </div>
                <Link
                  href="https://github.com/org-quicko/sheet-json/tree/main/lib/java/org-quicko-sheet-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full mt-4">
                    View on GitHub
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Need another language?{" "}
            <Link
              href="https://github.com/org-quicko/sheet-json/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2"
            >
              Request a generator
            </Link>
          </p>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">A simple workflow to get you from schema to code</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Design Schema</h3>
              <p className="text-muted-foreground">
                Use the Schema Builder to create your sheet structure with fields, types, and validations
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Visualize Data</h3>
              <p className="text-muted-foreground">
                Import your data into the Sheet Visualizer to see and edit it in an Excel-like interface
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Generate Code</h3>
              <p className="text-muted-foreground">
                Export your schema and generate code in your preferred programming language
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Key Features</h2>
            <p className="text-lg text-muted-foreground">Built for developers, designed for productivity</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow bg-background">
              <Code className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
              <h3 className="font-semibold mb-2">Code Generation</h3>
              <p className="text-muted-foreground text-sm">Generate TypeScript and Java classes from your schemas</p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow bg-background">
              <Database className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
              <h3 className="font-semibold mb-2">JSON Schema Support</h3>
              <p className="text-muted-foreground text-sm">
                Export schemas as{" "}
                <Link
                  href="https://json-schema.org/draft-07"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
                >
                  JSON Schema draft-07
                </Link>{" "}
                and use them to validate cell values in the Sheet Visualizer
              </p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow bg-background">
              <FileSpreadsheet className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
              <h3 className="font-semibold mb-2">Excel-like Interface</h3>
              <p className="text-muted-foreground text-sm">Familiar spreadsheet interface for data visualization</p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow bg-background">
              <Layers className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-3" />
              <h3 className="font-semibold mb-2">Hierarchical Structure</h3>
              <p className="text-muted-foreground text-sm">Organize data in workbooks, sheets, and blocks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Example Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">What a Sheet-JSON Workbook Looks Like</h2>
            <p className="text-lg text-muted-foreground">
              A table has a header and rows. Each row value belongs to the column at the same index. Use{" "}
              <code>null</code> for an empty cell. A list holds key-value pairs.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-6 text-sm text-gray-100">
            <code>{EXAMPLE_WORKBOOK}</code>
          </pre>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group rounded-lg border bg-background">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg p-6 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-6 pb-6 text-muted-foreground text-sm">
                  {faq.answer.split(/(Sheet Visualizer|Schema Builder)/g).map((part, index) =>
                    part === "Sheet Visualizer" || part === "Schema Builder" ? (
                      <Link
                        key={index}
                        href={part === "Sheet Visualizer" ? "/sheet-visualiser" : "/sheet-schema-builder"}
                        className="text-primary underline underline-offset-4 hover:no-underline"
                      >
                        {part}
                      </Link>
                    ) : part,
                  )}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background px-4 py-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-x-6 gap-y-8 text-sm sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.5fr_1fr]">
            <div>
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <span className="text-lg font-bold text-foreground">Sheet Tools</span>
              </div>
              <p className="mt-3 text-muted-foreground">
                Browser tools to build, view and validate sheet-json workbooks, and to generate code from their schemas.
              </p>
            </div>
            <nav aria-label="Tools">
              <h2 className="font-semibold text-foreground">Tools</h2>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>
                  <Link href="/sheet-schema-builder" className="hover:text-foreground">
                    Schema Builder
                  </Link>
                </li>
                <li>
                  <Link href="/sheet-visualiser" className="hover:text-foreground">
                    Sheet Visualizer
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Code generators">
              <h2 className="font-semibold text-foreground">Code generators</h2>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>
                  <Link
                    href="https://www.npmjs.com/package/@org-quicko/sheet-generator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    TypeScript generator (npm)
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://central.sonatype.com/artifact/in.org.quicko.sheet/generator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    Java generator (Maven Central)
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/org-quicko/sheet-json/issues/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    Request a generator
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Resources">
              <h2 className="font-semibold text-foreground">Resources</h2>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>
                  <Link
                    href="https://github.com/org-quicko/sheet-json"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-foreground"
                  >
                    <Github className="h-4 w-4" />
                    GitHub repository
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/org-quicko/sheet-json/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    Report an issue
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://quicko.company/labs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    Labs@Quicko
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="mt-8 border-t pt-6 text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              Built with <Heart aria-label="love" role="img" className="h-3 w-3 fill-current" /> by
              <Link
                href="https://quicko.company/labs"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Labs@Quicko
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
