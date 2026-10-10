import type { Workbook } from "@/types/schema"
import { idbGet, idbGetAll, idbPut, idbDelete, WORKBOOKS_STORE, META_STORE } from "@/lib/indexeddb"

// Each workbook is persisted as its own IndexedDB record keyed by its
// *name*. This means importing/creating/editing one workbook can never
// clobber or corrupt the data of another workbook, and there's no single
// blob that can become corrupted for the whole app.
const META_KEY = "schema-meta"
const LEGACY_ZUSTAND_KEY = "schema-store"
const LEGACY_WORKBOOK_KEY_PREFIX = "sheet-tools:workbook:"
const LEGACY_META_KEY = "sheet-tools:schema-meta"

export interface SchemaMeta {
  activeWorkbookId: string | null
  activeSheetId: string | null
  activeBlockId: string | null
}

const EMPTY_META: SchemaMeta = { activeWorkbookId: null, activeSheetId: null, activeBlockId: null }

export async function saveWorkbookToStorage(workbook: Workbook, previousName?: string): Promise<void> {
  await idbPut(WORKBOOKS_STORE, workbook.name, workbook)
  if (previousName && previousName !== workbook.name) {
    await idbDelete(WORKBOOKS_STORE, previousName)
  }
}

export async function removeWorkbookFromStorage(name: string): Promise<void> {
  await idbDelete(WORKBOOKS_STORE, name)
}

export async function workbookNameExistsInStorage(name: string): Promise<boolean> {
  const existing = await idbGet<Workbook>(WORKBOOKS_STORE, name)
  return existing !== undefined
}

export async function loadWorkbooksFromStorage(): Promise<Workbook[]> {
  const workbooks = await idbGetAll<Workbook>(WORKBOOKS_STORE)
  return workbooks.filter((wb) => wb && wb.id && wb.name)
}

export async function saveMetaToStorage(meta: SchemaMeta): Promise<void> {
  await idbPut(META_STORE, META_KEY, meta)
}

export async function loadMetaFromStorage(): Promise<SchemaMeta> {
  const meta = await idbGet<SchemaMeta>(META_STORE, META_KEY)
  if (!meta) return EMPTY_META
  return {
    activeWorkbookId: meta.activeWorkbookId ?? null,
    activeSheetId: meta.activeSheetId ?? null,
    activeBlockId: meta.activeBlockId ?? null,
  }
}

/**
 * One-time migration into IndexedDB from whatever earlier storage scheme is
 * found in localStorage:
 *  - the original zustand `persist` blob under "schema-store", or
 *  - the short-lived per-name localStorage keys ("sheet-tools:workbook:*")
 * Existing users keep their data; both legacy keys are cleared afterward.
 */
export async function migrateLegacyStorageIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    const alreadyMigrated = (await idbGetAll<Workbook>(WORKBOOKS_STORE)).length > 0
    if (alreadyMigrated) {
      // Still clean up stray legacy keys even if IndexedDB already has data.
      clearLegacyLocalStorageKeys()
      return
    }

    const migratedWorkbooks: Workbook[] = []
    let migratedMeta: SchemaMeta | null = null

    // Legacy scheme 1: zustand persist blob.
    const legacyRaw = window.localStorage.getItem(LEGACY_ZUSTAND_KEY)
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw)
        const legacyWorkbooks: Workbook[] = legacy?.state?.workbooks ?? []
        migratedWorkbooks.push(...legacyWorkbooks)
        migratedMeta = {
          activeWorkbookId: legacy?.state?.activeWorkbookId ?? null,
          activeSheetId: legacy?.state?.activeSheetId ?? null,
          activeBlockId: legacy?.state?.activeBlockId ?? null,
        }
      } catch (error) {
        console.error("[v0] Failed to parse legacy zustand schema store:", error)
      }
    }

    // Legacy scheme 2: per-name localStorage keys.
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (!key || !key.startsWith(LEGACY_WORKBOOK_KEY_PREFIX)) continue
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      try {
        const workbook = JSON.parse(raw) as Workbook
        if (workbook?.id && workbook?.name) {
          migratedWorkbooks.push(workbook)
        }
      } catch (error) {
        console.error(`[v0] Failed to parse legacy workbook at "${key}":`, error)
      }
    }

    if (!migratedMeta) {
      const legacyMetaRaw = window.localStorage.getItem(LEGACY_META_KEY)
      if (legacyMetaRaw) {
        try {
          migratedMeta = JSON.parse(legacyMetaRaw)
        } catch (error) {
          console.error("[v0] Failed to parse legacy schema meta:", error)
        }
      }
    }

    const seenNames = new Set<string>()
    for (const workbook of migratedWorkbooks) {
      if (seenNames.has(workbook.name)) continue
      seenNames.add(workbook.name)
      await saveWorkbookToStorage(workbook)
    }

    if (migratedMeta) {
      await saveMetaToStorage(migratedMeta)
    }

    clearLegacyLocalStorageKeys()
  } catch (error) {
    console.error("[v0] Failed to migrate legacy schema store:", error)
  }
}

function clearLegacyLocalStorageKeys(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(LEGACY_ZUSTAND_KEY)
    window.localStorage.removeItem(LEGACY_META_KEY)
    const staleKeys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(LEGACY_WORKBOOK_KEY_PREFIX)) {
        staleKeys.push(key)
      }
    }
    staleKeys.forEach((key) => window.localStorage.removeItem(key))
  } catch (error) {
    console.error("[v0] Failed to clear legacy localStorage keys:", error)
  }
}
