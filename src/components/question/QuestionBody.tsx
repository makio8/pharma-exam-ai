import type { ReactNode } from 'react'
import styles from './QuestionBody.module.css'

interface Props {
  bodyText: string
  imageUrl?: string
  inlineImageUrls?: string[]
  displayMode: 'text' | 'image' | 'both'
}

function renderInlineBody(bodyText: string, inlineImageUrls: string[]) {
  const nodes: ReactNode[] = []
  const pattern = /\{\{image:(\d+)\}\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(bodyText)) !== null) {
    const textPart = bodyText.slice(lastIndex, match.index)
    if (textPart.trim().length > 0 || textPart.includes('\n')) {
      nodes.push(
        <p key={`text-${lastIndex}`} className={styles.text}>
          {textPart}
        </p>
      )
    }

    const url = inlineImageUrls[Number(match[1]) - 1]
    if (url) {
      nodes.push(
        <img
          key={`img-${match[1]}-${match.index}`}
          src={url}
          alt={`問題内画像 ${match[1]}`}
          className={styles.inlineImage}
        />
      )
    }

    lastIndex = match.index + match[0].length
  }

  const tail = bodyText.slice(lastIndex)
  if (tail.trim().length > 0 || tail.includes('\n')) {
    nodes.push(
      <p key={`text-tail-${lastIndex}`} className={styles.text}>
        {tail}
      </p>
    )
  }

  return nodes
}

export function QuestionBody({ bodyText, imageUrl, inlineImageUrls = [], displayMode }: Props) {
  const showImage = displayMode === 'image' || displayMode === 'both'
  const showText = displayMode === 'text' || displayMode === 'both'
  const hasInlineImages = inlineImageUrls.length > 0 && /\{\{image:\d+\}\}/.test(bodyText)

  return (
    <div className={styles.container}>
      {showImage && (
        imageUrl ? (
          <img
            src={imageUrl}
            alt="問題の図"
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>図が表示されます</div>
        )
      )}
      {showText && (
        hasInlineImages ? (
          <div className={styles.richText}>
            {renderInlineBody(bodyText, inlineImageUrls)}
          </div>
        ) : (
          <p className={styles.text}>{bodyText}</p>
        )
      )}
    </div>
  )
}
