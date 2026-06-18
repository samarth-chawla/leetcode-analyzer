import { SignIn } from '@clerk/nextjs'
import { Logo } from '@/components/logo'
import { compactAuthAppearance } from '@/components/auth-appearance'

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <section className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="mb-5 text-center">
          <h1 className="text-xl font-semibold text-primary">Welcome back</h1>
          <p className="mt-1 text-sm text-secondary">Sign in to continue your DSA plan.</p>
        </div>
        <SignIn
          appearance={compactAuthAppearance}
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/import"
        />
      </section>
    </main>
  )
}
