import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

export async function askMentor(userId: string, question: string) {
  const [topics, plan, stats] = await Promise.all([
    prisma.topicScore.findMany({ where: { userId }, orderBy: { weaknessScore: 'desc' }, take: 5 }),
    prisma.dailyPlan.findFirst({ where: { userId }, orderBy: { date: 'desc' }, include: { problems: true } }),
    prisma.user.findUnique({ where: { id: userId } })
  ])

  const context = JSON.stringify({
    solved: stats?.totalSolved,
    streak: stats?.currentStreak,
    weakTopics: topics,
    todaysPlan: plan?.problems
  })

  if (!process.env.GEMINI_API_KEY) {
    return `Based on your profile, focus first on ${topics[0]?.topic ?? 'Dynamic Programming'} and keep today's three-problem plan small and consistent.`
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent([
    'You are a concise DSA interview prep mentor. Use the user data. Do not invent metrics.',
    `User data: ${context}`,
    `Question: ${question}`
  ])

  return result.response.text()
}
