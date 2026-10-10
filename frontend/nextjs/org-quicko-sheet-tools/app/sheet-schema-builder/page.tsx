"use client"

import { SchemaBuilderProvider } from "@/hooks/useSchemaBuilder"
import { Sidebar } from "@/components/sidebar"
import { MainContent } from "@/components/main-content"
import { OverwriteWorkbookDialog } from "@/components/overwrite-workbook-dialog"
import { FileSpreadsheet } from 'lucide-react'
import Link from "next/link"
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from "react"
import { importSchemaFromUrl, WorkbookNameConflictError } from "@/lib/import-schema"
import { useSchemaStore } from "@/store/schema-store"

function App() {
  const searchParams = useSearchParams()
  const isHydrated = useSchemaStore((state) => state.isHydrated)
  const hydrate = useSchemaStore((state) => state.hydrate)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [conflictWorkbookName, setConflictWorkbookName] = useState<string | null>(null)
  const [pendingSchemaUrl, setPendingSchemaUrl] = useState<string | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const clearSchemaUrlParam = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete("schema_url")
    window.history.replaceState({}, "", url.toString())
  }

  const runImport = (schemaUrl: string, overwrite = false) => {
    setIsImporting(true)
    setImportError(null)

    importSchemaFromUrl(schemaUrl, { overwrite })
      .then(() => {
        console.log("[v0] Successfully imported schema from URL:", schemaUrl)
        clearSchemaUrlParam()
      })
      .catch((error) => {
        if (error instanceof WorkbookNameConflictError) {
          setPendingSchemaUrl(schemaUrl)
          setConflictWorkbookName(error.workbookName)
          return
        }
        console.error("[v0] Failed to import schema from URL:", error)
        setImportError(error instanceof Error ? error.message : "Failed to import schema")
        clearSchemaUrlParam()
      })
      .finally(() => {
        setIsImporting(false)
      })
  }

  useEffect(() => {
    const schemaUrl = searchParams.get("schema_url")

    if (schemaUrl && isHydrated && !isImporting && !pendingSchemaUrl) {
      runImport(schemaUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isHydrated, isImporting, pendingSchemaUrl])

  const handleConfirmOverwrite = () => {
    const schemaUrl = pendingSchemaUrl
    setPendingSchemaUrl(null)
    setConflictWorkbookName(null)
    if (schemaUrl) {
      runImport(schemaUrl, true)
    }
  }

  const handleCancelOverwrite = () => {
    setPendingSchemaUrl(null)
    setConflictWorkbookName(null)
    clearSchemaUrlParam()
  }

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <SchemaBuilderProvider>
      <div className="flex h-screen bg-white overflow-hidden">
        <OverwriteWorkbookDialog
          open={pendingSchemaUrl !== null && conflictWorkbookName !== null}
          workbookName={conflictWorkbookName ?? ""}
          onConfirm={handleConfirmOverwrite}
          onCancel={handleCancelOverwrite}
        />

        {isImporting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg p-8 mx-4 max-w-sm w-full">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Importing Schema</h3>
                  <p className="text-sm text-gray-600 mt-1">Loading workbook from URL...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {importError && (
          <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Import Failed</h3>
                <p className="text-sm text-red-700 mt-1">{importError}</p>
              </div>
              <button
                onClick={() => setImportError(null)}
                className="flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

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
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <App />
    </Suspense>
  )
}
