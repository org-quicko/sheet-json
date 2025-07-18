"use client"

import { SchemaBuilderProvider } from "@/hooks/useSchemaBuilder"
import { Sidebar } from "@/components/sidebar"
import { MainContent } from "@/components/main-content"
import { FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function App() {
  return (
    <SchemaBuilderProvider>
      <div className="flex h-screen bg-white overflow-hidden">
        {/* Header */}
        <div className="flex flex-col w-full">
          <header className="bg-white border-b">
            <div className="mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Link href="/" className="flex items-center space-x-2 hover:opacity-80">
                    <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                    <span className="text-lg font-semibold text-gray-900">Sheet tools</span>
                  </Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">Sheet Schema Builder</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 min-h-0">
            <div className="flex-shrink-0">
              <Sidebar />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <MainContent />
            </div>
          </div>
        </div>
      </div>
    </SchemaBuilderProvider>
  )
}

export default function SchemaBuilderPage() {
  return <App />
}
