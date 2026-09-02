import type { Workbook } from "@/types/schema"

// Each workbook is persisted under its own localStorage key (namespaced by its
// name) instead of one shared blob. This means importing/creating/editing one
// workbook can never clobber or corrupt the data of another workbook.
const WORKBOOK_KEY_PREFIX = "sheet-tools:workbook:"
const META_KEY = "sheet-tools:schema-meta"
const LEGACY_KEY = "schema-store"

export interface SchemaMeta {
  activeWorkbookId: string | null
  activeSheetId: string | null
  activeBlockId: string | null
}

export function getWorkbookStorageKey(name: string): string {
  return `${WORKBOOK_KEY_PREFIX}${encodeURIComponent(name)}`
}

export function saveWorkbookToStorage(workbook: Workbook): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(getWorkbookStorageKey(workbook.name), JSON.stringify(workbook))
  } catch (error) {
    console.error("[v0] Failed to save workbook to storage:", error)
  }
}

export function removeWorkbookFromStorage(name: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(getWorkbookStorageKey(name))
  } catch (error) {
    console.error("[v0] Failed to remove workbook from storage:", error)
  }
}

export function workbookNameExistsInStorage(name: string): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(getWorkbookStorageKey(name)) !== null
}

export function loadWorkbooksFromStorage(): Workbook[] {
  if (typeof window === "undefined") return []
  const workbooks: Workbook[] = []
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (!key || !key.startsWith(WORKBOOK_KEY_PREFIX)) continue

      const raw = window.localStorage.getItem(key)
      if (!raw) continue

      try {
        const workbook = JSON.parse(raw) as Workbook
        if (workbook && workbook.id && workbook.name) {
          workbooks.push(workbook)
        }
      } catch (parseError) {
        console.error(`[v0] Failed to parse workbook stored at "${key}":`, parseError)
      }
    }
  } catch (error) {
    console.error("[v0] Failed to load workbooks from storage:", error)
  }
  return workbooks
}

export function saveMetaToStorage(meta: SchemaMeta): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch (error) {
    console.error("[v0] Failed to save schema meta to storage:", error)
  }
}

export function loadMetaFromStorage(): SchemaMeta {
  const empty: SchemaMeta = { activeWorkbookId: null, activeSheetId: null, activeBlockId: null }
  if (typeof window === "undefined") return empty
  try {
    const raw = window.localStorage.getItem(META_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw)
    return {
      activeWorkbookId: parsed.activeWorkbookId ?? null,
      activeSheetId: parsed.activeSheetId ?? null,
      activeBlockId: parsed.activeBlockId ?? null,
    }
  } catch (error) {
    console.error("[v0] Failed to load schema meta from storage:", error)
    return empty
  }
}

/**
 * One-time migration from the old single-key zustand `persist` blob
 * ("schema-store") to the new per-workbook keys, so existing users don't
 * lose their data when this storage scheme changes.
 */
export function migrateLegacyStorageIfNeeded(): void {
  if (typeof window === "undefined") return
  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_KEY)
    if (!legacyRaw) return

    const legacy = JSON.parse(legacyRaw)
    const legacyWorkbooks: Workbook[] = legacy?.state?.workbooks ?? []

    legacyWorkbooks.forEach((workbook) => {
      if (workbook?.name && !workbookNameExistsInStorage(workbook.name)) {
        saveWorkbookToStorage(workbook)
      }
    })

    if (!window.localStorage.getItem(META_KEY)) {
      saveMetaToStorage({
        activeWorkbookId: legacy?.state?.activeWorkbookId ?? null,
        activeSheetId: legacy?.state?.activeSheetId ?? null,
        activeBlockId: legacy?.state?.activeBlockId ?? null,
      })
    }

    window.localStorage.removeItem(LEGACY_KEY)
  } catch (error) {
    console.error("[v0] Failed to migrate legacy schema store:", error)
  }
}
