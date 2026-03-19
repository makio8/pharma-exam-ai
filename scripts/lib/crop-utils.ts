import sharp from 'sharp'
import type { QuestionPosition } from './bbox-parser.ts'

export const PDF_DPI = 72
export const IMAGE_DPI = 200
export const SCALE = IMAGE_DPI / PDF_DPI  // ≈ 2.778

export const MARGIN_TOP = 20    // px (image pixels)
export const MARGIN_BOTTOM = 30 // px

export interface CropRegion {
  left: number
  top: number
  width: number
  height: number
}

/** PDF coordinates (points) → image pixel coordinates */
export function pdfToPixel(pdfCoord: number): number {
  return Math.round(pdfCoord * SCALE)
}

/** Calculate crop region for a question */
export function calcCropRegion(
  qPos: QuestionPosition,
  nextQPos: QuestionPosition | null,
  pageWidthPdf: number,
  pageHeightPdf: number,
  imageHeight: number  // actual image height from sharp metadata
): CropRegion {
  const imgWidth = pdfToPixel(pageWidthPdf)
  let top = pdfToPixel(qPos.yMin) - MARGIN_TOP
  let bottom: number
  if (nextQPos) {
    bottom = pdfToPixel(nextQPos.yMin) - MARGIN_BOTTOM  // up to before next question
  } else {
    bottom = imageHeight - 10  // page bottom with small margin
  }
  // Clamp
  top = Math.max(0, top)
  bottom = Math.min(imageHeight, bottom)
  return { left: 0, top, width: imgWidth, height: bottom - top }
}

/** Crop image using sharp and save */
export async function cropImage(
  srcPath: string,
  region: CropRegion,
  destPath: string
): Promise<boolean> {
  try {
    const metadata = await sharp(srcPath).metadata()
    const w = Math.min(region.width, metadata.width ?? region.width)
    const h = Math.min(region.height, (metadata.height ?? region.height) - region.top)
    if (h <= 0 || w <= 0) return false
    await sharp(srcPath)
      .extract({ left: region.left, top: region.top, width: w, height: Math.max(1, h) })
      .toFile(destPath)
    return true
  } catch (e) {
    console.error(`  ✗ crop failed: ${srcPath} → ${destPath}:`, (e as Error).message)
    return false
  }
}
