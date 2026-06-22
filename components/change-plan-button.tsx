"use client"

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ChangePlanButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function changePlan() {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/plan/refresh', { method: 'POST' })
      const result = await response.json()
      setMessage(result.message ?? result.error ?? 'Plan updated.')
      if (response.ok) router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button type="button" variant="secondary" onClick={changePlan} disabled={busy}>
        <Shuffle className="mr-2 h-4 w-4" />
        {busy ? 'Changing...' : 'Change Plan'}
      </Button>
      {message ? <p className="text-xs text-secondary">{message}</p> : null}
    </div>
  )
}
