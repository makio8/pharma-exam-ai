import type { FusenBreadcrumb as BreadcrumbType } from '../../hooks/useFusenDetail'

interface Props {
  breadcrumb: BreadcrumbType
}

export function FusenBreadcrumb({ breadcrumb }: Props) {
  const parts = [breadcrumb.subject, breadcrumb.major, breadcrumb.middle].filter(Boolean)
  return (
    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
      {parts.join(' > ')}
    </span>
  )
}
