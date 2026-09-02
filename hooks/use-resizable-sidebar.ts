"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const STORAGE_KEY = "sheet-schema-builder:sidebar-width"
const DEFAULT_WIDTH = 384 // matches the previous fixed w-96
const MIN_WIDTH = 260
const MAX_WIDTH = 640

function readStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH
  const stored = window.localStorage.getItem(STORAGE_KEY)
  const parsed = stored ? Number.parseInt(stored, 10) : Number.NaN
  if (Number.isNaN(parsed)) return DEFAULT_WIDTH
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed))
}

/**
 * Provides a drag-to-resize width for the sidebar, persisted across sessions
 * as a lightweight UI preference (not app data, so localStorage is fine here).
 */
export function useResizableSidebar() {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(DEFAULT_WIDTH)

  useEffect(() => {
    setWidth(readStoredWidth())
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const delta = e.clientX - startXRef.current
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta))
    setWidth(next)
  }, [])

  const handlePointerUp = useCallback(() => {
    setIsResizing(false)
    setWidth((current) => {
      window.localStorage.setItem(STORAGE_KEY, String(current))
      return current
    })
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }, [handlePointerMove])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      startXRef.current = e.clientX
      startWidthRef.current = width
      setIsResizing(true)
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    },
    [width, handlePointerMove, handlePointerUp],
  )

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  return {
    width,
    isResizing,
    handlePointerDown,
    resetWidth: () => {
      setWidth(DEFAULT_WIDTH)
      window.localStorage.setItem(STORAGE_KEY, String(DEFAULT_WIDTH))
    },
  }
}
