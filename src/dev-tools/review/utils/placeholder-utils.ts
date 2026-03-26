import type { CropImage } from '../types'

const PLACEHOLDER_RE = /\{\{image:(\d+)\}\}/g

export type ParsedBlock =
  | { type: 'text'; content: string }
  | { type: 'image'; imageId: number }

/**
 * Split text on {{image:N}} placeholders, returning an array of text/image blocks.
 * If an image ID is not found in the images array, the placeholder is treated as plain text.
 */
export function parseTextWithImages(text: string, images: CropImage[]): ParsedBlock[] {
  if (text === '') return []

  const imageIds = new Set(images.map(img => img.id))
  const blocks: ParsedBlock[] = []
  let lastIndex = 0
  const re = new RegExp(PLACEHOLDER_RE.source, 'g')

  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const imageId = parseInt(match[1], 10)

    if (!imageIds.has(imageId)) {
      // Treat unknown ID as plain text — skip this match, continue
      continue
    }

    // Push any text before this match
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    blocks.push({ type: 'image', imageId })
    lastIndex = match.index + match[0].length
  }

  // Remaining text after last valid placeholder
  if (lastIndex < text.length) {
    blocks.push({ type: 'text', content: text.slice(lastIndex) })
  }

  // If there were no valid placeholders at all, we may have accumulated only text blocks
  // but the unknown-ID placeholders are already in the text as-is since we skipped them.
  // Consolidate adjacent text blocks.
  return mergeAdjacentTextBlocks(blocks)
}

function mergeAdjacentTextBlocks(blocks: ParsedBlock[]): ParsedBlock[] {
  const result: ParsedBlock[] = []
  for (const block of blocks) {
    const last = result[result.length - 1]
    if (block.type === 'text' && last?.type === 'text') {
      result[result.length - 1] = { type: 'text', content: last.content + block.content }
    } else {
      result.push(block)
    }
  }
  return result
}

/**
 * Insert {{image:N}} at the given cursor position in text.
 * Returns the new text and the cursor position after the inserted placeholder.
 */
export function insertPlaceholder(
  text: string,
  cursorPos: number,
  imageId: number,
): { text: string; newCursorPos: number } {
  const placeholder = `{{image:${imageId}}}`
  const newText = text.slice(0, cursorPos) + placeholder + text.slice(cursorPos)
  return { text: newText, newCursorPos: cursorPos + placeholder.length }
}

/**
 * Remove ALL occurrences of {{image:N}} from text.
 * If the placeholder is on its own line (\n{{image:N}}\n), the surrounding newlines are collapsed to a single \n.
 */
export function removePlaceholder(text: string, imageId: number): string {
  const escapedId = String(imageId)
  // First remove "line-alone" patterns to collapse double newlines
  const lineRe = new RegExp(`\\n\\{\\{image:${escapedId}\\}\\}\\n`, 'g')
  let result = text.replace(lineRe, '\n')
  // Then remove any remaining occurrences
  const inlineRe = new RegExp(`\\{\\{image:${escapedId}\\}\\}`, 'g')
  result = result.replace(inlineRe, '')
  return result
}

/**
 * Validate that all placeholders in text have a corresponding image, and all images appear in text.
 * Returns orphanPlaceholders (IDs in text not in images) and unreferencedImages (image IDs not in text).
 */
export function validateImagePlaceholders(
  text: string,
  images: CropImage[],
): { orphanPlaceholders: number[]; unreferencedImages: number[] } {
  const re = new RegExp(PLACEHOLDER_RE.source, 'g')
  const placeholderIds = new Set<number>()
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    placeholderIds.add(parseInt(match[1], 10))
  }

  const imageIds = new Set(images.map(img => img.id))

  const orphanPlaceholders = [...placeholderIds].filter(id => !imageIds.has(id))
  const unreferencedImages = [...imageIds].filter(id => !placeholderIds.has(id))

  return { orphanPlaceholders, unreferencedImages }
}

/**
 * Return the next available image ID (max existing ID + 1, or 1 if empty).
 */
export function nextImageId(images: CropImage[]): number {
  if (images.length === 0) return 1
  return Math.max(...images.map(img => img.id)) + 1
}
