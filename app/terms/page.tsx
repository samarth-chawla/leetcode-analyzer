import { Logo } from "@/components/logo"
import { ButtonLink } from "@/components/ui/button"

export default function TermsPage() {
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
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-secondary">Last updated: June 24, 2026</p>

          <section className="mt-8 space-y-6 text-sm leading-7 text-secondary">
            <div>
              <h2 className="text-lg font-bold text-primary">1. Agreement to Terms</h2>
              <p className="mt-2">
                By accessing or using LeetCode Analyzer, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-primary">2. Description of Service</h2>
              <p className="mt-2">
                LeetCode Analyzer is an open-source tool designed to help developers track their Data Structures & Algorithms (DSA) progression by analyzing LeetCode submission history, calculating topic weakness scores, and suggesting practice problems.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-primary">3. User Data & Authentication</h2>
              <p className="mt-2">
                Our platform integrates with third-party authentication services (Clerk) and imports public LeetCode submission metadata. You retain ownership of all data imported to the platform, and we process it strictly to generate your personalized learning dashboard.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-primary">4. Open Source & Contributions</h2>
              <p className="mt-2">
                LeetCode Analyzer is licensed under open-source terms. You can find the repository and license details at our public GitHub page. Any contributions made to the repository are welcomed and governed under the project's license.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-primary">5. Disclaimer of Warranties</h2>
              <p className="mt-2 font-mono text-xs border border-border rounded-lg bg-surface p-3">
                THE SERVICE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-primary">6. Limitation of Liability</h2>
              <p className="mt-2">
                In no event shall the authors, maintainers, or copyright holders of LeetCode Analyzer be liable for any claims, damages, or other liability arising from your use of the application.
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
