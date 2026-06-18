import { redirect } from 'next/navigation'
import { getOrCreateDbUser } from '@/lib/auth/current-db-user'
import { ImportPanel } from '@/components/import-panel'
import { Logo } from '@/components/logo'

export default async function ImportPage() {
  const user = await getOrCreateDbUser()
  if (!user) redirect('/sign-in')
  if (user.lastSyncedAt) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-surface px-4 py-8">
      <div className="mx-auto max-w-[560px]">
        <Logo />
        <div className="mt-10">
          <h1 className="text-[32px] font-bold leading-tight text-primary">
            Welcome, {user.firstName ?? 'there'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-secondary">
            Let&apos;s set up your DSA Intelligence profile. Import your LeetCode data to get started.
          </p>
        </div>
        <div className="mt-6">
          <ImportPanel />
        </div>
      </div>
    </main>
  )
}
