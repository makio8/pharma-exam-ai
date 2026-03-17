/**
 * 厚労省 薬剤師国家試験 正答PDFから正答番号を抽出するスクリプト
 *
 * 使い方:
 *   npx tsx scripts/extract-answers.ts
 *
 * 前提:
 *   - poppler-utils (pdftotext) がインストール済み
 *   - PDFが /tmp/claude/seitou-{107,108,109,110}.pdf に保存済み
 *
 * 出力:
 *   /tmp/claude/answers-{107,108,109,110}.json
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

interface ExamAnswers {
  year: number;
  answers: Record<string, number | number[] | string>;
}

/**
 * PDFからlayout付きテキストを抽出
 */
function extractTextFromPdf(pdfPath: string): string {
  const txtPath = pdfPath.replace(".pdf", "-layout.txt");
  execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`);
  return readFileSync(txtPath, "utf-8");
}

/**
 * layout付きテキストから問題番号と正答をパースする
 *
 * パターン:
 *   "  1 物理 3"          → { "1": 3 }
 *   "151 薬理   2 5"      → { "151": [2, 5] }
 *   "328 実務 解なし"      → { "328": "解なし" }
 *   "119 生物 1,3,5※"     → { "119": [1, 3, 5] }
 *   "305 実務 1,3,5※"     → { "305": [1, 3, 5] }
 *   "331 実務 1,2,5※"     → { "331": [1, 2, 5] }
 */
function parseAnswers(text: string, year: number): ExamAnswers {
  const answers: Record<string, number | number[] | string> = {};

  // 正規表現: 問No(数字) 科目(日本語) 正答(数字、スペース区切り or カンマ区切り or 解なし)
  // 段組みの行をスキャンし、マッチするパターンを探す
  const lines = text.split("\n");

  for (const line of lines) {
    // 各行から複数のエントリを抽出（段組みで1行に複数問がある）
    // パターン: 数字(1-3桁) + 科目名 + 正答
    const regex =
      /(\d{1,3})\s+(物理|化学|生物|衛生|薬理|薬剤|病態|法規|実務)\s+([\d,※\s]+|解なし)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const questionNo = match[1];
      const answerStr = match[3].trim();

      // 既にパース済みで、同じ問題番号が出てきた場合はスキップ
      // （ヘッダー行の「問No 科目 正答」等は数字がないのでマッチしない）
      if (answers[questionNo] !== undefined) continue;

      if (answerStr === "解なし") {
        answers[questionNo] = "解なし";
      } else if (answerStr.includes(",")) {
        // "1,3,5※" のようなカンマ区切り形式
        const nums = answerStr
          .replace("※", "")
          .split(",")
          .map((s) => parseInt(s.trim()))
          .filter((n) => !isNaN(n));
        answers[questionNo] = nums;
      } else {
        // スペース区切り（"2 5" → [2, 5]）または単一数字（"3" → 3）
        const nums = answerStr
          .split(/\s+/)
          .map((s) => parseInt(s.trim()))
          .filter((n) => !isNaN(n));

        if (nums.length === 0) continue;
        if (nums.length === 1) {
          answers[questionNo] = nums[0];
        } else {
          answers[questionNo] = nums;
        }
      }
    }
  }

  return { year, answers };
}

/**
 * 結果を検証し、問題数をチェック
 */
function validate(result: ExamAnswers): void {
  const keys = Object.keys(result.answers).map(Number).sort((a, b) => a - b);
  const count = keys.length;
  const min = keys[0];
  const max = keys[keys.length - 1];

  console.log(
    `  第${result.year}回: ${count}問抽出 (問${min}〜問${max})`
  );

  // 欠落チェック
  const missing: number[] = [];
  for (let i = 1; i <= 345; i++) {
    if (!result.answers[String(i)]) {
      missing.push(i);
    }
  }
  if (missing.length > 0) {
    console.warn(`  ⚠ 欠落: ${missing.join(", ")}`);
  }

  // 正答値の妥当性チェック（1-6 or 配列 or 解なし）
  let invalid = 0;
  for (const [q, a] of Object.entries(result.answers)) {
    if (a === "解なし") continue;
    if (typeof a === "number") {
      if (a < 1 || a > 6) {
        console.warn(`  ⚠ 問${q}: 不正な正答値 ${a}`);
        invalid++;
      }
    } else if (Array.isArray(a)) {
      for (const v of a) {
        if (v < 1 || v > 6) {
          console.warn(`  ⚠ 問${q}: 不正な正答値 ${v} in [${a}]`);
          invalid++;
        }
      }
    }
  }
  if (invalid > 0) {
    console.warn(`  ⚠ ${invalid}件の不正な正答値`);
  }
}

// メイン処理
const exams = [107, 108, 109, 110];

console.log("=== 薬剤師国家試験 正答抽出 ===\n");

for (const year of exams) {
  const pdfPath = `/tmp/claude/seitou-${year}.pdf`;
  console.log(`処理中: 第${year}回 (${pdfPath})`);

  const text = extractTextFromPdf(pdfPath);
  const result = parseAnswers(text, year);
  validate(result);

  const outPath = `/tmp/claude/answers-${year}.json`;
  writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
  console.log(`  → ${outPath} に保存\n`);
}

console.log("完了！");
