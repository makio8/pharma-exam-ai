import { useState, useEffect, useRef, useCallback } from 'react'
import type { Question } from '../../../types/question'
import type { Correction, CropTarget, CropImage, PendingCropResult } from '../types'
import { replaceCorrections, removeCorrection, getEffectiveText } from '../utils/correction-utils'
import { insertPlaceholder, removePlaceholder, validateImagePlaceholders, nextImageId } from '../utils/placeholder-utils'
import { TextWithImageTab } from './TextWithImageTab'
import styles from './CorrectionPanel.module.css'

type CorrectionTab = 'question-text' | 'text' | 'choices' | 'answer' | 'scenario' | 'image-remove'

const TEXT_FIELDS = [
  { value: 'explanation', label: '解説' },
  { value: 'category', label: 'カテゴリ' },
] as const

interface CorrectionPanelProps {
  question: Question
  corrections: Correction[]
  onReplaceCorrections: (corrections: Correction[]) => void
  onRemoveCorrection: (index: number) => void
  onAddScenarioCorrection: (corrections: Correction[]) => number
  onStartCrop: (target: CropTarget) => void
  pendingCropResult: PendingCropResult | null
  onConsumeCropResult: () => void
  previews: Map<string, string>
  onUpdatePreviews: (key: string, dataUrl: string) => void
}

export function CorrectionPanel({
  question,
  corrections,
  onReplaceCorrections,
  onRemoveCorrection,
  onAddScenarioCorrection,
  onStartCrop,
  pendingCropResult,
  onConsumeCropResult,
  previews,
  onUpdatePreviews,
}: CorrectionPanelProps) {
  const [activeTab, setActiveTab] = useState<CorrectionTab>('question-text')

  // ===== Draft state for question-text tab =====
  const [questionDraftText, setQuestionDraftText] = useState('')
  const [questionDraftImages, setQuestionDraftImages] = useState<CropImage[]>([])
  const questionCursorPos = useRef(0)

  // ===== Draft state for scenario tab =====
  const [scenarioDraftText, setScenarioDraftText] = useState('')
  const [scenarioDraftImages, setScenarioDraftImages] = useState<CropImage[]>([])
  const scenarioCursorPos = useRef(0)

  // ===== Feedback message for scenario propagation =====
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  // ===== Simple text fields (explanation, category) =====
  const [textField, setTextField] = useState<'explanation' | 'category'>('explanation')
  const [textValue, setTextValue] = useState('')

  // ===== Choices =====
  const [editChoices, setEditChoices] = useState(
    () => (question.choices ?? []).map(c => ({ key: c.key, text: c.text, choice_type: c.choice_type }))
  )

  // ===== Answer =====
  const [answerValue, setAnswerValue] = useState<string>(
    Array.isArray(question.correct_answer)
      ? question.correct_answer.join(', ')
      : String(question.correct_answer)
  )

  // ===== Helper: get original field value =====
  function getFieldValue(field: string): string {
    if (field === 'question_text') return question.question_text ?? ''
    if (field === 'explanation') return question.explanation ?? ''
    if (field === 'linked_scenario') return question.linked_scenario ?? ''
    return question.category ?? ''
  }

  // ===== Helper: get existing multi-image-crop images =====
  function getExistingImages(target: CropTarget): CropImage[] {
    const found = corrections.find(
      c => c.type === 'multi-image-crop' && c.target === target
    )
    if (found?.type === 'multi-image-crop') return found.images
    return []
  }

  // ===== Initialize drafts on question change =====
  useEffect(() => {
    // Question text draft
    const effectiveQText = getEffectiveText(corrections, 'question_text', question.question_text ?? '')
    setQuestionDraftText(effectiveQText)
    setQuestionDraftImages(getExistingImages('question'))
    questionCursorPos.current = 0

    // Scenario draft
    const effectiveSText = getEffectiveText(corrections, 'linked_scenario', question.linked_scenario ?? '')
    setScenarioDraftText(effectiveSText)
    setScenarioDraftImages(getExistingImages('scenario'))
    scenarioCursorPos.current = 0

    // Simple text fields
    setTextField('explanation')
    setTextValue(getEffectiveText(corrections, 'explanation', question.explanation ?? ''))

    // Choices
    setEditChoices((question.choices ?? []).map(c => ({ key: c.key, text: c.text, choice_type: c.choice_type })))

    // Answer
    setAnswerValue(
      Array.isArray(question.correct_answer)
        ? question.correct_answer.join(', ')
        : String(question.correct_answer)
    )

    setActiveTab('question-text')
    setFeedbackMessage(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id])

  // ===== Consume pendingCropResult =====
  useEffect(() => {
    if (!pendingCropResult) return

    const { target, crop, pdfFile, pdfPage, preview } = pendingCropResult

    if (target === 'question') {
      const newId = nextImageId(questionDraftImages)
      const newImage: CropImage = { id: newId, crop, pdfFile, pdfPage }
      setQuestionDraftImages(prev => [...prev, newImage])
      const { text: newText } = insertPlaceholder(questionDraftText, questionCursorPos.current, newId)
      setQuestionDraftText(newText)
      if (preview) {
        onUpdatePreviews(`question-${newId}`, preview)
      }
    } else if (target === 'scenario') {
      const newId = nextImageId(scenarioDraftImages)
      const newImage: CropImage = { id: newId, crop, pdfFile, pdfPage }
      setScenarioDraftImages(prev => [...prev, newImage])
      const { text: newText } = insertPlaceholder(scenarioDraftText, scenarioCursorPos.current, newId)
      setScenarioDraftText(newText)
      if (preview) {
        onUpdatePreviews(`scenario-${newId}`, preview)
      }
    }

    onConsumeCropResult()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCropResult])

  // ===== Warnings for question text =====
  const questionWarnings = useCallback((): string[] => {
    const result: string[] = []
    if (questionDraftImages.length > 0) {
      const { orphanPlaceholders, unreferencedImages } = validateImagePlaceholders(questionDraftText, questionDraftImages)
      if (orphanPlaceholders.length > 0) {
        result.push(`テキスト内にID ${orphanPlaceholders.join(', ')} のプレースホルダーがありますが、対応する画像がありません`)
      }
      if (unreferencedImages.length > 0) {
        result.push(`画像 ${unreferencedImages.join(', ')} がテキスト内で参照されていません`)
      }
    }
    return result
  }, [questionDraftText, questionDraftImages])

  // ===== Warnings for scenario =====
  const scenarioWarnings = useCallback((): string[] => {
    const result: string[] = []
    if (scenarioDraftImages.length > 0) {
      const { orphanPlaceholders, unreferencedImages } = validateImagePlaceholders(scenarioDraftText, scenarioDraftImages)
      if (orphanPlaceholders.length > 0) {
        result.push(`テキスト内にID ${orphanPlaceholders.join(', ')} のプレースホルダーがありますが、対応する画像がありません`)
      }
      if (unreferencedImages.length > 0) {
        result.push(`画像 ${unreferencedImages.join(', ')} がテキスト内で参照されていません`)
      }
    }
    return result
  }, [scenarioDraftText, scenarioDraftImages])

  // ===== Question text: has changes =====
  const questionOriginal = question.question_text ?? ''
  const questionEffective = getEffectiveText(corrections, 'question_text', questionOriginal)
  const questionHasChanges =
    questionDraftText !== questionEffective ||
    JSON.stringify(questionDraftImages) !== JSON.stringify(getExistingImages('question'))

  // ===== Scenario: has changes =====
  const scenarioOriginal = question.linked_scenario ?? ''
  const scenarioEffective = getEffectiveText(corrections, 'linked_scenario', scenarioOriginal)
  const scenarioHasChanges =
    scenarioDraftText !== scenarioEffective ||
    JSON.stringify(scenarioDraftImages) !== JSON.stringify(getExistingImages('scenario'))

  // ===== Apply question text =====
  function applyQuestionText() {
    const newCorrs: Correction[] = []

    // Text correction (only if different from original)
    if (questionDraftText.trim() !== questionOriginal.trim()) {
      newCorrs.push({ type: 'text', field: 'question_text', value: questionDraftText.trim() })
    }

    // Image correction
    if (questionDraftImages.length > 0) {
      newCorrs.push({ type: 'multi-image-crop', target: 'question' as CropTarget, images: questionDraftImages })
    }

    if (newCorrs.length > 0) {
      onReplaceCorrections(newCorrs)
    }

    // If images were cleared, remove the multi-image-crop correction
    if (questionDraftImages.length === 0) {
      const existingImgs = getExistingImages('question')
      if (existingImgs.length > 0) {
        // Need to remove the existing multi-image-crop correction
        const cleaned = removeCorrection(corrections, 'multi-image-crop', 'question')
        // Also apply text if changed
        if (questionDraftText.trim() !== questionOriginal.trim()) {
          const textCorr: Correction = { type: 'text', field: 'question_text', value: questionDraftText.trim() }
          onReplaceCorrections([...replaceCorrections(cleaned.filter(item => item.type !== 'text' || item.field !== 'question_text'), [textCorr])])
        }
      }
    }
  }

  // ===== Apply scenario =====
  function applyScenario() {
    const newCorrs: Correction[] = []

    // Text correction
    if (scenarioDraftText.trim() !== scenarioOriginal.trim()) {
      newCorrs.push({ type: 'text', field: 'linked_scenario', value: scenarioDraftText.trim() })
    }

    // Image correction
    if (scenarioDraftImages.length > 0) {
      newCorrs.push({ type: 'multi-image-crop', target: 'scenario' as CropTarget, images: scenarioDraftImages })
    }

    if (newCorrs.length > 0) {
      const count = onAddScenarioCorrection(newCorrs)
      setFeedbackMessage(`連問グループの ${count}問に適用しました`)
      setTimeout(() => setFeedbackMessage(null), 3000)
    }

    // If images were cleared, handle removal
    if (scenarioDraftImages.length === 0) {
      const existingImgs = getExistingImages('scenario')
      if (existingImgs.length > 0) {
        // Remove via scenario propagation
        const cleanCorr: Correction[] = []
        if (scenarioDraftText.trim() !== scenarioOriginal.trim()) {
          cleanCorr.push({ type: 'text', field: 'linked_scenario', value: scenarioDraftText.trim() })
        }
        // Still call to propagate the removal
        const count = onAddScenarioCorrection(cleanCorr)
        setFeedbackMessage(`連問グループの ${count}問に適用しました`)
        setTimeout(() => setFeedbackMessage(null), 3000)
      }
    }
  }

  // ===== Remove image from question draft =====
  function handleRemoveQuestionImage(imageId: number) {
    setQuestionDraftImages(prev => prev.filter(img => img.id !== imageId))
    setQuestionDraftText(prev => removePlaceholder(prev, imageId))
  }

  // ===== Remove image from scenario draft =====
  function handleRemoveScenarioImage(imageId: number) {
    setScenarioDraftImages(prev => prev.filter(img => img.id !== imageId))
    setScenarioDraftText(prev => removePlaceholder(prev, imageId))
  }

  // ===== Simple text field change =====
  function handleFieldChange(field: 'explanation' | 'category') {
    setTextField(field)
    setTextValue(getEffectiveText(corrections, field, getFieldValue(field)))
  }

  // ===== Apply simple text =====
  function applyText() {
    if (!textValue.trim()) return
    if (textValue.trim() === getFieldValue(textField).trim()) return
    onReplaceCorrections([{ type: 'text', field: textField, value: textValue.trim() }])
  }

  // ===== Apply choices =====
  function applyChoices() {
    const newChoices = editChoices.map(c => ({
      key: c.key,
      text: c.text,
      ...(c.choice_type ? { choice_type: c.choice_type } : {}),
    }))
    onReplaceCorrections([{ type: 'choices', value: newChoices }])
  }

  // ===== Apply answer =====
  function applyAnswer() {
    const parts = answerValue.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    if (parts.length === 0) return
    const value = parts.length === 1 ? parts[0] : parts
    onReplaceCorrections([{ type: 'answer', value }])
  }

  // ===== Image remove =====
  function handleImageRemove() {
    if (!window.confirm('画像URLを削除してテキストのみ問題に変更します。よろしいですか？')) return
    onReplaceCorrections([{ type: 'image-remove' }])
  }

  // ===== Correction label =====
  function correctionLabel(c: Correction): string {
    switch (c.type) {
      case 'text': return `テキスト修正 [${c.field}]: ${c.value.slice(0, 40)}${c.value.length > 40 ? '...' : ''}`
      case 'choices': return `選択肢修正 (${c.value.length}件)`
      case 'answer': return `正答修正: ${Array.isArray(c.value) ? c.value.join(', ') : c.value}`
      case 'image-crop': return `画像クロップ (${c.pdfFile} p.${c.pdfPage})`
      case 'image-remove': return '画像削除'
      case 'multi-image-crop': return `マルチ画像クロップ [${c.target}] (${c.images.length}枚)`
      case 'set-section': return `区分設定: ${c.value}`
      case 'set-subject': return `科目設定: ${c.value}`
      case 'set-visual-content-type': return `ビジュアルタイプ: ${c.value}`
      case 'set-display-mode': return `表示モード: ${c.value}`
      case 'set-linked-group': return `連問グループ: ${c.value}`
      case 'set-linked-scenario': return `シナリオ: ${c.value}`
    }
  }

  const tabs: Array<{ id: CorrectionTab; label: string }> = [
    { id: 'question-text', label: '問題文' },
    { id: 'text', label: 'テキスト' },
    { id: 'choices', label: '選択肢' },
    { id: 'answer', label: '正答' },
    { id: 'scenario', label: 'シナリオ' },
    { id: 'image-remove', label: '画像削除' },
  ]

  return (
    <div className={styles.panel}>
      {/* ===== ヘッダー ===== */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>修正入力</span>
        {corrections.length > 0 && (
          <span className={styles.badge}>{corrections.length}件</span>
        )}
      </div>

      <div className={styles.body}>
        {/* ===== タブ ===== */}
        <div className={styles.tabs} role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== タブコンテンツ ===== */}
        <div className={styles.tabContent}>

          {/* 問題文（テキスト+画像） */}
          {activeTab === 'question-text' && (
            <TextWithImageTab
              text={questionDraftText}
              images={questionDraftImages}
              onTextChange={setQuestionDraftText}
              onCursorChange={(pos) => { questionCursorPos.current = pos }}
              onRemoveImage={handleRemoveQuestionImage}
              onApply={applyQuestionText}
              onStartCrop={() => onStartCrop('question')}
              previews={previews}
              previewKeyPrefix="question"
              hasChanges={questionHasChanges}
              warnings={questionWarnings()}
            />
          )}

          {/* テキスト修正（解説・カテゴリ） */}
          {activeTab === 'text' && (
            <div className={styles.section}>
              <label className={styles.label}>フィールド</label>
              <select
                className={styles.select}
                value={textField}
                onChange={e => handleFieldChange(e.target.value as 'explanation' | 'category')}
              >
                {TEXT_FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>

              <label className={styles.label}>修正後テキスト（不要部分を削除して適用）</label>
              <textarea
                className={styles.textarea}
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                rows={6}
              />

              <button
                className={styles.applyBtn}
                onClick={applyText}
                disabled={!textValue.trim() || textValue.trim() === getFieldValue(textField).trim()}
                type="button"
              >
                適用
              </button>
            </div>
          )}

          {/* 選択肢修正 */}
          {activeTab === 'choices' && (
            <div className={styles.section}>
              <div className={styles.choiceList}>
                {editChoices.map((c, idx) => (
                  <div key={c.key} className={styles.choiceRow}>
                    <span className={styles.choiceKeyLabel}>{c.key}</span>
                    <input
                      className={styles.choiceInput}
                      type="text"
                      value={c.text}
                      onChange={e => {
                        const next = [...editChoices]
                        next[idx] = { ...next[idx], text: e.target.value }
                        setEditChoices(next)
                      }}
                      placeholder={`選択肢 ${c.key}`}
                    />
                    <input
                      className={styles.choiceTypeInput}
                      type="text"
                      value={c.choice_type ?? ''}
                      onChange={e => {
                        const next = [...editChoices]
                        next[idx] = { ...next[idx], choice_type: e.target.value as typeof c.choice_type }
                        setEditChoices(next)
                      }}
                      placeholder="type (省略可)"
                    />
                  </div>
                ))}
              </div>

              <button
                className={styles.applyBtn}
                onClick={applyChoices}
                type="button"
              >
                選択肢を適用
              </button>
            </div>
          )}

          {/* 正答修正 */}
          {activeTab === 'answer' && (
            <div className={styles.section}>
              <label className={styles.label}>
                正答（複数の場合はカンマ区切り: 1, 3）
              </label>
              <input
                className={styles.input}
                type="text"
                value={answerValue}
                onChange={e => setAnswerValue(e.target.value)}
                placeholder="例: 2  または  1, 3"
              />
              <p className={styles.hint}>
                現在: {Array.isArray(question.correct_answer) ? question.correct_answer.join(', ') : question.correct_answer}
              </p>

              <button
                className={styles.applyBtn}
                onClick={applyAnswer}
                type="button"
              >
                適用
              </button>
            </div>
          )}

          {/* シナリオ（テキスト+画像） */}
          {activeTab === 'scenario' && (
            <div className={styles.section}>
              <TextWithImageTab
                text={scenarioDraftText}
                images={scenarioDraftImages}
                onTextChange={setScenarioDraftText}
                onCursorChange={(pos) => { scenarioCursorPos.current = pos }}
                onRemoveImage={handleRemoveScenarioImage}
                onApply={applyScenario}
                onStartCrop={() => onStartCrop('scenario')}
                previews={previews}
                previewKeyPrefix="scenario"
                hasChanges={scenarioHasChanges}
                disabled={!question.linked_scenario}
                disabledMessage={!question.linked_scenario ? 'この問題にはシナリオがありません' : undefined}
                warnings={scenarioWarnings()}
              />
              {feedbackMessage && (
                <p className={styles.hint} style={{ color: '#22c55e', fontWeight: 600 }}>
                  {feedbackMessage}
                </p>
              )}
            </div>
          )}

          {/* 画像削除 */}
          {activeTab === 'image-remove' && (
            <div className={styles.section}>
              {question.image_url ? (
                <>
                  <p className={styles.description}>
                    現在の画像URL: <code className={styles.code}>{question.image_url}</code>
                  </p>
                  <button
                    className={styles.deleteBtn}
                    onClick={handleImageRemove}
                    type="button"
                  >
                    画像を削除
                  </button>
                </>
              ) : (
                <p className={styles.hint}>この問題には画像がありません。</p>
              )}
            </div>
          )}
        </div>

        {/* ===== 適用済み修正リスト ===== */}
        {corrections.length > 0 && (
          <div className={styles.correctionList}>
            <h4 className={styles.listTitle}>適用済み修正 ({corrections.length}件)</h4>
            {corrections.map((c, idx) => (
              <div key={idx} className={styles.correctionItem}>
                <span className={styles.correctionLabel}>{correctionLabel(c)}</span>
                <button
                  className={styles.removeBtn}
                  onClick={() => onRemoveCorrection(idx)}
                  type="button"
                  title="この修正を削除"
                  aria-label="修正を削除"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
