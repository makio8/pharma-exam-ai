import { useState, useEffect } from 'react'
import type { Question } from '../../../types/question'
import type { Correction } from '../types'
import styles from './CorrectionPanel.module.css'

type CorrectionTab = 'text' | 'choices' | 'answer' | 'image-crop' | 'image-remove'

const TEXT_FIELDS = [
  { value: 'question_text', label: '問題文' },
  { value: 'explanation', label: '解説' },
  { value: 'category', label: 'カテゴリ' },
] as const

interface CorrectionPanelProps {
  question: Question
  corrections: Correction[]
  onAddCorrection: (correction: Correction) => void
  onRemoveCorrection: (index: number) => void
  onStartCrop: () => void
}

export function CorrectionPanel({
  question,
  corrections,
  onAddCorrection,
  onRemoveCorrection,
  onStartCrop,
}: CorrectionPanelProps) {
  const [activeTab, setActiveTab] = useState<CorrectionTab>('text')

  // テキスト修正
  const [textField, setTextField] = useState<'question_text' | 'explanation' | 'category'>('question_text')
  const [textValue, setTextValue] = useState('')

  // 選択肢修正
  const [editChoices, setEditChoices] = useState(
    () => (question.choices ?? []).map(c => ({ key: c.key, text: c.text, choice_type: c.choice_type }))
  )

  // 正答修正
  const [answerValue, setAnswerValue] = useState<string>(
    Array.isArray(question.correct_answer)
      ? question.correct_answer.join(', ')
      : String(question.correct_answer)
  )

  // フィールド値を取得するヘルパー
  function getFieldValue(field: typeof textField): string {
    if (field === 'question_text') return question.question_text ?? ''
    if (field === 'explanation') return question.explanation ?? ''
    return question.category ?? ''
  }

  // 問題が切り替わったら編集値をリセット（テキストはフィールド値で初期化）
  useEffect(() => {
    setTextField('question_text')
    setTextValue(question.question_text ?? '')
    setEditChoices((question.choices ?? []).map(c => ({ key: c.key, text: c.text, choice_type: c.choice_type })))
    setAnswerValue(
      Array.isArray(question.correct_answer)
        ? question.correct_answer.join(', ')
        : String(question.correct_answer)
    )
    setActiveTab('text')
  }, [question.id, question.choices, question.correct_answer, question.question_text])

  // フィールド切替時もフィールド値で初期化
  function handleFieldChange(field: typeof textField) {
    setTextField(field)
    setTextValue(getFieldValue(field))
  }

  // ===== テキスト修正の適用 =====
  function applyText() {
    if (!textValue.trim()) return
    // 元の値と同じなら修正不要
    if (textValue.trim() === getFieldValue(textField).trim()) return
    onAddCorrection({ type: 'text', field: textField, value: textValue.trim() })
  }

  // ===== 選択肢修正の適用 =====
  function applyChoices() {
    const newChoices = editChoices.map(c => ({
      key: c.key,
      text: c.text,
      ...(c.choice_type ? { choice_type: c.choice_type } : {}),
    }))
    onAddCorrection({ type: 'choices', value: newChoices })
  }

  // ===== 正答修正の適用 =====
  function applyAnswer() {
    const parts = answerValue.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    if (parts.length === 0) return
    const value = parts.length === 1 ? parts[0] : parts
    onAddCorrection({ type: 'answer', value })
  }

  // ===== 画像削除 =====
  function handleImageRemove() {
    if (!window.confirm('画像URLを削除してテキストのみ問題に変更します。よろしいですか？')) return
    onAddCorrection({ type: 'image-remove' })
  }

  // ===== 修正ラベル =====
  function correctionLabel(c: Correction): string {
    switch (c.type) {
      case 'text': return `テキスト修正 [${c.field}]: ${c.value.slice(0, 40)}${c.value.length > 40 ? '…' : ''}`
      case 'choices': return `選択肢修正 (${c.value.length}件)`
      case 'answer': return `正答修正: ${Array.isArray(c.value) ? c.value.join(', ') : c.value}`
      case 'image-crop': return `画像クロップ (${c.pdfFile} p.${c.pdfPage})`
      case 'image-remove': return '画像削除'
      case 'set-section': return `区分設定: ${c.value}`
      case 'set-subject': return `科目設定: ${c.value}`
      case 'set-visual-content-type': return `ビジュアルタイプ: ${c.value}`
      case 'set-display-mode': return `表示モード: ${c.value}`
      case 'set-linked-group': return `連問グループ: ${c.value}`
      case 'set-linked-scenario': return `シナリオ: ${c.value}`
    }
  }

  const tabs: Array<{ id: CorrectionTab; label: string }> = [
    { id: 'text', label: 'テキスト' },
    { id: 'choices', label: '選択肢' },
    { id: 'answer', label: '正答' },
    { id: 'image-crop', label: '画像クロップ' },
    { id: 'image-remove', label: '画像削除' },
  ]

  return (
    <div className={styles.panel}>
      {/* ===== ヘッダー（常時表示） ===== */}
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

          {/* テキスト修正 */}
          {activeTab === 'text' && (
            <div className={styles.section}>
              <label className={styles.label}>フィールド</label>
              <select
                className={styles.select}
                value={textField}
                onChange={e => handleFieldChange(e.target.value as typeof textField)}
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

          {/* 画像クロップ */}
          {activeTab === 'image-crop' && (
            <div className={styles.section}>
              <p className={styles.description}>
                PDFビューアでクロップ範囲をドラッグ → 自動保存されます。
              </p>
              <button
                className={styles.cropBtn}
                onClick={onStartCrop}
                type="button"
              >
                PDFからクロップ開始
              </button>
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
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
