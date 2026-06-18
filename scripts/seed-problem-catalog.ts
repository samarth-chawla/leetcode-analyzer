import { PrismaClient } from '@prisma/client'
import problems from "./data/leetcode-problems.json" with { type: "json" };

const prisma = new PrismaClient()

async function main() {
  console.log(`Seeding ${problems.length} problems...`)
  let inserted = 0
  let skipped = 0

  for (const problem of problems) {
    try {
      await prisma.problemCatalog.upsert({
        where: { slug: problem.titleSlug },
        create: {
          problemId: problem.questionId,
          title: problem.title,
          slug: problem.titleSlug,
          difficulty: problem.difficulty,
          topicTags: problem.topicTags.map((topic) => topic.name),
          isPremium: problem.isPaidOnly ?? false,
          leetcodeUrl: `https://leetcode.com/problems/${problem.titleSlug}/`
        },
        update: {
          topicTags: problem.topicTags.map((topic) => topic.name),
          difficulty: problem.difficulty,
          isPremium: problem.isPaidOnly ?? false
        }
      })
      inserted += 1
    } catch {
      skipped += 1
    }
  }

  console.log(`Done. Inserted/updated: ${inserted}, Skipped: ${skipped}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
