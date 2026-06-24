import { ArrowRight, Bot, Check, LineChart, Target, X } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { clerkEnabled } from "@/lib/auth/clerk-enabled";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { InteractivePlanPreview } from "@/components/interactive-plan-preview";

const features = [
  {
    title: "Weakness Detection",
    text: "Analyzes every attempt, not just solved problems. Finds exactly where you're struggling.",
    icon: Target,
  },
  {
    title: "Daily DSA Plan",
    text: "3 personalized problems every day based on your weak topics, difficulty, and learning pace.",
    icon: LineChart,
  },
  {
    title: "AI Mentor",
    text: "Ask anything about your prep. Get answers based on your actual performance data.",
    icon: Bot,
  },
];

const steps = [
  "Connect LeetCode",
  "Analyze History",
  "Detect Weaknesses",
  "Practice Daily",
];

export default function LandingPage() {
  const { userId } = auth();
  if (userId) {
    redirect("/dashboard");
  }

  const hasClerk = clerkEnabled();

  return (
    <div className="bg-white">
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-secondary md:flex">
            <a href="#features" className="hover:text-primary">
              Features
            </a>
            <a href="#how" className="hover:text-primary">
              How It Works
            </a>
            <a href="#faq" className="hover:text-primary">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {hasClerk ? (
              <>
                <SignedOut>
                  <ButtonLink href="/sign-in" variant="ghost">
                    Sign In
                  </ButtonLink>
                  <ButtonLink href="/sign-up">Get Started</ButtonLink>
                </SignedOut>
                <SignedIn>
                  <ButtonLink href="/dashboard">Dashboard</ButtonLink>
                </SignedIn>
              </>
            ) : (
              <>
                <ButtonLink href="/sign-in" variant="ghost">
                  Sign In
                </ButtonLink>
                <ButtonLink href="/sign-up">Get Started</ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1fr_520px]">
          <div>
            <Badge>Public beta</Badge>
            <h1 className="mt-5 text-[32px] font-bold leading-tight text-primary md:text-5xl">
              Stop solving random LeetCode problems.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-secondary">
              DSA Intelligence analyzes your submission history and builds you a
              personalized daily practice plan based on your actual weaknesses.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/sign-up">Get Started Free</ButtonLink>
              <ButtonLink href="#how" variant="secondary">
                See How It Works
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm text-secondary">
              Trusted by 2,400+ developers preparing for interviews
            </p>
          </div>

          <div className="relative w-full max-w-[520px] mx-auto">
            {/* Elegant gradient glowing blur blob to add depth */}
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-brand/20 to-success/20 blur-xl opacity-75 animate-pulse" />
            <div className="relative">
              <InteractivePlanPreview />
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-t border-border bg-surface py-16"
        >
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-2xl font-semibold text-primary">Features</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="card">
                  <feature.icon className="h-5 w-5 text-brand" />
                  <h3 className="mt-4 text-lg font-semibold text-primary">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-secondary">
                    {feature.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold text-primary">How It Works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="border-l-2 border-brandLight pl-4">
                <span className="font-mono text-sm text-brand">
                  0{index + 1}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-primary">
                  {step}
                </h3>
                <p className="mt-2 text-sm text-secondary">
                  {
                    [
                      "Import via extension or username",
                      "Process all your submissions",
                      "Score every major topic",
                      "Solve the right 3 problems",
                    ][index]
                  }
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface py-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid overflow-hidden rounded-xl border border-border bg-white shadow-card md:grid-cols-2">
              <ImportColumn
                title="Username Import"
                good={["No install needed", "Instant analysis", "Profile dashboard sync"]}
                bad={[]}
              />
              <ImportColumn
                title="Extension Import"
                badge="Launching Soon"
                good={[
                  "Complete history",
                  "Attempt-level analytics",
                  "Instant import",
                  "Better accuracy",
                ]}
                bad={[]}
              />
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-2xl font-semibold text-primary">FAQ</h2>
          {[
            [
              "Is this free?",
              "Yes. The launch scope is public and open to all users.",
            ],
            [
              "Do I need to install the extension?",
              "No. Username import works too, but the extension gives richer attempt-level data.",
            ],
            [
              "How is this different from LeetCode's own stats?",
              "It uses attempts, topic weakness, recency, and daily planning rather than only solved counts.",
            ],
            [
              "How often does the daily plan refresh?",
              "Every day, with sync updating completion as you solve.",
            ],
            [
              "Is my data safe?",
              "Your data is stored in your account and used only to generate your analytics and recommendations.",
            ],
          ].map(([q, a]) => (
            <details
              key={q}
              className="mt-3 rounded-xl border border-border bg-white p-4"
            >
              <summary className="cursor-pointer text-sm font-semibold text-primary">
                {q}
              </summary>
              <p className="mt-2 text-sm leading-6 text-secondary">{a}</p>
            </details>
          ))}
        </section>
      </main>

      <footer className="border-t border-border bg-surface/50 py-12">
        <div className="mx-auto max-w-6xl px-4 text-sm text-secondary">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Logo />
              <p className="max-w-md text-xs text-secondary leading-relaxed">
                Stop solving random LeetCode problems. Start solving the right ones based on attempt-level weakness detection.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-medium">
              <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
              <a
                href="https://github.com/samarth-chawla/leetcode-analyzer"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs">
            <p>© {new Date().getFullYear()} LeetCode Analyzer. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Made with ❤️ by{' '}
              <a
                href="https://github.com/samarth-chawla"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Samarth
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ImportColumn({
  title,
  badge,
  good,
  bad,
}: {
  title: string;
  badge?: string;
  good: string[];
  bad: string[];
}) {
  return (
    <div className="border-border p-6 first:border-b md:first:border-b-0 md:first:border-r">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        {badge ? <Badge>{badge}</Badge> : null}
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {good.map((item) => (
          <p key={item} className="flex items-center gap-2 text-primary">
            <Check className="h-4 w-4 text-success" /> {item}
          </p>
        ))}
        {bad.map((item) => (
          <p key={item} className="flex items-center gap-2 text-secondary">
            <X className="h-4 w-4 text-danger" /> {item}
          </p>
        ))}
      </div>
    </div>
  );
}
