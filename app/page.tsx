"use client"

import { Sidebar } from "@/components/sidebar"
import { MainContent } from "@/components/main-content"

function App() {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <MainContent />
      </div>
    </div>
  )
}

export default function Page() {
  return <App />
}
