// 公式付箋データ（自動生成: scripts/generate-official-notes.ts）
// ソース: fusens-master.json + note-exemplar-mappings.json + question-topic-map.ts
//
// データは official-notes.json に格納（TS リテラル 1,642件だと TS2590 エラーのため）
// topicId は exam-blueprint.ts の ALL_TOPICS.id に準拠
// linkedQuestionIds は question-topic-map.ts からtopicIdベースで自動逆引き
// exemplarIds は Claude 推論によるセマンティックマッチング結果
import type { OfficialNote } from '../types/official-note'
import data from './official-notes.json'

export const OFFICIAL_NOTES: OfficialNote[] = data as OfficialNote[]
