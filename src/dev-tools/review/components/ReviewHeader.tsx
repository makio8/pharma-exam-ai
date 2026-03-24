import { useCallback } from 'react'
import type { ValidationReport } from '../../../utils/data-validator/types'
import type { FilterConfig, JudgmentStatus } from '../types'
import styles from './ReviewHeader.module.css'

// 全年度リスト (100〜111)
const ALL_YEARS = Array.from({ length: 12 }, (_, i) => 100 + i)
const ALL_SECTIONS = ['必須', '理論', '実践'] as const

interface ReviewHeaderProps {
  report: ValidationReport
  judgments: Record<string, JudgmentStatus>
  totalFiltered: number
  currentIndex: number
  filters: FilterConfig
  onFiltersChange: (filters: FilterConfig) => void
  onExport?: () => void
  correctionCount?: number
}

export function ReviewHeader({
  report,
  judgments,
  totalFiltered,
  currentIndex,
  filters,
  onFiltersChange,
  onExport,
  correctionCount = 0,
}: ReviewHeaderProps) {
  // 判定カウント集計
  const judgmentValues = Object.values(judgments)
  const okCount = judgmentValues.filter(v => v === 'ok').length
  const fixCount = judgmentValues.filter(v => v === 'needs-fix').length
  const ngCount = judgmentValues.filter(v => v === 'ng').length
  const totalJudged = okCount + fixCount + ngCount
  const pendingCount = Math.max(0, totalFiltered - totalJudged)

  // プログレスバー比率（filteredQuestions 件数ベース）
  const total = totalFiltered || 1
  const pctOk = (okCount / total) * 100
  const pctFix = (fixCount / total) * 100
  const pctNg = (ngCount / total) * 100
  const pctPending = (pendingCount / total) * 100

  // フィルタパネル開閉（savedFilters流用せずローカル管理）
  const isOpen = (filters as FilterConfig & { _open?: boolean })._open ?? false

  const togglePanel = useCallback(() => {
    onFiltersChange({ ...filters, _open: !isOpen } as FilterConfig)
  }, [filters, isOpen, onFiltersChange])

  // ===== 深刻度トグル =====
  function toggleSeverity(sev: 'error' | 'warning' | 'info') {
    const next = filters.severities.includes(sev)
      ? filters.severities.filter(s => s !== sev)
      : [...filters.severities, sev]
    onFiltersChange({ ...filters, severities: next })
  }

  // ===== 年度チェックボックス =====
  function toggleYear(year: number) {
    const next = filters.years.includes(year)
      ? filters.years.filter(y => y !== year)
      : [...filters.years, year]
    onFiltersChange({ ...filters, years: next })
  }

  function selectAllYears() {
    onFiltersChange({ ...filters, years: ALL_YEARS })
  }
  function clearAllYears() {
    onFiltersChange({ ...filters, years: [] })
  }

  // ===== 区分チェックボックス =====
  function toggleSection(sec: string) {
    const next = filters.sections.includes(sec as typeof filters.sections[number])
      ? filters.sections.filter(s => s !== sec)
      : [...filters.sections, sec as typeof filters.sections[number]]
    onFiltersChange({ ...filters, sections: next })
  }

  // ===== 判定状態ラジオ =====
  function setJudgmentStatus(status: FilterConfig['judgmentStatus']) {
    onFiltersChange({ ...filters, judgmentStatus: status })
  }

  // 判定状態チップ定義
  const judgmentChips: Array<{ value: FilterConfig['judgmentStatus']; label: string; activeClass: string }> = [
    { value: 'pending', label: '未判定', activeClass: styles.chipActive },
    { value: 'ok', label: '✅ OK', activeClass: styles.chipOkActive },
    { value: 'needs-fix', label: '⚠️ 要修正', activeClass: styles.chipFixActive },
    { value: 'ng', label: '❌ NG', activeClass: styles.chipNgActive },
    { value: 'all', label: 'すべて', activeClass: styles.chipActive },
  ]

  return (
    <header className={styles.header}>
      {/* ===== 上段: タイトル + バリデーション統計 + ナビ ===== */}
      <div className={styles.topRow}>
        <h1 className={styles.title}>データ品質レビュー</h1>

        <div className={styles.stats}>
          <span className={styles.statOk}>OK {report.passCount}</span>
          <span className={styles.statError}>エラー {report.summary.error}</span>
          <span className={styles.statWarning}>警告 {report.summary.warning}</span>
          <span className={styles.statInfo}>情報 {report.summary.info ?? 0}</span>
        </div>

        <div className={styles.progressArea}>
          <span className={styles.progressText}>
            判定済 {totalJudged} / {totalFiltered}（OK:{okCount} 要修正:{fixCount} NG:{ngCount}）
          </span>
          <span className={styles.navIndicator}>
            {totalFiltered > 0 ? currentIndex + 1 : 0} / {totalFiltered}
          </span>
        </div>

        {onExport && (
          <button
            className={styles.exportBtn}
            onClick={onExport}
            type="button"
            title="修正データをエクスポート (E)"
          >
            エクスポート
            {correctionCount > 0 && (
              <span className={styles.exportBadge}>{correctionCount}</span>
            )}
            <span className={styles.exportKeyHint}>E</span>
          </button>
        )}
      </div>

      {/* ===== プログレスバー ===== */}
      <div className={styles.progressBar}>
        <div className={`${styles.progressSegment} ${styles.segOk}`} style={{ width: `${pctOk}%` }} />
        <div className={`${styles.progressSegment} ${styles.segFix}`} style={{ width: `${pctFix}%` }} />
        <div className={`${styles.progressSegment} ${styles.segNg}`} style={{ width: `${pctNg}%` }} />
        <div className={`${styles.progressSegment} ${styles.segPending}`} style={{ width: `${pctPending}%` }} />
      </div>

      {/* ===== フィルタトグルボタン ===== */}
      <div className={styles.filterToggleRow}>
        <button
          className={`${styles.filterToggleBtn} ${isOpen ? styles.filterToggleBtnOpen : ''}`}
          onClick={togglePanel}
          aria-expanded={isOpen}
        >
          {isOpen ? '▲' : '▼'} フィルタ
        </button>
        <span className={styles.filterHint}>F キーで開閉</span>
      </div>

      {/* ===== フィルタパネル ===== */}
      {isOpen && (
        <div className={styles.filterPanel}>
          {/* 深刻度 */}
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>深刻度</span>
            <div className={styles.filterGroup}>
              {(['error', 'warning', 'info'] as const).map(sev => {
                const isActive = filters.severities.includes(sev)
                const activeClass =
                  sev === 'error' ? styles.chipErrorActive :
                  sev === 'warning' ? styles.chipWarningActive :
                  styles.chipInfoActive
                const label = sev === 'error' ? '🔴 error' : sev === 'warning' ? '🟡 warning' : '⚪ info'
                return (
                  <button
                    key={sev}
                    className={`${styles.chip} ${isActive ? activeClass : ''}`}
                    onClick={() => toggleSeverity(sev)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 年度 */}
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>年度</span>
            <div className={styles.filterGroup}>
              {ALL_YEARS.map(year => (
                <label key={year} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={filters.years.includes(year)}
                    onChange={() => toggleYear(year)}
                  />
                  {year}
                </label>
              ))}
              <button className={styles.selectAll} onClick={selectAllYears}>全選択</button>
              <button className={styles.selectAll} onClick={clearAllYears}>全解除</button>
            </div>
          </div>

          {/* 区分 */}
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>区分</span>
            <div className={styles.filterGroup}>
              {ALL_SECTIONS.map(sec => (
                <label key={sec} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={filters.sections.includes(sec)}
                    onChange={() => toggleSection(sec)}
                  />
                  {sec}
                </label>
              ))}
            </div>
          </div>

          {/* 判定状態 */}
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>判定</span>
            <div className={styles.filterGroup}>
              {judgmentChips.map(({ value, label, activeClass }) => (
                <button
                  key={value}
                  className={`${styles.chip} ${filters.judgmentStatus === value ? activeClass : ''}`}
                  onClick={() => setJudgmentStatus(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
