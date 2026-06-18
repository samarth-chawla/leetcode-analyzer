import Link from 'next/link'
import { cn } from '@/lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition focus-ring disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-brand text-white hover:bg-brand/90',
        variant === 'secondary' && 'border border-border bg-white text-primary hover:bg-surface',
        variant === 'ghost' && 'text-secondary hover:bg-surface hover:text-primary',
        className
      )}
      {...props}
    />
  )
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
}

export function ButtonLink({ className, variant = 'primary', ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition focus-ring',
        variant === 'primary' && 'bg-brand text-white hover:bg-brand/90',
        variant === 'secondary' && 'border border-border bg-white text-primary hover:bg-surface',
        variant === 'ghost' && 'text-secondary hover:bg-surface hover:text-primary',
        className
      )}
      {...props}
    />
  )
}
