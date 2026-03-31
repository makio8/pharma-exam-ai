import { describe, it, expect } from 'vitest'
import type { StructureEntry, StructuralFormulaRegistry } from '../structural-registry-types'

// ---------------------------------------------------------------------------
// Validation functions (exported for reuse in pipeline scripts)
// ---------------------------------------------------------------------------

export function validateEntry(entry: StructureEntry): string[] {
  const errors: string[] = []

  if (!entry.id.startsWith('struct-')) {
    errors.push(`id must start with "struct-": got "${entry.id}"`)
  }

  if (!entry.name_ja || entry.name_ja.trim() === '') {
    errors.push(`name_ja is required`)
  }

  if (!entry.name_en || entry.name_en.trim() === '') {
    errors.push(`name_en is required`)
  }

  if (!entry.scaffold || entry.scaffold.trim() === '') {
    errors.push(`scaffold is required`)
  }

  if (!Array.isArray(entry.subjects) || entry.subjects.length === 0) {
    errors.push(`subjects must be a non-empty array`)
  }

  if (!Array.isArray(entry.functional_groups)) {
    errors.push(`functional_groups must be an array`)
  }

  if (entry.priority < 1 || entry.priority > 5) {
    errors.push(`priority must be between 1 and 5: got ${entry.priority}`)
  }

  return errors
}

export function validateRegistry(registry: StructuralFormulaRegistry): string[] {
  const errors: string[] = []

  // Check for duplicate ids
  const ids = registry.entries.map((e) => e.id)
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) {
      errors.push(`duplicate id: "${id}"`)
    }
    seen.add(id)
  }

  // Validate each entry
  for (const entry of registry.entries) {
    const entryErrors = validateEntry(entry)
    for (const err of entryErrors) {
      errors.push(`[${entry.id}] ${err}`)
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeValidEntry(overrides: Partial<StructureEntry> = {}): StructureEntry {
  return {
    id: 'struct-thiamine',
    name_ja: 'チアミン',
    name_en: 'Thiamine',
    pubchem_cid: 1130,
    smiles: 'CCc1ncc(C[n+]2csc(CCO)c2C)c(N)n1',
    scaffold: 'thiazole',
    functional_groups: ['thiazole', 'pyrimidine', 'amino'],
    category: 'vitamin',
    priority: 1,
    subjects: ['衛生'],
    ...overrides,
  }
}

function makeValidRegistry(entries: StructureEntry[] = []): StructuralFormulaRegistry {
  return {
    version: '1.0.0',
    generated_at: '2026-03-31T00:00:00Z',
    entries,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateEntry', () => {
  it('有効なエントリはエラーなしで通過する', () => {
    const errors = validateEntry(makeValidEntry())
    expect(errors).toHaveLength(0)
  })

  it('id が struct- で始まらない場合はエラー', () => {
    const errors = validateEntry(makeValidEntry({ id: 'thiamine' }))
    expect(errors.some((e) => e.includes('must start with "struct-"'))).toBe(true)
  })

  it('subjects が空配列の場合はエラー', () => {
    const errors = validateEntry(makeValidEntry({ subjects: [] }))
    expect(errors.some((e) => e.includes('subjects must be a non-empty array'))).toBe(true)
  })

  it('name_ja が空文字の場合はエラー', () => {
    const errors = validateEntry(makeValidEntry({ name_ja: '' }))
    expect(errors.some((e) => e.includes('name_ja is required'))).toBe(true)
  })

  it('name_en が空文字の場合はエラー', () => {
    const errors = validateEntry(makeValidEntry({ name_en: '' }))
    expect(errors.some((e) => e.includes('name_en is required'))).toBe(true)
  })

  it('scaffold が空文字の場合はエラー', () => {
    const errors = validateEntry(makeValidEntry({ scaffold: '' }))
    expect(errors.some((e) => e.includes('scaffold is required'))).toBe(true)
  })

  it('priority が範囲外の場合はエラー', () => {
    // @ts-expect-error: intentionally invalid value for test
    const errors = validateEntry(makeValidEntry({ priority: 6 }))
    expect(errors.some((e) => e.includes('priority must be between 1 and 5'))).toBe(true)
  })

  it('pubchem_cid が null でも有効', () => {
    const errors = validateEntry(makeValidEntry({ pubchem_cid: null }))
    expect(errors).toHaveLength(0)
  })

  it('smiles が null でも有効', () => {
    const errors = validateEntry(makeValidEntry({ smiles: null }))
    expect(errors).toHaveLength(0)
  })

  it('representative_of は optional — 指定なしでも有効', () => {
    const entry = makeValidEntry()
    delete entry.representative_of
    const errors = validateEntry(entry)
    expect(errors).toHaveLength(0)
  })
})

describe('validateRegistry', () => {
  it('有効なレジストリはエラーなし', () => {
    const registry = makeValidRegistry([
      makeValidEntry({ id: 'struct-thiamine' }),
      makeValidEntry({ id: 'struct-riboflavin', name_ja: 'リボフラビン', name_en: 'Riboflavin' }),
    ])
    const errors = validateRegistry(registry)
    expect(errors).toHaveLength(0)
  })

  it('重複 id が検出される', () => {
    const registry = makeValidRegistry([
      makeValidEntry({ id: 'struct-thiamine' }),
      makeValidEntry({ id: 'struct-thiamine' }),
    ])
    const errors = validateRegistry(registry)
    expect(errors.some((e) => e.includes('duplicate id'))).toBe(true)
  })

  it('個別エントリのエラーがレジストリレベルで報告される', () => {
    const registry = makeValidRegistry([
      makeValidEntry({ id: 'bad-id' }),
    ])
    const errors = validateRegistry(registry)
    expect(errors.some((e) => e.includes('[bad-id]'))).toBe(true)
    expect(errors.some((e) => e.includes('must start with "struct-"'))).toBe(true)
  })

  it('空のレジストリはエラーなし', () => {
    const registry = makeValidRegistry([])
    const errors = validateRegistry(registry)
    expect(errors).toHaveLength(0)
  })

  it('複数エントリで複数エラーがまとめて報告される', () => {
    const registry = makeValidRegistry([
      makeValidEntry({ id: 'bad-id-1', subjects: [] }),
      makeValidEntry({ id: 'bad-id-2', name_ja: '' }),
    ])
    const errors = validateRegistry(registry)
    // Each bad entry should generate its own errors
    expect(errors.length).toBeGreaterThanOrEqual(2)
  })
})
