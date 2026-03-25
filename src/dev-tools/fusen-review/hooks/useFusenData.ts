import { useState, useEffect } from 'react'

interface FusenSource {
  pdf: string
  page: number
  noteIndex: number
  bbox: [number, number, number, number]
}

export interface FusenData {
  id: string
  title: string
  body: string
  imageFile: string
  subject: string
  noteType: string
  tags: string[]
  source: FusenSource
  topicId: string | null
  status: string
  reviewedAt: string | null
  notes: string
}

interface FusenMasterData {
  version: number
  generatedAt: string
  fusens: Record<string, FusenData>
}

interface UseFusenDataResult {
  fusens: FusenData[]
  loading: boolean
  error: string | null
}

export function useFusenData(): UseFusenDataResult {
  const [fusens, setFusens] = useState<FusenData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/fusens/fusens-master.json')
      .then(res => {
        if (!res.ok) throw new Error('fusens-master.json not found.\nRun:\n  npx tsx scripts/build-fusens-master.ts\n  cp src/data/fusens/fusens-master.json public/data/fusens/')
        return res.json()
      })
      .then((data: FusenMasterData) => {
        const list = Object.values(data.fusens).sort((a, b) => a.id.localeCompare(b.id))
        setFusens(list)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { fusens, loading, error }
}
