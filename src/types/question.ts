// 薬剤師国試：問題・回答履歴の型定義

/** 問題区分 */
export type QuestionSection = '必須' | '理論' | '実践'

/** 科目 */
export type QuestionSubject =
  | '物理'
  | '化学'
  | '生物'
  | '衛生'
  | '薬理'
  | '薬剤'
  | '病態・薬物治療'
  | '法規・制度・倫理'
  | '実務'

/** 選択肢の表現形式 */
export type ChoiceType =
  | 'text'
  | 'text_pair'
  | 'structural_formula'
  | 'graph'
  | 'equation'
  | 'image'
  | 'image_other'
  | 'chemical_structure'
  | 'formula'
  | 'diagram'
  | 'image_region'
  | 'image_with_label'
  | 'numeric'
  | 'image_and_text'
  | 'graph_line'
  | 'diagram_region'
  | 'diagram_label'
  | 'structural_formula_region'
  | 'reaction_scheme'
  | 'reaction_mechanism'
  | 'image_label'
  | 'structural_formula_pair'

/** 問題の選択肢 */
export interface Choice {
  key: number
  text: string
  semantic_labels?: string[]
  choice_type?: ChoiceType
}

/** 画像内容の分類 */
export type VisualContentType =
  | 'structural_formula'
  | 'graph'
  | 'table'
  | 'diagram'
  | 'prescription'
  | 'text_only'
  | 'mixed'

/** 過去問マスタ */
export interface Question {
  id: string
  year: number              // 例: 108（第108回）
  question_number: number   // 問番
  section: QuestionSection
  subject: QuestionSubject
  category: string          // 単元（例:「薬物動態」）
  question_text: string
  choices: Choice[]
  correct_answer: number | number[]    // 1〜5（複数選択問題は配列）
  explanation: string
  tags: string[]            // キーワードタグ
  correct_rate?: number     // 正答率（0〜1）。60%以上が演習推奨
  image_url?: string        // 問題に図がある場合
  question_text_original?: string  // クリーニング前のテキスト（ロールバック用）
  visual_content_type?: VisualContentType
  question_concepts?: string[]
  linked_group?: string
  linked_scenario?: string
}

/** 自信度 */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'guess'

/** 回答履歴 */
export interface AnswerHistory {
  id: string
  user_id: string
  question_id: string
  selected_answer: number | number[]
  is_correct: boolean
  answered_at: string       // ISO8601
  confidence_level: ConfidenceLevel
  time_spent_seconds?: number
}

/** フィルター条件 */
export interface QuestionFilter {
  sections?: QuestionSection[]
  subjects?: QuestionSubject[]
  years?: number[]
  correctStatus?: 'all' | 'correct' | 'incorrect' | 'unanswered'
  hasNote?: boolean
  hasImage?: boolean
  tags?: string[]
  keyword?: string
}

/** セッション設定 */
export interface PracticeSession {
  questionCount: 5 | 10 | 20 | 50
  filter: QuestionFilter
  order: 'random' | 'sequential' | 'year_asc' | 'year_desc'
}

/** 科目別正答率（分析用） */
export interface SubjectAccuracy {
  subject: QuestionSubject
  total: number
  correct: number
  accuracy: number // 0〜1
}
