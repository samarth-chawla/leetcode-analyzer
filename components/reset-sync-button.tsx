"use client"

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ResetSyncButton({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter()
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function resetAndSync() {
    if (!armed) {
      setArmed(true)
      setMessage('Press again to delete imported history and resync from LeetCode.')
      return
    }

    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/settings/reset-sync', { method: 'POST' })
      const result = await response.json()
      setMessage(result.message ?? result.error ?? 'Reset complete.')
      if (response.ok) {
        setArmed(false)
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant={armed ? 'primary' : 'secondary'}
        onClick={resetAndSync}
        disabled={disabled || busy}
        className={armed ? 'bg-danger text-white hover:bg-danger/90' : ''}
      >
        {armed ? <Trash2 className="mr-2 h-4 w-4" /> : <RotateCcw className="mr-2 h-4 w-4" />}
        {busy ? 'Resetting...' : armed ? 'Confirm Reset' : 'Reset and Resync'}
      </Button>
      {message ? <p className="text-xs text-secondary">{message}</p> : null}
    </div>
  )
}
