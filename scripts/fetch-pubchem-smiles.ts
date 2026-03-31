/**
 * PubChem SMILES一括取得
 * Usage: npx tsx scripts/fetch-pubchem-smiles.ts [--force] [--dry-run] [--id struct-caffeine]
 * Rate limit: 250ms between requests (PubChem recommends max 5 req/sec)
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { fetchSmiles, sleep } from './lib/pubchem-client'
import type { StructuralFormulaRegistry } from './lib/structural-registry-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REGISTRY_PATH = path.join(__dirname, '..', 'src', 'data', 'structural-formula-registry.json')
const RATE_LIMIT_MS = 250

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const dryRun = args.includes('--dry-run')
  const idIdx = args.indexOf('--id')
  const idFilter = idIdx >= 0 ? args[idIdx + 1] : null

  const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8')
  const registry: StructuralFormulaRegistry = JSON.parse(raw)

  let updated = 0, skipped = 0, failed = 0

  for (const entry of registry.entries) {
    if (idFilter && entry.id !== idFilter) continue
    if (entry.smiles && !force) { skipped++; continue }

    // Use name_en for lookup (no manual CID needed)
    const lookup = entry.pubchem_cid ?? entry.name_en
    console.log(`[${entry.id}] Fetching SMILES for ${lookup}...`)

    if (dryRun) { console.log('  [DRY RUN]'); continue }

    try {
      const result = await fetchSmiles(lookup)
      if (result) {
        entry.smiles = result.canonical_smiles
        if (!entry.pubchem_cid) entry.pubchem_cid = result.cid
        console.log(`  OK: CID=${result.cid}, SMILES=${result.canonical_smiles.substring(0, 60)}...`)
        updated++
      } else {
        console.log('  NOT FOUND')
        failed++
      }
    } catch (err) {
      console.error(`  ERROR: ${err}`)
      failed++
    }

    await sleep(RATE_LIMIT_MS)
  }

  if (!dryRun) {
    registry.generated_at = new Date().toISOString()
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n')
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed`)
}

main().catch(console.error)
