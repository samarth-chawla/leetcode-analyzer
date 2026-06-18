import { AppShell, ensureImported } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'

export default async function SettingsPage() {
  const user = await ensureImported()

  return (
    <AppShell active="/settings">
      <h1 className="text-[32px] font-bold text-primary">Settings</h1>
      <section className="card mt-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-primary">Profile</h2>
        <div className="mt-5 space-y-4 text-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-secondary">LeetCode username</span>
            <span className="font-medium text-primary">{user.leetcodeUsername ?? 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-secondary">Import method</span>
            <Badge>{user.importMethod ?? 'Pending'}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary">Last synced</span>
            <span className="font-medium text-primary">{user.lastSyncedAt?.toLocaleString() ?? 'Never'}</span>
          </div>
        </div>
      </section>
    </AppShell>
  )
}
