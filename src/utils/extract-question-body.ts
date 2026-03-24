/**
 * question_text から該当問題の本文だけを抽出
 *
 * 連問では1つの question_text に複数問分のテキストが結合されていることがある:
 *   "シナリオ...\n問196（実務）\n質問文196...\n問197（実務）\n質問文197..."
 *
 * この関数は questionNumber に該当する部分だけを抽出する
 */
export function extractQuestionBody(questionText: string, questionNumber: number, scenario: string): string {
  // まずシナリオ部分を除去
  let text = questionText
  if (scenario && text.startsWith(scenario)) {
    text = text.slice(scenario.length).trim()
  }

  // 「問XXX」マーカーで分割
  const questionPattern = /問(\d+)\s*[（(]([^）)]*)[）)]\s*\n?/g
  const markers: { num: number; start: number; end: number }[] = []
  let m: RegExpExecArray | null
  while ((m = questionPattern.exec(text)) !== null) {
    markers.push({ num: parseInt(m[1], 10), start: m.index, end: m.index + m[0].length })
  }

  if (markers.length === 0) {
    // マーカーがない場合：問番号ヘッダーだけ除去して返す
    return text.replace(/^問\d+\s*[（(][^）)]*[）)]\s*\n*/g, '')
      .replace(/^問\d+\s*\n+/g, '')
      .trim() || questionText
  }

  // 該当する問番号のマーカーを探す
  const myMarker = markers.find((mk) => mk.num === questionNumber)
  if (!myMarker) {
    // 自分の番号がない場合（最初の問題にマーカーがないケース等）
    // → 最初のマーカーの手前のテキストを使う
    if (markers[0].start > 0) {
      const beforeFirst = text.slice(0, markers[0].start).trim()
      if (beforeFirst.length > 10) return beforeFirst
    }
    return text.replace(/^問\d+\s*[（(][^）)]*[）)]\s*\n*/g, '').trim() || questionText
  }

  // 自分のマーカーから次のマーカーまでを抽出
  const myIndex = markers.indexOf(myMarker)
  const nextMarker = markers[myIndex + 1]
  const bodyStart = myMarker.end
  const bodyEnd = nextMarker ? nextMarker.start : text.length
  const body = text.slice(bodyStart, bodyEnd).trim()

  return body || questionText
}
