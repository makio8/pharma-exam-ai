/**
 * 連問の親問題に結合されたテキストを分割するスクリプト
 *
 * 問題: r100-196 の question_text に問196〜199の全テキストが結合されている
 * 修正: 各問題の question_text を「自分の問題文」だけに分割
 *
 * Usage: npx tsx scripts/split-linked-question-text.ts [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs'
import { readdirSync } from 'fs'

const DRY_RUN = process.argv.includes('--dry-run')
const dir = 'src/data/real-questions'

interface QuestionEntry {
  id: string
  year: number
  questionNumber: number
  questionTextStart: number  // position in file
  questionTextEnd: number
  questionText: string
  hasMultiMarkers: boolean
}

const files = readdirSync(dir).filter(f => /^exam-\d+\.ts$/.test(f)).sort()
let totalFixed = 0

for (const file of files) {
  const filePath = `${dir}/${file}`
  let content = readFileSync(filePath, 'utf-8')
  let modified = false

  // Find all question_text entries with their positions
  const qtRegex = /"id":\s*"r(\d+)-(\d+)"[\s\S]*?"question_text":\s*"((?:[^"\\]|\\.)*)"/g
  let match: RegExpExecArray | null
  const entries: QuestionEntry[] = []

  while ((match = qtRegex.exec(content)) !== null) {
    const qt = match[3]
    const markers = qt.match(/問\d+\s*[（(]/g)
    entries.push({
      id: `r${match[1]}-${match[2]}`,
      year: parseInt(match[1], 10),
      questionNumber: parseInt(match[2], 10),
      questionTextStart: match.index + match[0].indexOf(match[3]),
      questionTextEnd: match.index + match[0].indexOf(match[3]) + match[3].length,
      questionText: qt,
      hasMultiMarkers: (markers?.length ?? 0) >= 2,
    })
  }

  // Process entries with multiple markers
  for (const entry of entries) {
    if (!entry.hasMultiMarkers) continue

    const qt = entry.questionText

    // Find all 問XXX（科目）markers
    const markerRegex = /問(\d+)\s*[（(]([^）)]*)[）)]/g
    const markers: { num: number; start: number; end: number; fullMatch: string }[] = []
    let m: RegExpExecArray | null
    while ((m = markerRegex.exec(qt)) !== null) {
      markers.push({
        num: parseInt(m[1], 10),
        start: m.index,
        end: m.index + m[0].length,
        fullMatch: m[0],
      })
    }

    if (markers.length < 2) continue

    // Find the marker for this question
    const myMarker = markers.find(mk => mk.num === entry.questionNumber)

    let newText: string
    if (myMarker) {
      // Extract text from my marker to the next marker
      const myIndex = markers.indexOf(myMarker)
      const nextMarker = markers[myIndex + 1]
      const bodyStart = myMarker.end
      const bodyEnd = nextMarker ? nextMarker.start : qt.length
      newText = qt.slice(bodyStart, bodyEnd).trim()
      // Remove trailing whitespace/tabs
      newText = newText.replace(/[\t\n\s]+$/, '').trim()
    } else {
      // This question's number is not in the markers
      // It might be the "parent" whose number matches the first marker range
      // Extract text before the first marker (scenario) + after the first marker matching this number
      const firstMarker = markers[0]
      const scenario = qt.slice(0, firstMarker.start).trim()

      // Check if the first marker matches this question
      if (firstMarker.num === entry.questionNumber) {
        const nextMarker = markers[1]
        const bodyEnd = nextMarker ? nextMarker.start : qt.length
        newText = scenario + '\\n' + qt.slice(firstMarker.end, bodyEnd).trim()
      } else {
        // Just keep the scenario part
        newText = scenario
      }
    }

    if (newText && newText !== qt && newText.length > 10) {
      // Replace in content
      const oldStr = `"question_text": "${qt}"`
      const newStr = `"question_text": "${newText}"`

      if (content.includes(oldStr)) {
        content = content.replace(oldStr, newStr)
        modified = true
        totalFixed++

        if (DRY_RUN) {
          console.log(`[DRY] ${entry.id}: ${qt.length} chars → ${newText.length} chars`)
          console.log(`  OLD: ${qt.substring(0, 80)}...`)
          console.log(`  NEW: ${newText.substring(0, 80)}...`)
        }
      }
    }
  }

  if (modified && !DRY_RUN) {
    writeFileSync(filePath, content, 'utf-8')
    console.log(`✅ ${file}: updated`)
  }
}

console.log(`\nTotal fixed: ${totalFixed}`)
if (DRY_RUN) console.log('(dry run - no files changed)')
