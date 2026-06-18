import type { Appearance } from '@clerk/types'

export const compactAuthAppearance: Appearance = {
  variables: {
    colorPrimary: '#6366F1',
    colorText: '#111827',
    colorTextSecondary: '#6B7280',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#111827',
    borderRadius: '0.5rem',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSize: '13px',
    spacingUnit: '0.75rem'
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'w-full rounded-lg border border-border p-5 shadow-card',
    header: 'hidden',
    socialButtonsBlockButton: 'h-10 rounded-md border-border text-sm font-medium',
    socialButtonsBlockButtonText: 'text-sm',
    dividerRow: 'my-3',
    form: 'gap-3',
    formField: 'gap-1.5',
    formFieldLabel: 'text-xs font-medium text-secondary',
    formFieldInput: 'h-10 rounded-md border-border text-sm',
    formButtonPrimary: 'h-10 rounded-md bg-brand text-sm font-semibold hover:bg-brand/90',
    footer: 'pt-3',
    footerActionText: 'text-xs text-secondary',
    footerActionLink: 'text-xs font-semibold text-brand',
    identityPreview: 'rounded-md border-border',
    otpCodeFieldInput: 'h-10 w-9 rounded-md border-border text-sm',
    alert: 'rounded-md text-xs'
  }
}
