'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const steps = [
  'Fetching Problems',
  'Processing Submissions',
  'Building Analytics',
  'Detecting Weak Topics',
  'Creating Daily Plan'
]

export function ImportPanel() {
  const [tab, setTab] = useState<'extension' | 'username'>('extension')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function readResponsePayload(response: Response) {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return response.json()
    }

    const text = await response.text()
    return text ? { error: text } : {}
  }

  async function runProgress() {
    setBusy(true)
    setError(null)
    for (let i = 1; i <= 5; i += 1) {
      setProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 260))
    }
  }

  async function uploadFile(file: File) {
    await runProgress()
    const json = JSON.parse(await file.text())
    const response = await fetch('/api/import/extension', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(json)
    })
    const result = await readResponsePayload(response)
    if (!response.ok) {
      setBusy(false)
      setError(result.error ?? 'Import failed.')
      return
    }
    router.push('/dashboard')
  }

  async function submitUsername(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runProgress()
    const response = await fetch('/api/import/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    })
    const result = await readResponsePayload(response)
    if (!response.ok) {
      setBusy(false)
      setError(result.error ?? 'Import failed.')
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="card">
      <div className="grid grid-cols-2 rounded-lg bg-surface p-1">
        <button
          onClick={() => setTab('extension')}
          className={`rounded-md px-3 py-2 text-sm font-medium ${tab === 'extension' ? 'bg-white text-brand shadow-sm' : 'text-secondary'}`}
        >
          Extension Import
        </button>
        <button
          onClick={() => setTab('username')}
          className={`rounded-md px-3 py-2 text-sm font-medium ${tab === 'username' ? 'bg-white text-brand shadow-sm' : 'text-secondary'}`}
        >
          Username Import
        </button>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}

      {busy ? (
        <div className="mt-6">
          <p className="text-sm font-semibold text-primary">Step {progress}/5 - {steps[Math.max(0, progress - 1)]}</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface">
            <div className="h-full bg-brand transition-all" style={{ width: `${Math.max(12, progress * 20)}%` }} />
          </div>
          <p className="mt-2 font-mono text-xs text-secondary">{Math.max(72, progress * 20)}% complete</p>
        </div>
      ) : null}

      {tab === 'extension' ? (
        <div className="mt-6">
          <Badge>Recommended</Badge>
          <h2 className="mt-4 text-lg font-semibold text-primary">Why use the extension?</h2>
          <ul className="mt-3 space-y-2 text-sm text-secondary">
            <li>Complete submission history</li>
            <li>Attempt-level analytics</li>
            <li>Instant processing</li>
            <li>More accurate recommendations</li>
          </ul>
          <a href="#" className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white">
            Install Extension
          </a>
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={(event) => {
              event.preventDefault()
              const file = event.dataTransfer.files[0]
              if (file) void uploadFile(file)
            }}
            onDragOver={(event) => event.preventDefault()}
            className="mt-5 grid cursor-pointer place-items-center rounded-xl border border-dashed border-border bg-surface p-8 text-center"
          >
            <Upload className="h-6 w-6 text-brand" />
            <p className="mt-3 text-sm font-medium text-primary">Drag and drop your JSON file</p>
            <p className="mt-1 text-xs text-secondary">or click to browse</p>
            <Button className="mt-4" type="button">Upload JSON File</Button>
            <input
              ref={inputRef}
              hidden
              type="file"
              accept="application/json"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void uploadFile(file)
              }}
            />
          </div>
        </div>
      ) : (
        <form onSubmit={submitUsername} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-primary" htmlFor="leetcode-username">
            Enter your LeetCode username
          </label>
          <Input
            id="leetcode-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="john_doe"
            required
          />
          <Button type="submit" disabled={busy}>Start Import</Button>
          <p className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-secondary">
            This may take longer and provide limited submission data depending on your profile settings.
          </p>
        </form>
      )}
    </div>
  )
}
