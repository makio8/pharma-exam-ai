# 構造式フラッシュカード パイプライン Spec v1.0

> 2026-03-31 作成。暗記フラッシュカード設計specの構造式カード部分を独立パイプラインとして詳細化。
> 親spec: `2026-03-31-flashcard-design-spec.md`

---

## 背景と目的

ファウンダーが受験生時代にQuizletで構造式フラッシュカードを作った実体験から、最も点数に直結したカードタイプ。

**国試での出題パターン**:
- 選択肢に5つの構造式提示 →「この中からビタミンB1を選べ」
- 問題文に「この構造式の物質について」→ 構造式が何か分からないと前提に立てない

**対象カテゴリ**: 複素環、ビタミン、発がん物質、トクホ、プロドラッグ、食品添加物、核酸塩基、アミノ酸、β-ラクタム、ステロイド、ベンゾジアゼピン等

---

## 1. 5レベル設計（Phase 1はL1-L3のみ）

### L1: 構造式 → 物質名（structural_identification）

```
表面: [RDKit SVG構造式画像]
裏面: 「ビタミンB1（チアミン）」+ チアゾール環とピリミジン環のハイライト
```

### L2: 物質名 → 構造の特徴（structural_features）

```
表面: 「ビタミンB1（チアミン）の構造的特徴を3つ挙げよ」
裏面: (1)チアゾール環+ピリミジン環の2環構造
      (2)チアゾール環上に4級窒素
      (3)ピリミジン環にアミノ基
      + [構造式SVG]
```

### L3: 部分構造 → 分類（structural_pattern）

```
表面: [インドール環ハイライトSVG] +「この部分構造を持つ化合物群は？」
裏面: 「インドール環 → セロトニン系、トリプタン系、LSD等。
       トリプトファン由来の生体物質に多い」
```

### L4/L5: Phase 2以降

GPT-5.4指摘: 推論を含みやすく短冊型カードとして不安定。Phase 1では対象を限定。

---

## 2. Phase 1 対象物質リスト（約200枚）

### Priority 1: 複素環母核15種（45枚 = 各3枚: L1+L2+L3）

| # | 母核名 | 代表化合物 | 科目 |
|---|--------|-----------|------|
| 1 | プリン環 | アデニン、グアニン、カフェイン | 化学/生物 |
| 2 | ピリミジン環 | シトシン、ウラシル、チミン | 化学/生物 |
| 3 | インドール環 | セロトニン、トリプトファン | 化学/薬理 |
| 4 | キノリン環 | キニーネ、キノロン系抗菌薬 | 化学/薬理 |
| 5 | イミダゾール環 | ヒスタミン、ヒスチジン | 化学/薬理 |
| 6 | チアゾール環 | チアミン（ビタミンB1） | 化学/衛生 |
| 7 | ピリジン環 | ニコチンアミド（ビタミンB3） | 化学/衛生 |
| 8 | ピロール環 | ポルフィリン、ヘム | 化学/生物 |
| 9 | フラン環 | フロセミド | 化学/薬理 |
| 10 | チオフェン環 | チクロピジン | 化学/薬理 |
| 11 | ベンゾジアゼピン環 | ジアゼパム、ミダゾラム | 薬理 |
| 12 | フェノチアジン環 | クロルプロマジン | 薬理 |
| 13 | ステロイド骨格（ABCD環） | コレステロール、プレドニゾロン | 化学/薬理 |
| 14 | β-ラクタム環 | ペニシリン、セフェム | 薬理 |
| 15 | テトラサイクリン骨格 | テトラサイクリン | 薬理 |

### Priority 2: ビタミン全13種（52枚 = 各4枚: L1+L2+L3+語呂）

A, B1, B2, B3(ナイアシン), B5(パントテン酸), B6, B7(ビオチン), B9(葉酸), B12, C, D, E, K

### Priority 3: 頻出薬理構造（30枚）

- β-ラクタム系（ペナム骨格 vs セフェム骨格の比較）
- ステロイド系（プレドニゾロン vs デキサメタゾンの構造比較）
- ベンゾジアゼピン系（基本骨格+代表薬3種）
- カテコールアミン（アドレナリン、ノルアドレナリン、ドパミンの構造比較）

### Priority 4: 発がん物質・食品添加物（20枚）

- アフラトキシンB1、ベンゾ[a]ピレン、ニトロソアミン等（衛生頻出）
- 保存料（ソルビン酸、安息香酸）、着色料（タール色素）

### Priority 5: アミノ酸20種・核酸塩基5種（50枚）

- アミノ酸: 各2枚（L1構造→名前 + L3側鎖の特徴→分類）
- 核酸塩基: 各2枚（L1構造→名前 + L3プリン/ピリミジン分類）

---

## 3. 技術パイプライン

### 全体フロー

```
① 物質名リスト作成（手動、上記Phase 1リスト）
     ↓
② PubChem API → SMILES正規取得
     scripts/fetch-pubchem-smiles.ts
     ↓
③ RDKit Python → SVG描画
     scripts/generate-structure-svgs.py
     → public/images/structures/{compound-name}.svg
     → public/images/structures/{compound-name}-highlight-{part}.svg
     ↓
④ Claude Opus 4.6 → L1-L3カードテキスト生成
     scripts/generate-structural-cards.ts
     ↓
⑤ 品質検証（Claude Opus + GPT-5.4）
     ↓
⑥ 薬剤師2名レビュー（構造式の正確性確認）
     ↓
⑦ 出力: structural-flashcard-templates.json
```

### Step ②: PubChem SMILES取得

```typescript
// scripts/fetch-pubchem-smiles.ts

interface StructureEntry {
  id: string                    // 'struct-thiamine'
  name_ja: string              // 'チアミン'
  name_en: string              // 'Thiamine'
  pubchem_cid: number          // PubChem Compound ID
  smiles: string               // 正規SMILES（PubChem取得）
  scaffold: string             // '母核名: チアゾール環+ピリミジン環'
  functional_groups: string[]  // ['アミノ基', '4級窒素']
  category: string             // 'vitamin' | 'heterocycle' | 'carcinogen' | ...
  subjects: string[]           // ['化学', '衛生']
}

// PubChem REST API
// GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{name}/property/CanonicalSMILES/JSON
```

### Step ③: RDKit SVG生成

```python
# scripts/generate-structure-svgs.py
from rdkit import Chem
from rdkit.Chem import Draw, AllChem
import json

def generate_svg(smiles: str, output_path: str,
                 highlight_atoms: list = None,
                 highlight_color: tuple = (1.0, 0.8, 0.8)):
    mol = Chem.MolFromSmiles(smiles)
    AllChem.Compute2DCoords(mol)
    drawer = Draw.MolDraw2DSVG(400, 300)
    if highlight_atoms:
        colors = {a: highlight_color for a in highlight_atoms}
        drawer.DrawMolecule(mol, highlightAtoms=highlight_atoms,
                           highlightAtomColors=colors)
    else:
        drawer.DrawMolecule(mol)
    drawer.FinishDrawing()
    with open(output_path, 'w') as f:
        f.write(drawer.GetDrawingText())

# 実行:
# python scripts/generate-structure-svgs.py --input structural-formula-registry.json
```

**RDKit環境**: `pip install rdkit` or `conda install -c conda-forge rdkit`

### Step ④: カードテキスト生成プロンプト

```
あなたは薬剤師国家試験対策の構造式暗記カード作成者です。

物質: {name_ja}（{name_en}）
SMILES: {smiles}
母核: {scaffold}
官能基: {functional_groups}
カテゴリ: {category}

以下の3枚のカードを生成してください:

L1（structural_identification）:
  front: 「構造式画像」（※画像参照指示のテキスト）
  back: 物質名 + 母核名 + 所属する化合物群

L2（structural_features）:
  front: 「{name_ja}の構造的特徴を3つ挙げよ」
  back: 特徴3つ（化学的に正確に）

L3（structural_pattern）:
  front: 「{scaffold}を持つ代表的な化合物を3つ挙げよ」
  back: 化合物3つ + それぞれの用途/分類

JSON形式で出力:
[{ "level": "L1", "format": "structural_identification",
   "front": "...", "back": "...", "tags": [...] }, ...]
```

---

## 4. データモデル

```typescript
// FlashCardTemplate の構造式カード固有フィールド

{
  id: 'struct-thiamine-L1',
  source_type: 'structure_db',
  source_id: 'struct-thiamine',      // structural-formula-registry の id
  format: 'structural_identification',
  content_type: 'image_text',
  media_url: '/images/structures/thiamine.svg',
  smiles: 'OCCc1ncc(C)c(N)n1',      // PubChem正規SMILES
  knowledge_type: 'structure',
  difficulty_tier: 'basic',
  tags: ['ビタミンB1', 'チアゾール環', 'ピリミジン環', '衛生'],
}
```

### フロントエンドのSVG表示

```typescript
// src/components/flashcard/renderers/StructuralRenderer.tsx

// SVGファイルを<img>タグで表示（PWAキャッシュ対応）
// タップで裏面にフリップ（既存のカードフリップアニメーション流用）
```

---

## 5. 品質管理

### 構造式カード固有のチェック項目

1. **SMILES検証**: RDKitでパース可能か（不正SMILESの検出）
2. **PubChem照合**: CIDからSMILESを再取得し一致確認
3. **物質名照合**: PubChem Compound名と一致するか
4. **SVGファイル存在確認**: media_url のパスにSVGがあるか
5. **L1の答えが物質名と一致**: back テキストに name_ja が含まれるか

### レビュー体制

- 薬剤師2名（開発者+ファウンダー）で全数レビュー（Phase 1は200枚なので可能）
- 特に立体化学（R/S, E/Z）と置換基位置に注意

---

## 6. コスト見積もり（Phase 1: 200枚）

| 工程 | ツール | コスト |
|------|--------|--------|
| SMILES取得 | PubChem API | 無料 |
| SVG生成 | RDKit（ローカル） | 無料 |
| カードテキスト | Claude Opus 4.6（MAXサブスク） | 追加なし |
| 品質検証 | GPT-5.4 Codex（サブスク） | 追加なし |
| **合計** | | **$0** |

---

## 7. 実装ステップ（新規セッション用）

```
Task 1: 物質名リスト + PubChem CID マッピング
  → structural-formula-registry.json（手動+API検証）

Task 2: PubChem SMILES一括取得スクリプト
  → scripts/fetch-pubchem-smiles.ts

Task 3: RDKit SVG生成スクリプト
  → scripts/generate-structure-svgs.py
  → public/images/structures/ に SVG出力

Task 4: Claude Opus カードテキスト生成スクリプト
  → scripts/generate-structural-cards.ts

Task 5: 品質検証 + 薬剤師レビュー

Task 6: FlashCardTemplate への統合
  → structural-flashcard-templates.json

Task 7: StructuralRenderer UIコンポーネント
  → src/components/flashcard/renderers/StructuralRenderer.tsx
```

---

## 8. 前提条件・依存

### 必要な環境

- Python 3.9+ with RDKit（`pip install rdkit` or conda）
- Node.js（既存）
- PubChem API（インターネット接続、認証不要）

### 既存コードとの関係

- `src/types/flashcard-template.ts`: CardFormat enum に構造式タイプ追加が必要
- `src/data/flashcard-templates.ts`: 構造式カードの追加先
- `src/components/flashcard/TemplatePractice.tsx`: format別レンダリング分岐追加
- `public/images/structures/`: 新規ディレクトリ

### 親specとの関係

- テキストカードパイプライン（knowledge atom → Claude生成）とは独立
- 構造式カードも `FlashCardTemplate` 型に統合される
- SM-2復習、PracticeContext、LearningLinkService は共通利用
