import { format } from 'date-fns'
import { Database, GitBranch, RotateCw, UserRound } from 'lucide-react'
import { AppShell, ensureImported } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { ResetSyncButton } from '@/components/reset-sync-button'
import { ChangeUsernameForm } from '@/components/change-username-form'
import packageJson from '@/package.json'

function formatDate(date: Date | null) {
  return date ? format(date, 'MMM d, yyyy h:mm a') : 'Never'
}

function methodLabel(method: string | null) {
  if (method === 'username') return 'Username sync'
  if (method === 'extension') return 'Extension export (Will be launching soon)'
  return 'Pending'
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className="text-right text-sm font-medium text-primary">{value}</span>
    </div>
  )
}

export default async function SettingsPage() {
  const user = await ensureImported()

  return (
    <AppShell active="/settings">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-primary">Settings</h1>
          <p className="mt-2 text-sm text-secondary">Manage profile sync, data repair, and app information.</p>
        </div>
        <Badge tone="neutral">v{packageJson.version}</Badge>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brandLight text-brand">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Profile</h2>
              <p className="text-sm text-secondary">Current LeetCode account connected to this workspace.</p>
            </div>
          </div>

          <div className="mt-5">
            <StatRow label="LeetCode username" value={user.leetcodeUsername ?? 'Not set'} />
            <StatRow label="Last import method" value={<Badge>{methodLabel(user.importMethod)}</Badge>} />
            <StatRow label="Last synced" value={formatDate(user.lastSyncedAt)} />
          </div>

          <ChangeUsernameForm currentUsername={user.leetcodeUsername} />
        </section>

        <section className="card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-secondary">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Application</h2>
              <p className="text-sm text-secondary">Versioning follows major.minor.patch.</p>
            </div>
          </div>

          <div className="mt-5">
            <StatRow label="Current version" value={`v${packageJson.version}`} />
            <StatRow label="Minor updates" value="1.x" />
            <StatRow label="Major changes" value="2.x+" />
          </div>
        </section>
      </div>

      <section className="card mt-4">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Data Maintenance</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary">
                Delete imported submissions, derived analytics, plans, and saved profile stats, then rebuild from the saved LeetCode username.
              </p>
              <p className="mt-2 text-xs text-secondary">
                Extension-only history cannot be recreated unless you upload the export again.
              </p>
            </div>
          </div>
          <ResetSyncButton disabled={!user.leetcodeUsername} />
        </div>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <RotateCw className="h-4 w-4 text-brand" />
            Sync State
          </div>
          <p className="mt-2 text-sm text-secondary">Last method now updates whenever a sync or import succeeds.</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Database className="h-4 w-4 text-brand" />
            Analytics Source
          </div>
          <p className="mt-2 text-sm text-secondary">Profile totals prefer LeetCode official stats; topic analytics use imported attempts.</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <GitBranch className="h-4 w-4 text-brand" />
            Version Rule
          </div>
          <p className="mt-2 text-sm text-secondary">Use 1.x for iterative improvements and 2.x for large behavior changes.</p>
        </div>
      </section>
    </AppShell>
  )
}
