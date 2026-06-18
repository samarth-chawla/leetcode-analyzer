import { cn } from '@/lib/utils'

export function Badge({
  children,
  tone = 'brand',
  className
}: {
  children: React.ReactNode
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'brand' && 'bg-brandLight text-brand',
        tone === 'success' && 'bg-success/10 text-success',
        tone === 'warning' && 'bg-warning/10 text-warning',
        tone === 'danger' && 'bg-danger/10 text-danger',
        tone === 'neutral' && 'bg-surface text-secondary',
        className
      )}
    >
      {children}
    </span>
  )
}
