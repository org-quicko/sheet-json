"use client"

import {
  ArrowRight,
  Code,
  Eye,
  Github,
  Layers,
  Zap,
  FileSpreadsheet,
  Settings,
  Database,
  Download,
  Terminal,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Sheet Tools</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="https://github.com/org-quicko/sheet-js" target="_blank" rel="noopener noreferrer">
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
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Build, Visualize & Generate
            <span className="text-blue-600 block">Sheet Objects</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A comprehensive suite of tools for working with sheet-json. Create schemas, visualize data, and generate
            objects with ease.
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
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Three Powerful Tools</h2>
            <p className="text-lg text-gray-600">Everything you need to work with sheet-json efficiently</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Schema Builder Card */}
            <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="w-6 h-6 text-blue-600" />
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
                    <Layers className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Create workbooks, sheets, and blocks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Define field types and validations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4 text-blue-500" />
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
            <Card className="relative overflow-hidden border-2 hover:border-green-200 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Eye className="w-6 h-6 text-green-600" />
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
                    <FileSpreadsheet className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Excel-like interface</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Interactive data visualization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-green-500" />
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

            {/* Generators Card */}
            <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Terminal className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Code Generators</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Generate code from your schemas in multiple programming languages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Language-specific code generation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Easy integration with your projects</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Github className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Open source and extensible</span>
                  </div>
                </div>
                <Link
                  href="https://github.com/org-quicko/sheet-generator-js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full mt-4">
                    Explore Generators
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Generators Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Language Generators</h2>
            <p className="text-lg text-gray-600">
              Convert your schemas into code for your favorite programming languages
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {/* TypeScript Generator */}
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Code className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">TypeScript Generator</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Generate type-safe TypeScript interfaces from your sheet schemas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Type-safe interfaces</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Full schema support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Github className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Available now</span>
                  </div>
                </div>
                <Link
                  href="https://github.com/org-quicko/sheet-generator-js"
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

            {/* Coming Soon: Other Languages */}
            <Card className="border-2 hover:border-purple-200 transition-colors bg-white/80">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Code className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">More Languages</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Support for additional programming languages coming soon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Java, C#, Go, and more</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Language-specific features</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Github className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Community contributions welcome</span>
                  </div>
                </div>
                <div className="w-full mt-4">
                  <Badge variant="outline" className="w-full py-2 justify-center">
                    Coming Soon
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">A simple workflow to get you from schema to code</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Design Schema</h3>
              <p className="text-gray-600">
                Use the Schema Builder to create your sheet structure with fields, types, and validations
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Visualize Data</h3>
              <p className="text-gray-600">
                Import your data into the Sheet Visualizer to see and edit it in an Excel-like interface
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Generate Code</h3>
              <p className="text-gray-600">
                Export your schema and generate code in your preferred programming language
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-lg text-gray-600">Built for developers, designed for productivity</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow bg-white">
              <Code className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-2">Code Generation</h3>
              <p className="text-gray-600 text-sm">Generate code in multiple programming languages from your schemas</p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow bg-white">
              <Database className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold mb-2">JSON Schema Support</h3>
              <p className="text-gray-600 text-sm">Full JSON Schema compliance with validation</p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow bg-white">
              <FileSpreadsheet className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold mb-2">Excel-like Interface</h3>
              <p className="text-gray-600 text-sm">Familiar spreadsheet interface for data visualization</p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow bg-white">
              <Layers className="w-8 h-8 text-orange-600 mb-3" />
              <h3 className="font-semibold mb-2">Hierarchical Structure</h3>
              <p className="text-gray-600 text-sm">Organize data in workbooks, sheets, and blocks</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">Choose your tool and start building better sheet structures today</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sheet-schema-builder">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <Settings className="w-5 h-5 mr-2" />
                Schema Builder
              </Button>
            </Link>
            <Link href="/sheet-visualiser">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <Eye className="w-5 h-5 mr-2" />
                Sheet Visualizer
              </Button>
            </Link>
            <Link href="https://github.com/org-quicko/sheet-generator-js" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <Terminal className="w-5 h-5 mr-2" />
                Code Generators
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border-t border-gray-700">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Left: Branding */}
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-7 h-7 text-blue-400" />
                <span className="text-xl font-bold">Sheet Tools</span>
              </div>
              <p className="text-sm text-gray-400">Powerful utilities for sheet-json</p>
            </div>

            {/* Center: Built with love */}
            <div className="flex items-center justify-center">
              <div className="flex items-center text-sm text-gray-300 bg-gray-800/50 px-4 py-2">
                <span className="flex items-center">
                  Built with
                  <Heart className="mx-1.5 h-4 w-4 text-gray-300 fill-gray-300" />
                  by
                </span>
                <Link
                  href="https://quicko.company/labs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 font-medium text-gray-300 underline decoration-gray-300"
                >
                  Labs@Quicko
                </Link>
              </div>
            </div>

            {/* Right: Links and Info */}
            <div className="flex flex-col items-end space-y-3">
              <Link
                href="https://github.com/org-quicko/sheet-js"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 hover:text-blue-400 transition-colors group"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">View on GitHub</span>
              </Link>
              <span className="text-xs text-gray-400">Part of the sheet-json ecosystem</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
