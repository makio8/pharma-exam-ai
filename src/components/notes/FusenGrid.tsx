import { SubjectSection } from './SubjectSection'
import type { FusenGroup } from '../../utils/fusen-library-core'

interface Props {
  groups: FusenGroup[]
  bookmarkedIds: Set<string>
}

export function FusenGrid({ groups, bookmarkedIds }: Props) {
  return (
    <div>
      {groups.map(group => (
        <SubjectSection
          key={group.subject}
          subject={group.subject}
          fusens={group.fusens}
          bookmarkedIds={bookmarkedIds}
        />
      ))}
    </div>
  )
}
