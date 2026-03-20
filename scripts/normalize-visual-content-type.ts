/**
 * visual_content_type の値を正規化するスクリプト
 *
 * 正規値（canonical）: structural_formula, graph, table, diagram, prescription, text_only, mixed
 * AI Vision 抽出で生じた非正規値を正規値にマッピングして置換する
 */

import { readFileSync, writeFileSync } from "fs";
import { globSync } from "glob";

// 正規値の一覧
const CANONICAL = new Set([
  "structural_formula",
  "graph",
  "table",
  "diagram",
  "prescription",
  "text_only",
  "mixed",
]);

// 非正規値 → 正規値 のマッピング
const MAPPING: Record<string, string> = {
  // prescription 系
  text_with_prescription: "prescription",
  form: "prescription",

  // diagram 系
  text_with_figure: "diagram",
  biochemical_pathway: "diagram",
  anatomy_diagram: "diagram",
  reaction_pathway: "diagram",
  reaction_mechanism: "diagram",

  // structural_formula 系
  reaction_scheme: "structural_formula",
  peptide_sequence: "structural_formula",
  formula: "structural_formula",
  equation: "structural_formula",
  chemical_structure: "structural_formula",
  chemical_reaction_scheme: "structural_formula",
  reaction_scheme_and_structural_formula: "structural_formula",
  structural_formula_and_text: "structural_formula",

  // graph 系
  spectrum: "graph",
  chart: "graph",
  line_graph: "graph",
  bar_chart: "graph",

  // table 系
  table_with_structures: "table",
  structural_formula_table: "table",

  // mixed 系
  photograph: "mixed",
  diagram_with_table: "mixed",
  diagram_and_table: "mixed",
  graph_and_table: "mixed",
  structural_formula_with_flowchart: "mixed",
  text_with_calculation: "mixed",

  // text_only 系
  none: "text_only",
};

function normalize(value: string): string {
  if (CANONICAL.has(value)) return value;
  return MAPPING[value] ?? "mixed";
}

// メイン処理
const files = globSync("src/data/real-questions/exam-*.ts", {
  cwd: process.cwd(),
  absolute: true,
});

let totalReplacements = 0;
const changes: Record<string, number> = {};

for (const file of files) {
  let content = readFileSync(file, "utf-8");
  let fileReplacements = 0;

  content = content.replace(
    /("visual_content_type": )"([^"]*)"/g,
    (_match, prefix, value) => {
      const normalized = normalize(value);
      if (normalized !== value) {
        fileReplacements++;
        const key = `${value} → ${normalized}`;
        changes[key] = (changes[key] || 0) + 1;
      }
      return `${prefix}"${normalized}"`;
    }
  );

  if (fileReplacements > 0) {
    writeFileSync(file, content, "utf-8");
    totalReplacements += fileReplacements;
    console.log(`  ${file.split("/").pop()}: ${fileReplacements} 件置換`);
  }
}

console.log(`\n合計: ${totalReplacements} 件の非正規値を置換`);
console.log("\n変換内訳:");
for (const [key, count] of Object.entries(changes).sort(
  (a, b) => b[1] - a[1]
)) {
  console.log(`  ${key}: ${count} 件`);
}
