import { useState, useEffect } from 'react'
import type {
  NoteExemplarMappingsFile,
  NoteExemplarMappingEntry,
} from '../../../types/note-exemplar-mapping'
import type { Exemplar } from '../../../types/blueprint'
import { EXEMPLARS } from '../../../data/exemplars'

export interface MappingDataEntry extends NoteExemplarMappingEntry {
  exemplarMap: Map<string, Exemplar>
}

interface UseMappingDataResult {
  entries: MappingDataEntry[]
  loading: boolean
  error: string | null
}

const exemplarById = new Map<string, Exemplar>(
  EXEMPLARS.map(e => [e.id, e])
)

export function useMappingData(): UseMappingDataResult {
  const [entries, setEntries] = useState<MappingDataEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/fusens/note-exemplar-mappings.json')
      .then(res => {
        if (!res.ok) throw new Error(
          'note-exemplar-mappings.json not found.\n' +
          'Task 2（Claude推論）を先に実行してください。'
        )
        return res.json()
      })
      .then((data: NoteExemplarMappingsFile) => {
        const list: MappingDataEntry[] = data.mappings.map(entry => {
          const exemplarMap = new Map<string, Exemplar>()
          for (const m of entry.matches) {
            const ex = exemplarById.get(m.exemplarId)
            if (ex) exemplarMap.set(m.exemplarId, ex)
          }
          return { ...entry, exemplarMap }
        })
        setEntries(list)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { entries, loading, error }
}
