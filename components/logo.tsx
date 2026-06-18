import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-primary">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">D</span>
      <span>DSA Intelligence</span>
    </Link>
  )
}
