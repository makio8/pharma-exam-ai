import type { NoteExemplarMatch, MatchStatus } from '../../../types/note-exemplar-mapping'
import type { AddedMatch } from '../types'

/**
 * Single source of truth: merge original + added + overrides into effective matches.
 * All display, operations, and export use this function's result.
 *
 * Order of application:
 * 1. Copy originalMatches
 * 2. Convert addedMatches with noteId: prefix to NoteExemplarMatch and append
 * 3. Dedupe by exemplarId (original wins)
 * 4. Filter out exemplarIds not in validExemplarIds (stale protection)
 * 5. Apply matchStatuses / primaryOverrides overrides
 * 6. Normalize to at most 1 Primary (first one wins)
 */
export function getEffectiveMatches(
  originalMatches: NoteExemplarMatch[],
  addedMatches: Record<string, AddedMatch>,
  matchStatuses: Record<string, MatchStatus>,
  primaryOverrides: Record<string, boolean>,
  noteId: string,
  validExemplarIds: Set<string>,
): NoteExemplarMatch[] {
  // Step 1: copy originals (dedupe within original — first wins)
  const merged: NoteExemplarMatch[] = []
  const seenIds = new Set<string>()
  for (const m of originalMatches) {
    if (seenIds.has(m.exemplarId)) continue
    seenIds.add(m.exemplarId)
    merged.push({ ...m })
  }

  // Step 2: convert addedMatches with noteId: prefix
  const prefix = `${noteId}:`
  for (const [key, added] of Object.entries(addedMatches)) {
    if (!key.startsWith(prefix)) continue
    const exemplarId = key.slice(prefix.length)
    // Step 3: dedupe — skip if already in original
    if (seenIds.has(exemplarId)) continue
    seenIds.add(exemplarId)
    merged.push({
      exemplarId,
      isPrimary: added.isPrimary,
      confidence: 0,
      reasoning: '手動追加',
      status: 'pending',
    })
  }

  // Step 4: filter stale
  const filtered = merged.filter(m => validExemplarIds.has(m.exemplarId))

  // Step 5: apply overrides
  for (const m of filtered) {
    const key = `${noteId}:${m.exemplarId}`
    if (key in matchStatuses) {
      m.status = matchStatuses[key]
    }
    if (key in primaryOverrides) {
      m.isPrimary = primaryOverrides[key]
    }
  }

  // Step 6: normalize Primary (first one wins)
  let foundPrimary = false
  for (const m of filtered) {
    if (m.isPrimary) {
      if (foundPrimary) {
        m.isPrimary = false
      } else {
        foundPrimary = true
      }
    }
  }

  return filtered
}
