import { SignUp } from '@clerk/nextjs'
import { Logo } from '@/components/logo'
import { compactAuthAppearance } from '@/components/auth-appearance'

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <section className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="mb-5 text-center">
          <h1 className="text-xl font-semibold text-primary">Create your account</h1>
          <p className="mt-1 text-sm text-secondary">Start tracking your LeetCode progress.</p>
        </div>
        <SignUp
          appearance={compactAuthAppearance}
          signInUrl="/sign-in"
          fallbackRedirectUrl="/import"
        />
      </section>
    </main>
  )
}
