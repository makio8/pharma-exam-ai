// src/dev-tools/fusen-annotate/types.ts

// [y1, x1, y2, x2] — 0〜1000正規化、top-left原点
// 既存 FusenSource.bbox / ocr-fusens.ts と同じスケール
export type NormalizedBbox = [number, number, number, number]

export type PageStatus = 'in-progress' | 'done' | 'skipped'

export interface PageAnnotation {
  status: PageStatus
  bboxes: NormalizedBbox[]
}

export interface AnnotationState {
  version: 1
  source: string
  pages: Record<string, PageAnnotation>
  lastPosition: string
  updatedAt: string
}

// エクスポート用（noteIndex 明示）
export interface ExportBbox {
  noteIndex: number
  bbox: NormalizedBbox
}

export interface ExportPage {
  pageId: string
  spreadPage: number
  side: 'left' | 'right'
  status: 'done' | 'skipped'
  bboxes: ExportBbox[]
}

export interface ExportJson {
  version: '1.0.0'
  source: string
  exportedAt: string
  summary: {
    totalPages: number
    annotatedPages: number
    skippedPages: number
    totalBboxes: number
  }
  pages: ExportPage[]
}

export interface SourceMeta {
  name: string
  pdf: string
  totalPages: number
  splitImages: number
  createdAt: string
}
