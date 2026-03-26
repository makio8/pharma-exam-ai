import type { Correction, CropTarget } from '../types'

/** 同じ type+field/target の correction を置換する（なければ追加） */
export function replaceCorrections(
  existing: Correction[],
  newCorrections: Correction[],
): Correction[] {
  const result = [...existing]
  for (const nc of newCorrections) {
    const idx = result.findIndex(c => isSameKind(c, nc))
    if (idx >= 0) {
      result[idx] = nc
    } else {
      result.push(nc)
    }
  }
  return result
}

/** 指定 type+target の correction を除去 */
export function removeCorrection(
  existing: Correction[],
  type: string,
  target?: CropTarget,
): Correction[] {
  return existing.filter(c => {
    if (c.type !== type) return true
    if (target && 'target' in c && c.target !== target) return true
    return false
  })
}

function isSameKind(a: Correction, b: Correction): boolean {
  if (a.type !== b.type) return false
  if (a.type === 'text' && b.type === 'text') return a.field === b.field
  if (a.type === 'multi-image-crop' && b.type === 'multi-image-crop') return a.target === b.target
  return true
}

/** 既存 corrections から特定フィールドのテキスト修正値を取得（なければ元値） */
export function getEffectiveText(
  corrections: Correction[],
  field: string,
  originalValue: string,
): string {
  const found = corrections.find(c => c.type === 'text' && c.field === field)
  return found?.type === 'text' ? found.value : originalValue
}
