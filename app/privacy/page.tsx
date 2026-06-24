import { Logo } from "@/components/logo"
import { ButtonLink } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface/30">
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Logo />
          <ButtonLink href="/" variant="secondary">Back to Home</ButtonLink>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <article className="card prose max-w-none">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-secondary">Last updated: June 24, 2026</p>

          <section className="mt-8 space-y-6 text-sm leading-7 text-secondary">
            <div>
              <h2 className="text-lg font-bold text-primary">1. Information We Collect</h2>
              <p className="mt-2">
                We collect your email, first name, and authentication details via Clerk. When you sync your LeetCode profile, we fetch public submission metadata (problem titles, difficulty, status, timestamps, runtime, and memory metrics) to construct your practice history.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-primary">2. How We Use Your Data</h2>
              <p className="mt-2">
                We use your submission metadata solely to calculate your weakness scores, maintain your streaks, display contribution graphs, and recommend relevant problems in your daily practice plan.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-primary">3. Data Sharing & Security</h2>
              <p className="mt-2">
                We do not sell, rent, or trade your personal data. All data is securely stored in our databases. The application uses Clerk's industry-standard authentication flow to keep your profile secure.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-primary">4. Cookies & Local Storage</h2>
              <p className="mt-2">
                We use cookies and browser local storage to maintain session states and store preferences. No third-party tracking or advertising cookies are utilized.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-primary">5. User Control & Data Deletion</h2>
              <p className="mt-2">
                You have full control over your data. At any time, you can clear all synced submission records, plans, and metrics directly from the **Data Maintenance** section on your Settings page, or change your connected LeetCode username.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-primary">6. Contact</h2>
              <p className="mt-2">
                If you have any questions or feedback regarding this Privacy Policy, please open an issue in the public GitHub repository.
              </p>
            </div>
          </section>
        </article>
      </main>

      <footer className="border-t border-border bg-white py-8 text-center text-xs text-secondary mt-12">
        <p>© {new Date().getFullYear()} LeetCode Analyzer. All rights reserved.</p>
        <p className="mt-2">Made with ❤️ for LeetCode developers.</p>
      </footer>
    </div>
  )
}
