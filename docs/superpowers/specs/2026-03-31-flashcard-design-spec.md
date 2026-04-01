# 暗記フラッシュカード設計 Spec v1.0

> 2026-03-31 作成。エージェントチーム4名（PdM/教育工学/エンジニア/QA）+ GPT-5.4レビュー済み。

---

## 1. 設計方針: 「点数に直結するカードだけ作る」

たくさん暗記カードがあることに意味はない。必ず押さえるべき単元で必要な暗記カードが揃っており、これを覚えていくことで確実に点数UPに繋がっていくことが重要。

### カード生成対象のフィルタリング

| グループ | exemplar数 | 暗記カード |
|---------|-----------|----------|
| 未出題（0回） | 178件 (18%) | 作らない |
| 1回だけ | 161件 (16%) | 作らない |
| 2〜3回 | 217件 (22%) | 選択的（科目による） |
| 4〜5回 | 132件 (13%) | 作る |
| 6回以上（頻出） | 298件 (30%) | 必ず作る |

**対象: 約430件（44%）のexemplar → 推定3,300枚のカード**

---

## 2. Knowledge Atom（知識原子）設計

### exemplar vs knowledge atom

- **exemplar**: 出題基準の学習目標（986件）。粒度バラバラ（1問〜64問紐づく）
- **knowledge atom**: 1枚のカードで問う最小知識単位。exemplarを二次分割して生成

### 分割の原則

```
原則1: 1 atom = 1つの「想起テスト」
  OK: 「β遮断薬が喘息に禁忌な理由は？」
  NG: 「β遮断薬の禁忌と注意点を全て列挙せよ」

原則2: 過去問で実際に問われた角度でatomを切る
  → 過去問で一度も問われていない知識はatom化しない

原則3: 「これを覚えたら、この過去問が解ける」を明確にする
  → 各atomに source_question_ids を紐づけ

原則4: 枚数は出題頻度に比例（予算制御）
  出題6回以上: 最大15枚/exemplar
  出題4-5回: 最大8枚/exemplar
  出題2-3回: 最大3枚/exemplar
```

### knowledge_type 分類

```typescript
type KnowledgeType =
  | 'mechanism'        // 作用機序
  | 'classification'   // 分類
  | 'adverse_effect'   // 副作用
  | 'pharmacokinetics'  // 薬物動態
  | 'interaction'      // 相互作用
  | 'indication'       // 適応
  | 'contraindication'  // 禁忌
  | 'structure'        // 構造式
  | 'calculation'      // 計算
  | 'regulation'       // 法規
  | 'mnemonic'         // 語呂合わせ
```

### 重複排除の主制御

```
カードID = exemplar_id × knowledge_type × recall_direction
例: E1234-mechanism-drug_to_mech
    E1234-mechanism-mech_to_drug（逆カード）
→ IDが存在する場合、生成スキップ
```

---

## 3. カードタイプ（8種類）

### P0（最優先: Phase 1で実装）

| タイプ | 形式 | 例 |
|--------|------|-----|
| **穴埋め（cloze）** | 「アムロジピンは{{c1::L型Caチャネル}}を遮断する」 | 薬名・数値・分類 |
| **因果Q&A** | Q「ワルファリンの抗凝固機序は？」 | 作用機序・病態 |
| **用語↔定義** | 既存term_definition | 基礎用語 |

### P1（Phase 1b〜2）

| タイプ | 形式 | 例 |
|--------|------|-----|
| **弁別（比較）** | 「ACE阻害薬 vs ARB：空咳が起きるのは？」 | 類似薬の区別 |
| **画像→テキスト** | 付箋画像→キーポイント3つ | 付箋ベースカード |

### P2（Phase 2〜3）

| タイプ | 形式 | 例 |
|--------|------|-----|
| **正誤修正** | 「この文の誤りを指摘せよ」 | ひっかけ対策 |
| **臨床シナリオ** | 3行症例＋1問 | 実践問題対策 |
| **計算適用** | 用量計算 | 薬物動態 |

### ○×形式: メインには非推奨

教育工学エージェントの指摘: 再認（recognition）は再生（recall）より記憶定着が弱い。50%の確率で当たるため学習効果が低い。ウォーミングアップ用の補助に留める。

---

## 4. 構造式カード設計（別パイプライン）

### 5レベル設計（Phase 1はL1-L3のみ）

| Level | 内容 | カード例 |
|-------|------|---------|
| **L1** | 構造式→物質名 | [構造式画像] → 「ビタミンB1（チアミン）」 |
| **L2** | 物質名→構造特徴 | 「チアミンの構造的特徴3つ」 → テキスト |
| **L3** | 部分構造→分類 | [インドール環ハイライト] → 「セロトニン系化合物」 |
| L4 | 構造→薬理作用 | Phase 2以降（推論を含み短冊型カードとして不安定） |
| L5 | 構造比較 | Phase 2以降 |

### 画像表現

**メイン: SMILES → RDKit SVG描画**
- 化学的に正確（AI画像生成はハルシネーションリスクあり）
- SVGで軽量、ハイライト・注釈をプログラムで追加可能
- SMILES取得元: **PubChem API**（正規データ、AI画像認識は使わない）

**補助: 手書き付箋画像**
- 思考プロセスが見える学習効果

### Phase 1 対象（出題頻度ベース、約200枚）

| 優先 | カテゴリ | 枚数 |
|------|---------|------|
| 1 | 複素環母核15種 | 45枚 |
| 2 | ビタミン全13種 | 52枚 |
| 3 | β-ラクタム/ステロイド/ベンゾジアゼピン | 30枚 |
| 4 | 発がん物質・食品添加物 | 20枚 |
| 5 | アミノ酸20種・核酸塩基5種 | 50枚 |

### 構造式パイプライン

```
① 物質名リスト作成（手動）
② PubChem API → SMILES正規取得（無料・正確）
③ RDKit Python → SVG描画（ハイライト付き）
④ Claude Opus → L1-L3カードテキスト生成
⑤ 薬剤師2名レビュー
```

---

## 5. テキストカード生成パイプライン

### exemplar軸の情報統合フロー

```
Step 1: 対象exemplar選定（自動）
  exemplar-stats.ts から出題4回以上をフィルタ → 約430件

Step 2: exemplarごとの過去問集約（自動）
  question-exemplar-map.ts で紐づく過去問を取得
  過去問の問題文+選択肢+AI解説+付箋OCRを1ドキュメントに集約

Step 3: knowledge atom抽出（Claude Opus 4.6）
  プロンプト: 過去問で実際に問われた知識ポイントを抽出
  各atom: ID, knowledge_type, front, back, source_question_ids

Step 4: 重複チェック + 品質検証
  Claude Opus + GPT-5.4(Codex) で相互検証

Step 5: カードデータ出力
  FlashCardTemplate[] として JSON 出力
```

### 生成コスト

- Claude Opus 4.6: MAXサブスク（追加コストなし）
- GPT-5.4 Codex: サブスク（追加コストなし）
- PubChem API: 無料
- RDKit: ローカル実行（無料）

---

## 6. データモデル拡張

### FlashCardTemplate 拡張

```typescript
interface FlashCardTemplate {
  // 既存
  id: string
  source_type: 'fusen' | 'explanation' | 'structure_db'
  source_id: string
  primary_exemplar_id: string
  subject: QuestionSubject
  front: string
  back: string
  format: CardFormat
  tags: string[]

  // 新規追加
  knowledge_atom_id: string
  knowledge_type: KnowledgeType
  recall_direction: string
  reverse_of_id?: string
  difficulty_tier: 'basic' | 'applied' | 'integrated'
  content_type: 'text' | 'image' | 'image_text'
  media_url?: string
  smiles?: string
  generation_model: string
  confidence_score: number
  source_question_ids: string[]
  source_note_ids: string[]
}

type CardFormat =
  | 'term_definition'
  | 'question_answer'
  | 'mnemonic'
  | 'cloze'
  | 'comparison'
  | 'structural_identification'
  | 'structural_features'
  | 'structural_pattern'
  | 'structure_activity'
  | 'structural_comparison'
```

### 逆カード: 別レコード + reverse_of_id

SM-2の進捗状態が面ごとに独立すべきため。

### 格納

- Phase 1: JSONファイル + dynamic import（科目別分割ロード）
- Phase 2: Supabase card_templates テーブル + IndexedDBキャッシュ

---

## 7. 科目別戦略

| グループ | 科目 | 最適カード形式 | 出題密度 |
|---------|------|-------------|---------|
| 暗記主導 | 薬理(8.42)・衛生(6.14)・法規(3.94) | 穴埋め+比較 | 高 |
| 理解主導 | 薬剤(7.76)・生物(2.13) | 因果Q&A+比較 | 中〜高 |
| 応用主導 | 実務(6.24)・病態治療(4.44) | 臨床シナリオ | 高 |
| 計算+構造 | 物理(2.61)・化学(2.01) | 構造式+計算 | 低 |

---

## 8. 学習負荷管理

| パラメータ | 推奨値 |
|-----------|-------|
| 新規カード/日 | 20枚（デフォルト） |
| 復習カード/日 | 上限100枚 |
| 1セッション | 15分 or 50枚 |

### 復習バックログ対策

- 3日以上空けたら「キャッチアップモード」（優先度順50枚だけ）
- 溜まった総数はメイン画面に表示しない
- 「5分だけモード」（10〜15枚）

### 難易度3段階

| Level | 比率 | 解放条件 |
|-------|------|---------|
| 基礎 | 50% | 最初から |
| 応用 | 30% | 基礎の正答率80%以上 |
| 統合 | 20% | 応用の正答率80%以上 |

---

## 9. プロダクト紐付け（5つの入口）

| # | 入口 | 目的 |
|---|------|------|
| 1 | ホーム「今日の復習」 | 習慣化 |
| 2 | 問題解答後CTA | 不正解→即暗記 |
| 3 | 付箋詳細ページ | 理解→定着 |
| 4 | カード一覧ページ | 自律学習 |
| 5 | 分析ページ | 弱点→暗記 |

### 逆方向導線（差別化）

カード復習完了 → 「この知識の過去問を解いてみよう」→ 正答率UP

---

## 10. 品質管理

### 3層検証

| 層 | 担当 | カバー率 |
|---|---|---|
| L1: 自動検証 | バリデーションスクリプト | 全カード |
| L2: AI相互検証 | Claude Opus + GPT-5.4 | confidence < 0.8 |
| L3: 人間レビュー | 薬剤師2名（開発者+ファウンダー） | サンプリング |

### 禁忌・用量カード

Phase 1では後回し。作成時は薬剤師によるダブルチェック必須。

---

## 11. GPT-5.4 P1指摘と対応

| P1指摘 | 対応 |
|--------|------|
| exemplar粒度バラバラ | knowledge atomで二次分割 |
| 重複排除が生成後補正に依存 | 生成前にID設計で主制御 |
| SMILES変換のAI依存リスク | PubChem正規データを正とする |
| データモデル不足 | カード専用メタデータ追加 |

---

## 12. 推定枚数

| グループ | exemplar数 | 平均atom数 | カード枚数 |
|---------|-----------|-----------|----------|
| 6回以上 | 298件 | 8枚 | 約2,400枚 |
| 4〜5回 | 132件 | 4枚 | 約530枚 |
| 2〜3回（選択的） | 約100件 | 2枚 | 約200枚 |
| 構造式カード | — | — | 約200枚 |
| **総計** | | | **約3,300枚** |

---

## 13. 差別化ポジション

**「作らなくていいAnki」** — 点数に直結する3,300枚が最初から入っている

- Anki: 強力だがカード作成が負担
- 薬ゼミ1問1答: 「解く」体験。本アプリは「覚える→忘れない」体験
- Emery: 過去問演習型。本アプリは暗記→演習の循環

既存アプリにエビデンスベースの間隔反復暗記カードは市場にほぼない。
