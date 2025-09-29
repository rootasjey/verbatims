/** In-memory store for unresolved rows during admin imports/relink steps */

const unresolvedStore = new Map<string, Record<string, any[]>>()

export function addUnresolvedRow(importId: string, key: string, row: any) {
  const bucket = unresolvedStore.get(importId) || {}
  const arr = bucket[key] || []
  arr.push(row)
  bucket[key] = arr
  unresolvedStore.set(importId, bucket)
}

export function getUnresolved(importId: string): Record<string, any[]> {
  return unresolvedStore.get(importId) || {}
}

export function clearUnresolved(importId: string) {
  unresolvedStore.delete(importId)
}
