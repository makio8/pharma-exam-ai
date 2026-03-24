import { useMemo } from 'react'
import type { QuestionSection } from '../../../types/question'
import { PDF_FILE_MAP } from '../pdf-file-map'

export interface PageEstimate {
  page: number
  confidence: 'confirmed' | 'interpolated' | 'estimated'
  pdfFile: string
  pdfFileIndex: number
  totalFiles: number
}

const SECTION_RANGES: Record<string, [number, number]> = {
  '必須': [1, 90],
  '理論': [91, 195],
  '実践': [196, 345],
}

// 区分ごとのPDF 1ファイルあたりの推定ページ数
const PAGES_PER_FILE: Record<string, number> = {
  '必須': 30,
  '理論': 28,
  '実践': 20,
}

export function usePdfNavigation(
  questionId: string,
  questionNumber: number,
  year: number,
  section: QuestionSection,
  confirmedPages: Record<string, { pdfFile: string; page: number }>
) {
  const pdfFiles = useMemo(() => {
    const key = `${year}-${section}`
    return PDF_FILE_MAP[key] ?? []
  }, [year, section])

  const estimate = useMemo((): PageEstimate => {
    // 1. 確定済みページがあればそれを使う
    const confirmed = confirmedPages[questionId]
    if (confirmed) {
      const idx = pdfFiles.indexOf(confirmed.pdfFile)
      return {
        page: confirmed.page,
        confidence: 'confirmed',
        pdfFile: confirmed.pdfFile,
        pdfFileIndex: Math.max(0, idx),
        totalFiles: pdfFiles.length,
      }
    }

    // 2. 隣接問題の確定ページから補間
    // IDパターン: "r{year}-{qnum}"（例: r110-045）
    const [sectionStart, sectionEnd] = SECTION_RANGES[section] ?? [1, 345]
    const confirmedEntries: Array<{ qNum: number; pdfFile: string; page: number }> = []

    for (const [qId, data] of Object.entries(confirmedPages)) {
      const match = qId.match(/^r(\d+)-(\d+)$/)
      if (!match) continue
      const qYear = parseInt(match[1], 10)
      const qNum = parseInt(match[2], 10)
      if (qYear !== year) continue
      // 同一年度・同一区分の問題のみ（問番が区分範囲内か確認）
      if (qNum < sectionStart || qNum > sectionEnd) continue
      confirmedEntries.push({ qNum, pdfFile: data.pdfFile, page: data.page })
    }

    // 最も近い確定エントリを探して補間
    if (confirmedEntries.length > 0) {
      let nearest = confirmedEntries[0]
      let minDiff = Math.abs(questionNumber - nearest.qNum)
      for (const entry of confirmedEntries) {
        const diff = Math.abs(questionNumber - entry.qNum)
        if (diff < minDiff) {
          minDiff = diff
          nearest = entry
        }
      }
      const density = 0.7 // 1問あたりの推定ページ数
      const pageDiff = Math.round((questionNumber - nearest.qNum) * density)
      const interpolatedPage = Math.max(1, nearest.page + pageDiff)
      const idx = pdfFiles.indexOf(nearest.pdfFile)
      return {
        page: interpolatedPage,
        confidence: 'interpolated',
        pdfFile: nearest.pdfFile,
        pdfFileIndex: Math.max(0, idx),
        totalFiles: pdfFiles.length,
      }
    }

    // 3. 線形按分
    const position = Math.max(
      0,
      Math.min(1, (questionNumber - sectionStart) / Math.max(1, sectionEnd - sectionStart))
    )

    const pdfFileIndex =
      pdfFiles.length > 1
        ? Math.min(Math.floor(position * pdfFiles.length), pdfFiles.length - 1)
        : 0
    const pdfFile = pdfFiles[pdfFileIndex] ?? pdfFiles[0] ?? ''

    // ファイル内での相対位置を計算
    const filePosition =
      pdfFiles.length > 1
        ? (position * pdfFiles.length) - pdfFileIndex
        : position

    const pagesPerFile = PAGES_PER_FILE[section] ?? 30
    const estimatedPage = Math.max(1, Math.round(filePosition * pagesPerFile) + 1)

    return {
      page: estimatedPage,
      confidence: 'estimated',
      pdfFile,
      pdfFileIndex,
      totalFiles: pdfFiles.length,
    }
  }, [questionId, questionNumber, section, year, pdfFiles, confirmedPages])

  return { estimate, pdfFiles }
}
