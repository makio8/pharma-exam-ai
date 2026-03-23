/**
 * Tier1レビューページ用のデータを生成
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

const review = JSON.parse(fs.readFileSync(path.join(dataDir, 'tier1-review-results.json'), 'utf-8'))
const allIds = [...review.ng_critical_ids, ...review.ng_improve_ids, ...review.ok_ids]

interface ReviewItem {
  id: string
  year: number
  qnum: number
  text: string
  image_url: string
  keyword: string
  linked_scenario: string | null
  linked_group: string | null
  choices_empty: boolean
  prev: string
}

const results: ReviewItem[] = []

for (const id of allIds) {
  const m = id.match(/r(\d+)-(\d+)/)
  if (!m) continue
  const year = parseInt(m[1])
  const numStr = m[2]
  const tsPath = path.join(dataDir, `exam-${year}.ts`)
  const content = fs.readFileSync(tsPath, 'utf-8')
  const questions = JSON.parse(content.substring(content.indexOf('[\n')).trimEnd())
  const q = questions.find((q: any) => q.id === id)
  if (!q) continue

  const prevCat = review.ng_critical_ids.includes(id) ? 'ng-critical'
    : review.ng_improve_ids.includes(id) ? 'ng-improve' : 'ok'

  results.push({
    id: q.id,
    year,
    qnum: q.question_number,
    text: (q.question_text || '').substring(0, 200),
    image_url: q.image_url || `/images/questions/${year}/q${numStr}.png`,
    keyword: (q.question_text || '').match(/下図|この図|次の図|構造式|模式図|グラフ|図に示/)?.[0] || '',
    linked_scenario: q.linked_scenario ? q.linked_scenario.substring(0, 400) : null,
    linked_group: q.linked_group || null,
    choices_empty: !q.choices || q.choices.length === 0,
    prev: prevCat,
  })
}

console.log(JSON.stringify(results))
