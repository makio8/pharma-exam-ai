# セッション引き継ぎ: 例示マッピングv3完了 → 頻出度分析エンジン

## 前セッションの成果（2026-03-21〜22）

### 1. 例示マッピングv3完了（AI直接推論版）
- **4,094問×966例示** の多対多マッピングが完成
- ファイル: `src/data/question-exemplar-map.ts`（4,384エントリ）
- 例示マスタ: `src/data/exemplars.ts`（966例示 = 元951 + H1追加15）
- コミット: `240796b`

### 2. 第111回データ取込完了
- `src/data/real-questions/exam-111.ts`（345問、問題文+選択肢+正答+解説）
- 12年分4,140問（第100〜111回）がアプリに統合済み
- `src/data/all-questions.ts` + `vite.config.ts` に追加済み

### 3. マッピング品質の進化（v1→v2→v3）

| バージョン | 手法 | 精度 |
|-----------|------|------|
| v1 | キーワードマッチ + 科目フィルタ | ~30% |
| v2 | エージェントがスクリプト自動化 + フィルタ撤廃 | 60% |
| **v3** | **AI直接推論（スクリプト禁止）** | **~95%** |

**最大の学び**: エージェントに大量タスクを任せると効率を求めてスクリプトに逃げる。「スクリプト禁止、1問ずつ推論」を明記することで精度が劇的に向上。

---

## 現在のデータ構造

### 型定義（`src/types/blueprint.ts`）
```typescript
interface Exemplar {
  id: string              // "ex-physics-001"
  minorCategory: string   // 小項目名
  middleCategoryId: TopicId // 中項目ID
  subject: QuestionSubject
  text: string            // "化学結合の様式について説明できる。"
}

interface QuestionExemplarMapping {
  questionId: string      // "r110-001"
  exemplarId: string      // "ex-physics-001"
  isPrimary: boolean
}

interface ExemplarStats {
  exemplarId: string
  yearsAppeared: number
  totalQuestions: number
  yearDetails: { year: number; count: number }[]
}
```

### ファイル構成
```
src/data/
├── exemplars.ts              # 966例示マスタ（9科目）
├── question-exemplar-map.ts  # 4,094問→966例示マッピング（v3）
├── exam-blueprint.ts         # 86中項目マスタ
├── question-topic-map.ts     # 3,749問→86中項目マッピング（旧）
├── all-questions.ts          # 全4,140問統合（第100-111回）
└── real-questions/
    ├── exam-100.ts 〜 exam-111.ts
    └── explanations-*.json
```

### 科目別例示数
| 科目 | 例示数 |
|------|--------|
| 病態・薬物治療 | 158 |
| 生物 | 144 |
| 化学 | 119 |
| 実務 | 131（元117 + H1追加14） |
| 物理 | 101 |
| 法規・制度・倫理 | 97 |
| 衛生 | 80（元79 + H1追加1） |
| 薬理 | 68 |
| 薬剤 | 68 |

---

## 品質検証で判明した課題

### 1. ex-practice-043（服薬指導）に136問が集中
- 「服薬指導や患者教育ができる」は実務問題のほぼ全てに関連
- **サブカテゴリ分割が必要**:
  - 疾患別（糖尿病の服薬指導、がん化学療法の服薬指導...）
  - 対象別（高齢者、小児、妊婦...）
  - 薬効群別（抗凝固薬、吸入薬、インスリン...）

### 2. 一部の汎用例示に問題が集中
サンプル検証で判明した上位例示:
- ex-practice-043: 136問（多すぎる）
- ex-pharmacology-012: 17問（適切）
- ex-pathology-014: 6問（適切）

### 3. 未使用例示が約200個
966例示中、v3で使用されたのは約754。約200個が未使用。
→ 出題されていない例示 = 今後の出題可能性 or 例示テキストが問題文と乖離

---

## 次のTODO: 頻出度分析エンジン

### 目的
「例示×年度のクロス集計」で以下を実現:
1. **よく出る例示の特定** → 例示ごとの出題回数・年度を可視化
2. **よく出るのに解けない例示の特定** → 頻出度×正答率のクロス分析
3. **出題されていない例示の発見** → 次回出題予測
4. **粗い例示の分割** → ex-practice-043のような過集中を解消

### 実装アプローチ

#### Step 1: ExemplarStats計算スクリプト
```typescript
// 例示ごとの出題統計を計算
interface ExemplarStats {
  exemplarId: string
  exemplarText: string
  subject: string
  yearsAppeared: number      // 出題された年度数（max 12）
  totalQuestions: number     // 総出題数
  yearDetails: { year: number; count: number }[]
  questionIds: string[]      // 紐付いた問題ID一覧
}
```

#### Step 2: 粗い例示の分割検討
- ex-practice-043（136問）→ 問題内容を分析して10-15のサブカテゴリに分割
- 分割基準: 問題文+解説のキーワードクラスタリング
- 分割後の新例示IDをexemplars.tsに追加 → マッピング更新

#### Step 3: UIへの反映（分析タブ）
- ホーム画面の「今日のメニュー」に頻出度情報を反映
- 分析タブに「マスターマップ」（例示×年度ヒートマップ）を追加
- 「よく出るのに解けない」アラート機能

### 前提ファイル
- `src/data/question-exemplar-map.ts` — v3マッピング（4,384エントリ）
- `src/data/exemplars.ts` — 966例示
- `src/data/all-questions.ts` — 全4,140問
- `src/hooks/useTopicMastery.ts` — 既存の中項目マスター判定（参考）
- `src/hooks/useAnswerHistory.ts` — 回答履歴（正答率計算用）

### 参考: 類似問題提示の2パターン（次々回TODO）
1. **同じ例示の過去問提示**: 例示IDで問題を検索 → 年度横断で提示
2. **AIオリジナル問題生成**: 例示テキスト+過去問パターンから新問作成

---

## 技術的な学び（次セッションで活用）

### エージェント運用
1. **「スクリプト禁止」の明記が必須** — 大量タスクでAIにスクリプト自動化を禁止しないと精度が大幅低下
2. **コンパクト入力の準備** — 例示リスト(85KB)と問題データを事前にコンパクト化すると効率的
3. **出力フォーマットの統一** — エージェントごとに異なるJSON構造を出力する → マージスクリプトで全フォーマット対応が必要
4. **画像のリサイズ** — Vision AI 2000px制限 → 1800px幅にリサイズ、1ページずつ読む指示

### データ品質
1. **科目フィルタは不要** — 実践問題の71%で番号ベースsubjectと実データsubjectが不一致
2. **moppynoteは高品質リファレンス** — 科目タグ+分野テーマ+詳細解説が全345問揃う
3. **Google DocsのrtfdはローカルにTXTがない** → txtエクスポートが必要
4. **薬ゼミPDFはRICOHスキャン** → pdftotext不可、Vision AIが必須

### 外部ソース
- **medhicalwinghope**: 第111回 問1-285の解説（WebFetch可）
- **moppynote**: 第111回 全345問の解説（Google Drive `pharma-exam-ai/moppynote/`）
- **薬ゼミ**: https://www.yakuzemi.ac.jp/information/111_exercise/ （問題PDF+正答PDF）
- **厚労省PDF**: 第111回は未公開（2026年4月頃）
