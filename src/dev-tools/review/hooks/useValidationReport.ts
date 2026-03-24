import { useState, useEffect } from 'react'
import type { ValidationReport } from '../../../utils/data-validator/types'

export function useValidationReport() {
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Vite dev server の server.fs.allow に reports/ を追加済み。
    // /reports/ は public/ 配下ではないため /@fs/ 経由でアクセスする。
    // 開発時のみ使用するため絶対パスをハードコードしてよい。
    const urls = [
      '/reports/validation-report.json',
      `/@fs${location.origin.includes('localhost') ? '' : ''}/reports/validation-report.json`,
    ]

    async function tryFetch() {
      // まず相対パスで試みる（Vite が serve してくれる場合）
      for (const url of urls) {
        try {
          const res = await fetch(url)
          if (res.ok) {
            const data: ValidationReport = await res.json()
            setReport(data)
            setLoading(false)
            return
          }
        } catch {
          // 次のURLを試す
        }
      }
      setError('レポートが見つかりません。先に npm run validate を実行してください。')
      setLoading(false)
    }

    tryFetch()
  }, [])

  return { report, loading, error }
}
