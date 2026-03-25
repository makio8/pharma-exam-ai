// scripts/lib/split-pages-core.ts

/** page-NNN.png のみを抽出（left/right/api/small を除外） */
export function parsePageFiles(files: string[]): string[] {
  return files.filter(f => /^page-\d+\.png$/.test(f)).sort()
}

/** ページIDリストを生成: page-001-left, page-001-right, ... */
export function generatePageIds(totalSpreads: number): string[] {
  const ids: string[] = []
  for (let i = 1; i <= totalSpreads; i++) {
    const num = String(i).padStart(3, '0')
    ids.push(`page-${num}-left`, `page-${num}-right`)
  }
  return ids
}
