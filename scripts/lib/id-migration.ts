/**
 * on-NNN → fusen-NNNN ID対応表（ID移行ユーティリティ）
 *
 * official-notes.ts の on-NNN（23件）を fusens-master.json の fusen-NNNN に
 * imageFile パスの一致で紐付けた対応表。
 *
 * 生成方法: official-notes の imageUrl から `/images/fusens/` を除去 →
 *           fusens-master の imageFile と照合
 */

/**
 * on-NNN → fusen-NNNN の対応表（imageFile パスマッチで確定）
 *
 * 全23件が 1:1 で対応。on-001〜on-008 は page-001-left、
 * on-009〜on-014 は page-001-right、on-015〜on-023 は page-002-left。
 */
export const ON_TO_FUSEN_MAP: Record<string, string> = {
  'on-001': 'fusen-0001',
  'on-002': 'fusen-0002',
  'on-003': 'fusen-0003',
  'on-004': 'fusen-0004',
  'on-005': 'fusen-0005',
  'on-006': 'fusen-0006',
  'on-007': 'fusen-0007',
  'on-008': 'fusen-0008',
  'on-009': 'fusen-0009',
  'on-010': 'fusen-0010',
  'on-011': 'fusen-0011',
  'on-012': 'fusen-0012',
  'on-013': 'fusen-0013',
  'on-014': 'fusen-0014',
  'on-015': 'fusen-0015',
  'on-016': 'fusen-0016',
  'on-017': 'fusen-0017',
  'on-018': 'fusen-0018',
  'on-019': 'fusen-0019',
  'on-020': 'fusen-0020',
  'on-021': 'fusen-0021',
  'on-022': 'fusen-0022',
  'on-023': 'fusen-0023',
}

/** fusen-NNNN → on-NNN の逆引き表（自動生成） */
export const FUSEN_TO_ON_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ON_TO_FUSEN_MAP).map(([onId, fusenId]) => [fusenId, onId])
)

/**
 * on-NNN を fusen-NNNN に変換する。
 * 対応表に無いIDはそのまま返す（fusen-NNNN 形式は変換不要）。
 */
export function onIdToFusenId(id: string): string {
  return ON_TO_FUSEN_MAP[id] ?? id
}

/**
 * fusen-NNNN を on-NNN に逆変換する。
 * 対応表に無いIDはそのまま返す（on-NNN 形式は変換不要）。
 */
export function fusenIdToOnId(id: string): string {
  return FUSEN_TO_ON_MAP[id] ?? id
}
