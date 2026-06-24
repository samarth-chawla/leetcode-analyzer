"use client"

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertTriangle, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ChangeUsernameForm({ currentUsername }: { currentUsername: string | null }) {
  const router = useRouter()
  const [username, setUsername] = useState(currentUsername ?? '')
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = username.trim()
    if (!trimmed || trimmed === currentUsername) {
      setIsEditing(false)
      setArmed(false)
      setMessage(null)
      return
    }

    if (!armed) {
      setArmed(true)
      setMessage('Deletes all submissions, plans, and metrics for your old account, then does a fresh sync.')
      return
    }

    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/settings/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed })
      })
      const result = await response.json()
      
      if (!response.ok) {
        setMessage(result.error ?? 'Failed to update username.')
        setArmed(false)
        return
      }

      setMessage(result.message ?? 'Username changed successfully.')
      setArmed(false)
      setIsEditing(false)
      router.refresh()
    } catch (err) {
      setMessage('Network error. Failed to change username.')
      setArmed(false)
    } finally {
      setBusy(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="mt-4 flex justify-end border-t border-border pt-4">
        <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
          <Edit2 className="mr-2 h-4 w-4" />
          Change Username
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t border-border pt-4 space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-secondary" htmlFor="new-username">
          New LeetCode Username
        </label>
        <div className="flex gap-2">
          <Input
            id="new-username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              if (armed) {
                setArmed(false)
                setMessage(null)
              }
            }}
            placeholder="Enter new username"
            required
            disabled={busy}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={busy}
            variant={armed ? 'primary' : 'secondary'}
            className={armed ? 'bg-danger text-white hover:bg-danger/90 border-danger' : ''}
          >
            {busy ? 'Syncing...' : armed ? 'Confirm' : 'Update'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsEditing(false)
              setArmed(false)
              setMessage(null)
              setUsername(currentUsername ?? '')
            }}
            disabled={busy}
          >
            Cancel
          </Button>
        </div>
      </div>
      {message ? (
        <div
          className={`flex gap-2 items-start rounded-lg p-3 text-xs leading-5 ${
            armed
              ? 'border border-danger/20 bg-danger/10 text-danger'
              : 'border border-border bg-surface text-secondary'
          }`}
        >
          {armed ? <AlertTriangle className="h-4 w-4 shrink-0 text-danger" /> : null}
          <span>{message}</span>
        </div>
      ) : null}
    </form>
  )
}
