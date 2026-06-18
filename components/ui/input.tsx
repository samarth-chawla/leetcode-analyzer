import { cn } from '@/lib/utils'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-primary placeholder:text-secondary focus-ring',
        props.className
      )}
    />
  )
}
