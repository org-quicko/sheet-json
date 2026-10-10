// Minimal promise-based wrapper around the native IndexedDB API.
// No external dependency required.

const DB_NAME = "sheet-tools-db"
const DB_VERSION = 1

export const WORKBOOKS_STORE = "workbooks"
export const META_STORE = "meta"

let dbPromise: Promise<IDBDatabase | null> | null = null

function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined"
}

export function openDatabase(): Promise<IDBDatabase | null> {
  if (!isIndexedDBAvailable()) {
    return Promise.resolve(null)
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(WORKBOOKS_STORE)) {
          db.createObjectStore(WORKBOOKS_STORE)
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE)
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    }).catch((error): IDBDatabase | null => {
      console.error("[v0] Failed to open IndexedDB:", error)
      return null
    })
  }

  return dbPromise
}

export async function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDatabase()
  if (!db) return undefined

  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  }).catch((error): T | undefined => {
    console.error(`[v0] Failed to read "${key}" from "${storeName}":`, error)
    return undefined
  })
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase()
  if (!db) return []

  return new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve((request.result as T[]) ?? [])
    request.onerror = () => reject(request.error)
  }).catch((error): T[] => {
    console.error(`[v0] Failed to read all from "${storeName}":`, error)
    return []
  })
}

export async function idbPut<T>(storeName: string, key: string, value: T): Promise<void> {
  const db = await openDatabase()
  if (!db) return

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)
    const request = store.put(value, key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  }).catch((error): void => {
    console.error(`[v0] Failed to write "${key}" to "${storeName}":`, error)
  })
}

export async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDatabase()
  if (!db) return

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)
    const request = store.delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  }).catch((error): void => {
    console.error(`[v0] Failed to delete "${key}" from "${storeName}":`, error)
  })
}
