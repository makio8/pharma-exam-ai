# QuestionPage リデザイン設計書（データモデル・コンポーネント設計レビュー用）

## データモデル

### 新規データ型

```typescript
// 公式付箋（運営提供コンテンツ）
interface OfficialNote {
  id: string
  title: string                // 「交感神経 α1受容体の作用機序」
  imageUrl: string             // 手書きノート画像（PNG/WebP）
  textSummary: string          // AIテキスト要約（検索・暗記カード用）
  subject: QuestionSubject     // 「薬理」
  field: string                // 中分類「交感神経系」
  tags: string[]               // 「α受容体」「血管収縮」
  linkedQuestionIds: string[]  // この知識が必要な問題ID群
  linkedCardIds: string[]      // 紐づく暗記カードID群
  importance: number           // 紐づく問題数から自動算出
  tier: 'free' | 'premium'    // 課金区分
}

// ユーザーのブックマーク
interface BookmarkedNote {
  noteId: string               // OfficialNote.id
  bookmarkedAt: string         // ISO8601
  reviewCount: number          // 何回見たか
}

// 解答履歴の拡張（既存 + skipped 追加）
interface AnswerRecord {
  question_id: string
  selected_answer: number | number[] | null  // null = スキップ
  is_correct: boolean
  answered_at: string
  time_spent_seconds: number   // 自動計測（Page Visibility除外済み）
  skipped: boolean             // 「わからん」で飛ばした
  // confidence_level は廃止
}
```

### 既存データとの関係

- `QUESTION_TOPIC_MAP`: Record<questionId, topicId> — 問題→中項目マッピング（既存）
- `EXAM_BLUEPRINT`: SubjectBlueprint[] — 科目→大項目→中項目の階層（既存）
- `ALL_TOPICS`: { id, major, middle, minor, subject }[] — フラット化したトピック一覧（既存）
- `EXEMPLAR_STATS`: 出題頻度統計（yearsAppeared, totalQuestions等）（既存）
- `ALL_QUESTIONS`: Question[] — 全問題データ（既存）

### 新規データソース

```typescript
// src/data/official-notes.ts（初期はモック5-10枚、後でサンプル差し替え）
export const OFFICIAL_NOTES: OfficialNote[] = [...]

// questionId → noteId[] の逆引きマップは useMemo で動的生成
// OfficialNote.linkedQuestionIds から構築
```

### 新規フック

```typescript
// 公式付箋の取得
useOfficialNotes(questionId: string): {
  notes: OfficialNote[]       // この問題に紐づく付箋（0〜N枚）
  isLoading: boolean
}

// ブックマーク管理
useBookmarks(): {
  bookmarks: BookmarkedNote[]
  isBookmarked: (noteId: string) => boolean
  toggleBookmark: (noteId: string) => void
}

// スワイプナビゲーション
useSwipeNavigation(sessionIds: string[], currentId: string): {
  onTouchStart: TouchEventHandler
  onTouchMove: TouchEventHandler
  onTouchEnd: TouchEventHandler
  canGoPrev: boolean
  canGoNext: boolean
}

// 時間計測（Page Visibility API対応）
useTimeTracking(): {
  getElapsedSeconds: () => number
  reset: () => void
}
```

### 状態管理（QuestionPage内）

```typescript
// 解答前
const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])

// 解答後
const [isAnswered, setIsAnswered] = useState(false)
const [isCorrect, setIsCorrect] = useState(false)
const [isSkipped, setIsSkipped] = useState(false)

// 時間計測
const startTimeRef = useRef<number>(Date.now())
const visibleTimeRef = useRef<number>(0)

// UI状態
const [metaOpen, setMetaOpen] = useState(false)
const [imageViewOpen, setImageViewOpen] = useState(false)

// 廃止: confidence, noteModalOpen, cardModalOpen, form, cardForm
```

---

## コンポーネント設計

### コンポーネントツリー

```
QuestionPage（ページコンテナ + スワイプ + 状態管理）
├── ProgressHeader         — 問番号 + 科目 + スワイプヒント
├── QuestionBody           — 問題文 + 画像表示
│   └── QuestionImage      — 画像の表示モード切り替え
├── ChoiceList             — 選択肢グループ（単一/複数/数値を出し分け）
│   └── ChoiceCard         — 個別選択肢カード
├── ActionArea             — わからん + 解答ボタン
├── ResultBanner           — 正誤 + 計測時間
├── ExplanationSection     — AI解説テキスト
├── OfficialNoteCard       — 公式付箋カード
│   └── NoteImageViewer    — 画像拡大（BottomSheet wrap）
├── MetaAccordion          — 詳細情報（折りたたみ）
└── FloatingNav            — 既存（変更なし）
```

### ファイル構成

```
src/
├── pages/
│   ├── QuestionPage.tsx              — ページコンテナ + スワイプ + 状態管理
│   └── QuestionPage.module.css
│
├── components/
│   ├── question/                     — QuestionPage専用コンポーネント
│   │   ├── ProgressHeader.tsx + .module.css
│   │   ├── QuestionBody.tsx + .module.css
│   │   ├── ChoiceList.tsx            — 選択肢グループ
│   │   ├── ChoiceCard.tsx            — 個別選択肢
│   │   ├── Choice.module.css         — ChoiceList + ChoiceCard 共有
│   │   ├── ActionArea.tsx + .module.css
│   │   ├── ResultBanner.tsx + .module.css
│   │   ├── ExplanationSection.tsx + .module.css
│   │   ├── OfficialNoteCard.tsx + .module.css
│   │   ├── NoteImageViewer.tsx       — BottomSheet でラップ
│   │   ├── MetaAccordion.tsx + .module.css
│   │   └── index.ts                  — barrel export
│   │
│   ├── ui/                           — 既存共通コンポーネント（変更なし）
│   └── LinkedQuestionViewer.tsx      — 既存（後で同パターンに横展開）
│
├── hooks/
│   ├── useOfficialNotes.ts           — 新規
│   ├── useBookmarks.ts               — 新規
│   ├── useSwipeNavigation.ts         — 新規
│   ├── useTimeTracking.ts            — 新規
│   ├── useAnswerHistory.ts           — 既存（skipped追加）
│   ├── useLinkedQuestions.ts         — 既存
│   └── useFlashCards.ts              — 既存
│
├── data/
│   ├── official-notes.ts             — 新規（モックデータ）
│   └── ...既存
│
├── types/
│   ├── note.ts                       — OfficialNote, BookmarkedNote 追加
│   └── question.ts                   — AnswerRecord に skipped 追加
│
└── styles/
    ├── tokens.css                    — 既存（変更なし）
    └── base.css                      — 既存（変更なし）
```

### 分割の根拠

1. 現状730行の QuestionPage.tsx を各80-150行のコンポーネントに分割
2. ChoiceList, ResultBanner, OfficialNoteCard は LinkedQuestionViewer でも再利用予定
3. `components/question/` はドメイン固有、`components/ui/` はデザインシステム汎用
4. 各コンポーネントが単体テスト可能

### Ant Design → Soft Companion 置き換えマッピング

| Ant Design | 置き換え先 |
|------------|-----------|
| Card | CSS Module カードスタイル |
| Typography | ネイティブ要素 + CSS Module |
| Radio / Radio.Group | ChoiceCard + ChoiceList |
| Checkbox / Checkbox.Group | ChoiceCard + ChoiceList |
| Button | ネイティブ button + CSS Module |
| Tag | 既存 Chip コンポーネント |
| Space | CSS gap |
| Divider | CSS border-top |
| Modal | 既存 BottomSheet / 削除 |
| Form / Input / Select | 削除（自作機能廃止） |
| Result | カスタム 404 |
| Alert | ResultBanner |
| Image | ネイティブ img + NoteImageViewer |

### REDESIGNED_EXACT への追加方針

現在: `['/', '/practice']`（完全一致のみ）
QuestionPage は `/practice/:questionId` でアクセスされるため完全一致不可。

提案: `/practice/` の startsWith パターンを追加
```typescript
const isRedesigned =
  REDESIGNED_EXACT.includes(location.pathname) ||
  location.pathname.startsWith('/practice/')
```
※ 末尾スラッシュ付きなので `/practice` 自体にはマッチしない。安全。

### プロジェクトコンテキスト

- React 19 / TypeScript 5.9 / Vite 8 / CSS Modules
- デザインシステム「Soft Companion」: tokens.css + base.css + components/ui/
- 既存パターン: PracticePage.tsx + PracticePage.module.css（リデザイン済み）
- データ: 11年分3,470問、問題マッピング（科目→分野→中分類）構築済み
- ストレージ: localStorage優先、Supabase fallback
- 連問セット: linked_group `r{year}-{start}-{end}` 形式
