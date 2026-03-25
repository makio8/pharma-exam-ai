import { useState, useEffect } from 'react'
import type { ValidationReport } from '../../../utils/data-validator/types'

// vite.config.ts の define で注入される絶対パス
declare const __REPORTS_ROOT__: string

export function useValidationReport() {
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // /@fs/ + 絶対パスでアクセス（server.fs.allow に登録済み）
    const url = `/@fs/${__REPORTS_ROOT__}/validation-report.json`

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json()
      })
      .then((data: ValidationReport) => {
        setReport(data)
        setLoading(false)
      })
      .catch(() => {
        setError('レポートが見つかりません。先に npm run validate を実行してください。')
        setLoading(false)
      })
  }, [])

  return { report, loading, error }
}
