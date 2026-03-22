#!/bin/bash
# 100-110回の試験問題PDFをダウンロード
# Usage: bash scripts/download-exam-pdfs.sh

BASE="https://www.mhlw.go.jp"
DIR="data/pdfs"
mkdir -p "$DIR"

echo "=== 第100回 ==="
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000079164.pdf" -o "$DIR/q100-hissu.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000079165.pdf" -o "$DIR/q100-riron1.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000079166.pdf" -o "$DIR/q100-riron2.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000079167.pdf" -o "$DIR/q100-jissen1.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000079169.pdf" -o "$DIR/q100-jissen2.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000079170.pdf" -o "$DIR/q100-jissen3.pdf"

echo "=== 第101回 ==="
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000117675.pdf" -o "$DIR/q101-hissu.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000117674.pdf" -o "$DIR/q101-riron1.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000117676.pdf" -o "$DIR/q101-riron2.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000117677.pdf" -o "$DIR/q101-jissen1.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000117678.pdf" -o "$DIR/q101-jissen2.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000117679.pdf" -o "$DIR/q101-jissen3.pdf"

echo "=== 第102回 ==="
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/20170626-1.pdf" -o "$DIR/q102-hissu.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/20170626-2.pdf" -o "$DIR/q102-riron1.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/20170626-3.pdf" -o "$DIR/q102-riron2.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/20170626-4.pdf" -o "$DIR/q102-jissen1.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/20170626-5.pdf" -o "$DIR/q102-jissen2.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/20170626-6.pdf" -o "$DIR/q102-jissen3.pdf"

echo "=== 第103回 ==="
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000198931.pdf" -o "$DIR/q103-hissu.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000198932.pdf" -o "$DIR/q103-riron1.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000198934.pdf" -o "$DIR/q103-riron2.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000198935.pdf" -o "$DIR/q103-jissen1.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000198936.pdf" -o "$DIR/q103-jissen2.pdf"
curl -sL "$BASE/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000198937.pdf" -o "$DIR/q103-jissen3.pdf"

echo "=== 第104回 ==="
curl -sL "$BASE/content/000491249.pdf" -o "$DIR/q104-hissu.pdf"
curl -sL "$BASE/content/000491250.pdf" -o "$DIR/q104-riron1.pdf"
curl -sL "$BASE/content/000491251.pdf" -o "$DIR/q104-riron2.pdf"
curl -sL "$BASE/content/000491252.pdf" -o "$DIR/q104-jissen1.pdf"
curl -sL "$BASE/content/000491253.pdf" -o "$DIR/q104-jissen2.pdf"
curl -sL "$BASE/content/000491254.pdf" -o "$DIR/q104-jissen3.pdf"

echo "=== 第105回 ==="
curl -sL "$BASE/content/000610330.pdf" -o "$DIR/q105-hissu.pdf"
curl -sL "$BASE/content/000610331.pdf" -o "$DIR/q105-riron1.pdf"
curl -sL "$BASE/content/000610332.pdf" -o "$DIR/q105-riron2.pdf"
curl -sL "$BASE/content/000610333.pdf" -o "$DIR/q105-jissen1.pdf"
curl -sL "$BASE/content/000610334.pdf" -o "$DIR/q105-jissen2.pdf"
curl -sL "$BASE/content/000610335.pdf" -o "$DIR/q105-jissen3.pdf"

echo "=== 第106回 ==="
curl -sL "$BASE/content/000756019.pdf" -o "$DIR/q106-hissu.pdf"
curl -sL "$BASE/content/000756020.pdf" -o "$DIR/q106-riron1.pdf"
curl -sL "$BASE/content/000756021.pdf" -o "$DIR/q106-riron2.pdf"
curl -sL "$BASE/content/000756022.pdf" -o "$DIR/q106-jissen1.pdf"
curl -sL "$BASE/content/000756023.pdf" -o "$DIR/q106-jissen2.pdf"
curl -sL "$BASE/content/000756024.pdf" -o "$DIR/q106-jissen3.pdf"

echo "=== 第107回 ==="
curl -sL "$BASE/content/000915525.pdf" -o "$DIR/q107-hissu.pdf"
curl -sL "$BASE/content/000915526.pdf" -o "$DIR/q107-riron1.pdf"
curl -sL "$BASE/content/000915527.pdf" -o "$DIR/q107-riron2.pdf"
curl -sL "$BASE/content/000915529.pdf" -o "$DIR/q107-jissen1.pdf"
curl -sL "$BASE/content/000915530.pdf" -o "$DIR/q107-jissen2.pdf"
curl -sL "$BASE/content/000915531.pdf" -o "$DIR/q107-jissen3.pdf"

echo "=== 第108回 ==="
curl -sL "$BASE/content/001074628.pdf" -o "$DIR/q108-hissu.pdf"
curl -sL "$BASE/content/001074629.pdf" -o "$DIR/q108-riron1.pdf"
curl -sL "$BASE/content/001074630.pdf" -o "$DIR/q108-riron2.pdf"
curl -sL "$BASE/content/001074631.pdf" -o "$DIR/q108-jissen1.pdf"
curl -sL "$BASE/content/001074632.pdf" -o "$DIR/q108-jissen2.pdf"
curl -sL "$BASE/content/001074633.pdf" -o "$DIR/q108-jissen3.pdf"

echo "=== 第109回 ==="
curl -sL "$BASE/content/001226759.pdf" -o "$DIR/q109-hissu.pdf"
curl -sL "$BASE/content/001226760.pdf" -o "$DIR/q109-riron1.pdf"
curl -sL "$BASE/content/001226761.pdf" -o "$DIR/q109-riron2.pdf"
curl -sL "$BASE/content/001226762.pdf" -o "$DIR/q109-jissen1.pdf"
curl -sL "$BASE/content/001226763.pdf" -o "$DIR/q109-jissen2.pdf"
curl -sL "$BASE/content/001226764.pdf" -o "$DIR/q109-jissen3.pdf"

echo "=== 第110回 ==="
curl -sL "$BASE/content/001455149.pdf" -o "$DIR/q110-hissu.pdf"
curl -sL "$BASE/content/001455152.pdf" -o "$DIR/q110-riron1.pdf"
curl -sL "$BASE/content/001455159.pdf" -o "$DIR/q110-riron2.pdf"
curl -sL "$BASE/content/001455160.pdf" -o "$DIR/q110-jissen1.pdf"
curl -sL "$BASE/content/001455161.pdf" -o "$DIR/q110-jissen2.pdf"
curl -sL "$BASE/content/001455162.pdf" -o "$DIR/q110-jissen3.pdf"

echo ""
echo "=== ダウンロード結果 ==="
for y in 100 101 102 103 104 105 106 107 108 109 110; do
  count=$(ls -1 "$DIR"/q${y}-*.pdf 2>/dev/null | wc -l | tr -d ' ')
  total_size=$(du -sh "$DIR"/q${y}-*.pdf 2>/dev/null | tail -1 | cut -f1)
  echo "第${y}回: ${count}ファイル"
done
