import { differenceInHours, format, startOfDay } from "date-fns";
import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { AppShell, ensureImported } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SyncButton } from "@/components/sync-button";
import { prisma } from "@/lib/prisma";
import { ensureDailyPlan } from "@/lib/plan/recommend";
import { syncFromUsername } from "@/lib/sync/sync";

export default async function DashboardPage() {
  const user = await ensureImported();

  if (
    user.leetcodeUsername &&
    user.lastSyncedAt &&
    differenceInHours(new Date(), user.lastSyncedAt) >= 24
  ) {
    syncFromUsername(user.id).catch(console.error);
  }

  const [plan, weakTopics, recent] = await Promise.all([
    ensureDailyPlan(user.id),
    prisma.topicScore.findMany({
      where: { userId: user.id },
      orderBy: { weaknessScore: "desc" },
      take: 3,
    }),
    prisma.submission.findMany({
      where: { userId: user.id, statusDisplay: "Accepted" },
      orderBy: { timestamp: "desc" },
      take: 7,
    }),
  ]);
  const completed = plan.problems.filter((problem) => problem.completed).length;

  return (
    <AppShell active="/dashboard">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-primary">
            Good morning, {user.firstName ?? "John"}
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Current streak:{" "}
            <span className="font-semibold text-primary">
              {user.currentStreak} days
            </span>
            <span className="mx-3">|</span>
            Problems this week:{" "}
            <span className="font-semibold text-primary">{recent.length}</span>
          </p>
        </div>
      </div>

      <section className="card mt-6">
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">
              Today&apos;s Practice Plan
            </h2>
            <p className="mt-1 text-sm text-secondary">
              {format(startOfDay(new Date()), "MMMM d, yyyy")}
            </p>
          </div>
          <SyncButton />
        </div>
        <div className="divide-y divide-border">
          {plan.problems.map((problem) => (
            <div
              key={problem.id}
              className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className={problem.completed ? "opacity-60" : ""}>
                <div className="flex items-center gap-3">
                  {problem.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <span className="font-mono text-sm text-secondary">
                      {problem.order}
                    </span>
                  )}
                  <h3
                    className={`text-lg font-semibold text-primary ${problem.completed ? "line-through" : ""}`}
                  >
                    {problem.title}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-secondary">
                  {problem.topic} - {problem.difficulty}
                </p>
                <p className="mt-1 text-sm text-secondary">
                  &quot;{problem.reason}&quot;
                </p>
              </div>
              <a
                href={problem.leetcodeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-white"
              >
                Start <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm font-medium text-primary">
            {completed} / {plan.problems.length || 3} completed today
          </p>
          {completed === plan.problems.length && plan.problems.length > 0 ? (
            <Badge tone="success">Plan complete</Badge>
          ) : null}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Weak Topics</h2>
          <Link href="/analytics" className="text-sm font-medium text-brand">
            View full analytics
          </Link>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {(weakTopics.length
            ? weakTopics
            : [
                {
                  topic: "Dynamic Programming",
                  weaknessScore: 76,
                  status: "weak",
                },
                { topic: "Graphs", weaknessScore: 68, status: "weak" },
                {
                  topic: "Backtracking",
                  weaknessScore: 61,
                  status: "needs_work",
                },
              ]
          ).map((topic) => (
            <div key={topic.topic} className="card">
              <p className="text-sm font-semibold text-primary">
                {topic.topic}
              </p>
              <p className="mt-3 font-mono text-2xl text-primary">
                {topic.weaknessScore}/100
              </p>
              <Badge tone={topic.status === "weak" ? "danger" : "warning"}>
                {topic.status === "weak" ? "Weak" : "Needs Work"}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-4">
        {[
          ["Total", user.totalSolved],
          ["Easy", user.easySolved],
          ["Medium", user.mediumSolved],
          ["Hard", user.hardSolved],
        ].map(([label, value]) => (
          <div key={label} className="card">
            <p className="text-sm text-secondary">{label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-primary">
              {value}
            </p>
            <p className="mt-1 text-sm text-secondary">Solved</p>
          </div>
        ))}
      </section>

      <section className="card mt-6">
        <h2 className="text-lg font-semibold text-primary">Recent Activity</h2>
        <div className="mt-4 divide-y divide-border">
          {recent.map((submission) => (
            <div
              key={submission.id}
              className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_140px_120px]"
            >
              <p className="font-medium text-primary">{submission.title}</p>
              <p className="text-secondary">{submission.difficulty}</p>
              <p className="text-secondary">
                {format(submission.timestamp, "MMM d")}
              </p>
            </div>
          ))}
          {recent.length === 0 ? (
            <p className="text-sm text-secondary">
              No accepted submissions yet.
            </p>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
