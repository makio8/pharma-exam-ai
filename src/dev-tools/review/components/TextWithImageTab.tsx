import type { ChangeEvent } from 'react'
import type { CropImage } from '../types'
import styles from './TextWithImageTab.module.css'

interface TextWithImageTabProps {
  text: string
  images: CropImage[]
  onTextChange: (text: string) => void
  onCursorChange: (pos: number) => void
  onRemoveImage: (imageId: number) => void
  onApply: () => void
  onStartCrop: () => void
  previews: Map<string, string>
  previewKeyPrefix: string
  hasChanges: boolean
  disabled?: boolean
  disabledMessage?: string
  warnings: string[]
}

export function TextWithImageTab({
  text,
  images,
  onTextChange,
  onCursorChange,
  onRemoveImage,
  onApply,
  onStartCrop,
  previews,
  previewKeyPrefix,
  hasChanges,
  disabled,
  disabledMessage,
  warnings,
}: TextWithImageTabProps) {

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onTextChange(e.target.value)
  }

  function handleSelect(e: ChangeEvent<HTMLTextAreaElement>) {
    onCursorChange(e.target.selectionStart)
  }

  function handleClick(e: React.MouseEvent<HTMLTextAreaElement>) {
    const target = e.target as HTMLTextAreaElement
    onCursorChange(target.selectionStart)
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const target = e.target as HTMLTextAreaElement
    onCursorChange(target.selectionStart)
  }

  return (
    <div className={styles.container}>
      {disabled && disabledMessage && (
        <p className={styles.disabledMessage}>{disabledMessage}</p>
      )}

      <textarea
        className={styles.textarea}
        value={text}
        onChange={handleTextChange}
        onSelect={handleSelect}
        onClick={handleClick}
        onKeyUp={handleKeyUp}
        rows={8}
        disabled={disabled}
      />

      <button
        className={styles.cropBtn}
        onClick={onStartCrop}
        disabled={disabled}
        type="button"
      >
        PDFからクロップ
      </button>

      {/* 画像サムネイルグリッド */}
      {images.length > 0 && (
        <div className={styles.imageGrid}>
          {images.map(img => {
            const previewKey = `${previewKeyPrefix}-${img.id}`
            const previewUrl = previews.get(previewKey)
            return (
              <div key={img.id} className={styles.imageItem}>
                {previewUrl ? (
                  <img
                    className={styles.imageThumb}
                    src={previewUrl}
                    alt={`image ${img.id}`}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    #{img.id}
                  </div>
                )}
                <span className={styles.imageLabel}>
                  {'{{image:' + img.id + '}}'}
                </span>
                <button
                  className={styles.imageRemoveBtn}
                  onClick={() => onRemoveImage(img.id)}
                  type="button"
                  title={`画像 ${img.id} を削除`}
                  aria-label={`画像 ${img.id} を削除`}
                >
                  x
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* 警告メッセージ */}
      {warnings.length > 0 && (
        <div className={styles.warningList}>
          {warnings.map((w, i) => (
            <div key={i} className={styles.warningItem}>{w}</div>
          ))}
        </div>
      )}

      {/* 適用ボタン */}
      <button
        className={styles.applyBtn}
        onClick={onApply}
        disabled={disabled || !hasChanges}
        type="button"
      >
        適用
      </button>
    </div>
  )
}
