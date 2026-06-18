import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import { auth, currentUser } from '@clerk/nextjs/server'
import { BarChart3, Bot, LayoutDashboard, Settings, UserCircle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/mentor', label: 'AI Mentor', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings }
]

export async function ensureImported() {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  let user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    const clerkUser = await currentUser()
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress,
        firstName: clerkUser?.firstName ?? 'John'
      }
    })
  }

  if (!user.lastSyncedAt) redirect('/import')
  return user
}

export async function AppShell({
  children,
  active
}: {
  children: React.ReactNode
  active: string
}) {
  const user = await ensureImported()

  return (
    <div className="min-h-screen bg-surface/60 pb-20 md:pb-0">
      <aside className="fixed left-0 top-0 hidden h-screen w-[240px] border-r border-border bg-white p-4 md:block">
        <Logo />
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-secondary',
                active === item.href && 'border-brand bg-brandLight text-brand'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 border-t border-border pt-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-primary">
            <UserCircle className="h-4 w-4" />
            {user.leetcodeUsername ?? user.firstName ?? 'Profile'}
          </div>
          <SignOutButton>
            <button className="text-sm text-secondary hover:text-primary">Sign Out</button>
          </SignOutButton>
        </div>
      </aside>
      <main className="mx-auto max-w-6xl px-4 py-6 md:ml-[240px] md:px-8">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-5 border-t border-border bg-white md:hidden">
        {[...navItems, { href: '/settings', label: 'Profile', icon: UserCircle }].map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-2 text-[11px] text-secondary',
              active === item.href && 'text-brand'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
