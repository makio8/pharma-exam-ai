import { SubjectSection } from './SubjectSection'
import type { FusenGroup } from '../../utils/fusen-library-core'

interface Props {
  groups: FusenGroup[]
  bookmarkedIds: Set<string>
  /** 各セクションを初期展開するか（マイ付箋=true、全付箋=false） */
  defaultOpen?: boolean
}

export function FusenGrid({ groups, bookmarkedIds, defaultOpen = false }: Props) {
  return (
    <div>
      {groups.map(group => (
        <SubjectSection
          key={group.subject}
          subject={group.subject}
          fusens={group.fusens}
          bookmarkedIds={bookmarkedIds}
          defaultOpen={defaultOpen}
        />
      ))}
    </div>
  )
}
