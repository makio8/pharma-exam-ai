import styles from './QuestionBody.module.css'

interface Props {
  bodyText: string
  imageUrl?: string
  displayMode: 'text' | 'image' | 'both'
}

export function QuestionBody({ bodyText, imageUrl, displayMode }: Props) {
  const showImage = displayMode === 'image' || displayMode === 'both'
  const showText = displayMode === 'text' || displayMode === 'both'

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
        <p className={styles.text}>{bodyText}</p>
      )}
    </div>
  )
}
