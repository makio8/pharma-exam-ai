/**
 * 厚労省 薬剤師国家試験 正答PDFから正答番号を抽出するスクリプト
 *
 * 使い方:
 *   node scripts/extract-answers.mjs
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

/**
 * PDFからlayout付きテキストを抽出
 */
function extractTextFromPdf(pdfPath) {
  const txtPath = pdfPath.replace(".pdf", "-layout.txt");
  execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`);
  return readFileSync(txtPath, "utf-8");
}

/**
 * layout付きテキストから問題番号と正答をパースする
 *
 * 戦略: 行全体に対して「問No 科目」のパターンをglobalでマッチさせ、
 * 各マッチの直後〜次のマッチ（または行末）までを正答領域とする。
 * 正答領域内の1-6の数字のみを正答として取得する。
 */
function parseAnswers(text, year) {
  const answers = {};
  const lines = text.split("\n");

  // 科目名パターン
  const subjectPattern = "物理|化学|生物|衛生|薬理|薬剤|病態|法規|実務";

  for (const line of lines) {
    // 行内の全「問No 科目」マッチ位置を取得
    const entryRegex = new RegExp(
      `(\\d{1,3})\\s+(${subjectPattern})\\s+`,
      "g"
    );

    const entries = [];
    let m;
    while ((m = entryRegex.exec(line)) !== null) {
      entries.push({
        questionNo: m[1],
        matchEnd: m.index + m[0].length, // 正答の開始位置
      });
    }

    // 各エントリの正答を、その位置〜次エントリの問題番号開始位置（or 行末）から取得
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const qNum = parseInt(entry.questionNo);
      if (qNum < 1 || qNum > 345) continue;
      if (answers[entry.questionNo] !== undefined) continue;

      // 正答領域の終了位置: 次のエントリの開始位置 or 行末
      const nextEntryStart = (i + 1 < entries.length)
        ? line.indexOf(entries[i + 1].questionNo, entries[i + 1].matchEnd - entries[i + 1].questionNo.length - 10)
        : line.length;

      // 次のエントリのマッチ位置を使って、正答テキスト領域を特定
      let answerEnd;
      if (i + 1 < entries.length) {
        // 次のエントリの正規表現マッチ位置（問題番号の先頭）
        // entries配列を使ってmatchEndからさかのぼって次の問題番号の開始位置を推定
        // 実は matchEnd はマッチの終わり（科目+スペースの後）なので、
        // 次エントリの問題番号開始位置はそこからさかのぼる
        // →シンプルに次のentryRegexマッチ全体の開始位置を記録する
        answerEnd = findNextEntryStart(line, entry.matchEnd, subjectPattern);
      } else {
        answerEnd = line.length;
      }

      const answerText = line.substring(entry.matchEnd, answerEnd).trim();

      if (!answerText) continue;

      if (answerText === "解なし") {
        answers[entry.questionNo] = "解なし";
        continue;
      }

      // カンマ区切り: "1,3,5※"
      if (answerText.includes(",")) {
        const nums = answerText
          .replace("※", "")
          .split(",")
          .map(s => parseInt(s.trim()))
          .filter(n => !isNaN(n) && n >= 1 && n <= 6);
        if (nums.length > 0) {
          answers[entry.questionNo] = nums;
        }
        continue;
      }

      // スペース区切りの数字を取得（1-6のみ）
      const nums = answerText
        .replace("※", "")
        .split(/\s+/)
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n >= 1 && n <= 6);

      if (nums.length === 0) continue;
      if (nums.length === 1) {
        answers[entry.questionNo] = nums[0];
      } else {
        answers[entry.questionNo] = nums;
      }
    }
  }

  return { year, answers };
}

/**
 * 指定位置以降で次の「数字 科目名」パターンが始まる位置を返す
 */
function findNextEntryStart(line, startPos, subjectPattern) {
  const regex = new RegExp(`\\d{1,3}\\s+(?:${subjectPattern})\\s+`, "g");
  regex.lastIndex = startPos;
  const m = regex.exec(line);
  if (m && m.index >= startPos) {
    return m.index;
  }
  return line.length;
}

/**
 * 結果を検証
 */
function validate(result) {
  const keys = Object.keys(result.answers).map(Number).sort((a, b) => a - b);
  const count = keys.length;
  const min = keys[0];
  const max = keys[keys.length - 1];

  console.log(`  第${result.year}回: ${count}問抽出 (問${min}〜問${max})`);

  const expectedMax = 345;
  const missing = [];
  for (let i = 1; i <= expectedMax; i++) {
    if (result.answers[String(i)] === undefined) {
      missing.push(i);
    }
  }
  if (missing.length > 0) {
    console.warn(`  ⚠ 欠落 (${missing.length}問): ${missing.join(", ")}`);
  } else {
    console.log("  ✓ 全345問を抽出");
  }

  // 正答値の妥当性チェック
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
  } else {
    console.log("  ✓ 正答値はすべて有効");
  }
}

// メイン処理
// CLI引数で年度指定可能: node scripts/extract-answers.mjs 100 101 102
const cliYears = process.argv.slice(2).map(Number).filter(n => n > 0);
const exams = cliYears.length > 0 ? cliYears : [107, 108, 109, 110];

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
