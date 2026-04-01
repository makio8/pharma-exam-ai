#!/usr/bin/env npx tsx
/**
 * 再抽出パイプライン CLI ランナー
 *
 * 年度単位で以下を順次実行:
 * 1. PDF再抽出 (re-extract-from-pdf.ts)
 * 2. 選択的適用 (apply-re-extraction.ts)  ※--apply 指定時のみ
 *
 * Usage:
 *   npx tsx scripts/run-extraction-pipeline.ts --year 100          # 第100回のみ、抽出のみ
 *   npx tsx scripts/run-extraction-pipeline.ts --year 100 --apply  # 抽出＋適用
 *   npx tsx scripts/run-extraction-pipeline.ts --year 101-111      # 101-111回を一括抽出
 *   npx tsx scripts/run-extraction-pipeline.ts --year 101-111 --apply  # 抽出＋適用
 *   npx tsx scripts/run-extraction-pipeline.ts --year 100 --evaluate /path/to/corrections.json
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

const args = process.argv.slice(2)
const yearArg = args.find((_, i) => args[i - 1] === '--year') || '100'
const doApply = args.includes('--apply')
const evaluatePath = args.find((_, i) => args[i - 1] === '--evaluate')
const dryRun = args.includes('--dry-run')

function parseYears(arg: string): number[] {
  if (arg.includes('-')) {
    const [start, end] = arg.split('-').map(Number)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }
  return [Number(arg)]
}

const years = parseYears(yearArg)

function run(cmd: string) {
  console.log(`\n$ ${cmd}`)
  try {
    execSync(cmd, { cwd: PROJECT_ROOT, stdio: 'inherit', timeout: 120000 })
  } catch (e: any) {
    console.error(`Command failed: ${cmd}`)
    process.exit(1)
  }
}

console.log('═'.repeat(60))
console.log('  薬剤師国試 PDF再抽出パイプライン')
console.log('═'.repeat(60))
console.log(`  対象年度: ${years.join(', ')}`)
console.log(`  適用: ${doApply ? 'YES' : 'NO (抽出のみ)'}`)
console.log(`  評価: ${evaluatePath || 'なし'}`)
console.log(`  Dry run: ${dryRun}`)
console.log('═'.repeat(60))

for (const year of years) {
  console.log(`\n${'─'.repeat(40)}`)
  console.log(`  第${year}回`)
  console.log('─'.repeat(40))

  // Check ALL 6 PDF files exist before proceeding
  const pdfDir = path.join(PROJECT_ROOT, 'data', 'pdfs')
  const requiredPdfs = [
    `q${year}-hissu.pdf`,
    `q${year}-riron1.pdf`, `q${year}-riron2.pdf`,
    `q${year}-jissen1.pdf`, `q${year}-jissen2.pdf`, `q${year}-jissen3.pdf`,
  ]
  const missingPdfs = requiredPdfs.filter(f => !existsSync(path.join(pdfDir, f)))
  if (missingPdfs.length > 0) {
    console.error(`  ERROR: ${missingPdfs.length} PDF(s) missing for year ${year}:`)
    missingPdfs.forEach(f => console.error(`    - ${f}`))
    console.error(`  SKIP year ${year} (all 6 PDFs required)`)
    continue
  }

  // Step 1: Re-extract from PDF
  const dryRunFlag = dryRun ? ' --dry-run' : ''
  run(`npx tsx scripts/re-extract-from-pdf.ts --year ${year}${dryRunFlag}`)

  // Step 2: Apply (if requested)
  if (doApply && !dryRun) {
    // Backup with timestamp (allows multiple runs without data loss)
    const tsPath = `src/data/real-questions/exam-${year}.ts`
    if (existsSync(path.join(PROJECT_ROOT, tsPath))) {
      const timestamp = new Date().toISOString().slice(0, 10)
      const bakPath = `${tsPath}.bak`
      const bakTimestamp = `${tsPath}.bak.${timestamp}`
      // Timestamped backup every run; .bak = original pre-pipeline snapshot
      run(`cp ${tsPath} ${bakTimestamp}`)
      if (!existsSync(path.join(PROJECT_ROOT, bakPath))) {
        run(`cp ${tsPath} ${bakPath}`)
      }
      run(`npx tsx scripts/apply-re-extraction.ts --year ${year}`)
    } else {
      console.log(`  SKIP apply: ${tsPath} が見つかりません`)
    }
  }
}

// Step 3: Evaluate (if corrections file provided)
if (evaluatePath && existsSync(evaluatePath)) {
  console.log('\n' + '─'.repeat(40))
  console.log('  評価')
  console.log('─'.repeat(40))
  run(`npx tsx scripts/evaluate-post-apply.ts --corrections ${evaluatePath}`)
}

console.log('\n' + '═'.repeat(60))
console.log('  完了')
console.log('═'.repeat(60))

if (!doApply) {
  console.log('\n抽出結果は reports/re-extracted-{year}.json に保存されました。')
  console.log('適用するには --apply フラグを追加してください。')
}
