import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'
import { performanceScore } from '@/lib/analytics/score'

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const NVIDIA_MODEL = process.env.NVIDIA_MODEL ?? 'deepseek-ai/deepseek-v4-pro'
const MENTOR_PROVIDER = (process.env.MENTOR_PROVIDER ?? 'gemini').toLowerCase()

type TopicInput = {
  topic: string
  weaknessScore: number
  status: string
}

type PlanInput = {
  problems: Array<{
    title: string
    topic: string
    difficulty: string
    leetcodeUrl: string
  }>
}

type RecentProblemInput = {
  title: string
  difficulty: string
  topicTags: string[]
  attempts: number
  accepted: boolean
  firstAttemptRate: number
}

type WebSearchResult = {
  title: string
  url: string
  snippet: string
}

const topicDrills: Record<string, string[]> = {
  Sorting: ['Merge Intervals', 'Sort Colors', 'Kth Largest Element in an Array', 'Top K Frequent Elements'],
  'Counting Sort': ['H-Index', 'Relative Sort Array', 'Sort Characters By Frequency', 'First Missing Positive'],
  'Dynamic Programming': ['House Robber', 'Climbing Stairs', 'Coin Change', 'Longest Increasing Subsequence'],
  Backtracking: ['Permutations', 'Subsets', 'Combination Sum', 'Word Search'],
  Graphs: ['Number of Islands', 'Clone Graph', 'Course Schedule', 'Rotting Oranges'],
  Trees: ['Binary Tree Level Order Traversal', 'Lowest Common Ancestor', 'Validate Binary Search Tree'],
  Arrays: ['Two Sum', 'Maximum Subarray', 'Product of Array Except Self', 'Container With Most Water'],
  Strings: ['Valid Anagram', 'Longest Substring Without Repeating Characters', 'Group Anagrams'],
  'Two Pointers': ['3Sum', 'Valid Palindrome', 'Container With Most Water'],
  SlidingWindow: ['Longest Substring Without Repeating Characters', 'Minimum Window Substring', 'Permutation in String']
}

function topTopics(topics: TopicInput[]) {
  const names = topics.map((topic) => topic.topic).filter(Boolean)
  return names.length ? names : ['Sorting', 'Counting Sort', 'Dynamic Programming']
}

function problemSuggestions(topic: string) {
  return topicDrills[topic] ?? topicDrills[topic.replace(/\s+/g, '')] ?? [`2 medium ${topic} problems`, `1 ${topic} revision problem`]
}

function companyNameFromQuestion(question: string) {
  const lowerQuestion = question.toLowerCase()
  if (lowerQuestion.includes('josh')) return 'Josh Technology Group'
  return 'this company'
}

function isCompanyQuestion(question: string) {
  const lowerQuestion = question.toLowerCase()
  return ['company', 'interview', 'oa', 'online assessment', 'round', 'josh', 'specific questions'].some((word) => lowerQuestion.includes(word))
}

function buildCompanyFallback(
  question: string,
  topics: TopicInput[],
  plan?: PlanInput | null,
  webContext: WebSearchResult[] = []
) {
  const company = companyNameFromQuestion(question)
  const [weakest, second, third] = topTopics(topics)
  const planTitles = plan?.problems?.slice(0, 3).map((problem) => problem.title).filter(Boolean) ?? []
  const firstDrills = problemSuggestions(weakest).slice(0, 3)
  const secondDrills = problemSuggestions(second).slice(0, 2)
  const sourceLine = webContext.length
    ? `\n\nSources: ${webContext.slice(0, 3).map((result) => result.url).join(', ')}`
    : ''

  return [
    `Yes. For ${company}, I would prepare you with a product-engineering interview mix instead of only random LeetCode. Your profile says the first repair area is ${weakest}${second ? `, then ${second}` : ''}${third ? `, with ${third} as revision` : ''}.`,
    `Josh-specific practice set for today:\n1. Coding warmup: ${firstDrills[0]}\n2. Main DSA: ${firstDrills[1] ?? firstDrills[0]}\n3. Second pattern: ${secondDrills[0] ?? firstDrills[0]}\n4. Profile plan problem: ${planTitles[0] ?? 'H-Index'}\n5. Explain-out-loud round: take ${planTitles[1] ?? 'House Robber'} and explain brute force, optimized approach, time complexity, and edge cases.`,
    `Likely question types to rehearse:\n- Arrays/sorting: find top K, merge intervals, frequency counting, custom sort.\n- Recursion/backtracking: permutations/subsets with duplicate handling.\n- DP basics: House Robber style state transition and memoization.\n- SQL/backend basics if the role is full-stack: joins, indexing, transactions, REST API design.\n- Project discussion: one project architecture, one scaling bottleneck, one bug you debugged deeply.`,
    `Mock questions I can ask you now:\n1. Given an array, return the k most frequent elements.\n2. Given intervals, merge all overlapping intervals.\n3. Generate all permutations of a string with duplicates.\n4. Design a rate limiter for an API used by many clients.\n5. Explain one project from your resume with database schema, API endpoints, and failure cases.`,
    `For the next 3 days: Day 1 ${weakest}; Day 2 ${second ?? 'DP'}; Day 3 mixed mock with one coding problem, one SQL/backend question, and one project deep dive.${sourceLine}`
  ].join('\n\n')
}

function fallbackAnswer(
  question: string,
  topics: TopicInput[],
  plan?: PlanInput | null,
  webContext: WebSearchResult[] = [],
  recentProblems: RecentProblemInput[] = []
) {
  if (isCompanyQuestion(question)) {
    return buildCompanyFallback(question, topics, plan, webContext)
  }

  const [weakest, second] = topTopics(topics)
  const plannedProblems = plan?.problems?.slice(0, 3).map((problem) => problem.title).filter(Boolean).join(', ')
  const recentMisses = recentProblems.filter((problem) => !problem.accepted).slice(0, 2).map((problem) => problem.title)

  return [
    `Based on your profile, your next focus should be ${weakest}${second ? `, then ${second}` : ''}.`,
    plannedProblems ? `Use today's plan as the base: ${plannedProblems}.` : `Do these now: ${problemSuggestions(weakest).slice(0, 3).join(', ')}.`,
    recentMisses.length ? `Also revisit recent misses: ${recentMisses.join(', ')}.` : 'After solving, write down the pattern, edge cases, and why your first approach failed or worked.'
  ].join('\n\n')
}

function needsWebContext(question: string) {
  const text = question.toLowerCase()
  const externalSignals = [
    'company',
    'interview',
    'hiring',
    'round',
    'oa',
    'online assessment',
    'latest',
    'current',
    'today',
    'recent',
    'salary',
    'roadmap',
    'josh technology',
    'josh technologies',
    'josh technology group'
  ]

  return externalSignals.some((signal) => text.includes(signal))
}

function compactText(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

async function searchWithBrave(query: string): Promise<WebSearchResult[]> {
  if (!process.env.BRAVE_SEARCH_API_KEY) return []

  const url = new URL('https://api.search.brave.com/res/v1/web/search')
  url.searchParams.set('q', query)
  url.searchParams.set('count', '5')

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY
    },
    next: { revalidate: 60 * 60 }
  })

  if (!response.ok) return []

  const payload = await response.json()
  return (payload.web?.results ?? []).slice(0, 5).map((item: Record<string, unknown>) => ({
    title: compactText(item.title),
    url: compactText(item.url),
    snippet: compactText(item.description)
  }))
}

async function searchWithSerper(query: string): Promise<WebSearchResult[]> {
  if (!process.env.SERPER_API_KEY) return []

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.SERPER_API_KEY
    },
    body: JSON.stringify({ q: query, num: 5 }),
    next: { revalidate: 60 * 60 }
  })

  if (!response.ok) return []

  const payload = await response.json()
  return (payload.organic ?? []).slice(0, 5).map((item: Record<string, unknown>) => ({
    title: compactText(item.title),
    url: compactText(item.link),
    snippet: compactText(item.snippet)
  }))
}

async function searchWithDuckDuckGo(query: string): Promise<WebSearchResult[]> {
  const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`, {
    next: { revalidate: 60 * 60 }
  })

  if (!response.ok) return []

  const payload = await response.json()
  const related = Array.isArray(payload.RelatedTopics) ? payload.RelatedTopics : []

  return related
    .flatMap((item: Record<string, unknown>) => {
      if (Array.isArray(item.Topics)) return item.Topics as Array<Record<string, unknown>>
      return [item]
    })
    .slice(0, 5)
    .map((item: Record<string, unknown>) => ({
      title: compactText(item.Text).split(' - ')[0] || 'Search result',
      url: compactText(item.FirstURL),
      snippet: compactText(item.Text)
    }))
    .filter((item: WebSearchResult) => item.url && item.snippet)
}

async function getWebContext(question: string) {
  if (!needsWebContext(question)) return []

  const query = `${question} software engineer interview DSA`
  try {
    const results = await searchWithBrave(query)
    if (results.length) return results

    const serperResults = await searchWithSerper(query)
    if (serperResults.length) return serperResults

    return await searchWithDuckDuckGo(query)
  } catch (error) {
    console.warn('Mentor web search failed; continuing with profile context only.', error)
    return []
  }
}

function buildPrompt(question: string, profileContext: string, webContext: WebSearchResult[]) {
  const searchContext = webContext.length
    ? JSON.stringify(
        webContext.map((result, index) => ({
          source: index + 1,
          title: result.title,
          url: result.url,
          snippet: result.snippet
        }))
      )
    : 'No external search context was needed or available.'

  return [
    'You are a strong DSA and software engineering interview mentor.',
    'Answer the user directly and specifically. Always adapt advice to the profile data.',
    'If the user asks about a company, role, current process, current news, or anything outside the saved profile, use the web search context and merge it with profile strengths/weaknesses.',
    'For company-specific interview prep, include likely question types, mock questions, and a short practice plan. Do not only repeat weak topics.',
    'Do not invent profile metrics or company facts. If search context is thin, say what is uncertain and still give a practical profile-based plan.',
    'Prefer concrete steps, topic priorities, problem counts, and time boxes. Avoid repeating the same generic sentence.',
    'When web search context is used, end with a short Sources line containing the relevant URLs.',
    `User profile JSON: ${profileContext}`,
    `Web search context JSON: ${searchContext}`,
    `User question: ${question}`
  ].join('\n\n')
}

async function askGemini(prompt: string) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('AI mentor skipped Gemini: GEMINI_API_KEY is missing.')
    return null
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.45,
      maxOutputTokens: 900
    }
  })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

async function askNvidia(prompt: string) {
  if (!process.env.NVIDIA_API_KEY) {
    console.warn('AI mentor skipped NVIDIA: NVIDIA_API_KEY is missing.')
    return null
  }

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      temperature: 0.45,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content: 'You are a concise, practical DSA interview mentor.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`NVIDIA mentor request failed with ${response.status}: ${text}`)
  }

  const payload = await response.json()
  return compactText(payload.choices?.[0]?.message?.content)
}

async function askModel(prompt: string) {
  if (MENTOR_PROVIDER === 'nvidia') {
    return askNvidia(prompt)
  }

  return askGemini(prompt)
}

export async function askMentor(userId: string, question: string) {
  const [topics, plan, stats, profile, recentProblems, webContext] = await Promise.all([
    prisma.topicScore.findMany({ where: { userId }, orderBy: { weaknessScore: 'desc' }, take: 8 }),
    prisma.dailyPlan.findFirst({ where: { userId }, orderBy: { date: 'desc' }, include: { problems: true } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.leetCodeProfile.findUnique({ where: { userId } }),
    prisma.problemHistory.findMany({
      where: { userId },
      orderBy: { lastAttemptedAt: 'desc' },
      take: 10
    }),
    getWebContext(question)
  ])

  const context = JSON.stringify({
    username: profile?.username ?? stats?.leetcodeUsername,
    totals: {
      solved: profile?.totalSolved ?? stats?.totalSolved,
      easy: profile?.easySolved ?? stats?.easySolved,
      medium: profile?.mediumSolved ?? stats?.mediumSolved,
      hard: profile?.hardSolved ?? stats?.hardSolved
    },
    activity: {
      currentStreak: profile?.currentStreak ?? stats?.currentStreak,
      longestStreak: profile?.longestStreak,
      activeDays: profile?.activeDaysCount,
      lastSyncedAt: stats?.lastSyncedAt
    },
    weakTopics: topics.map(({ weaknessScore, ...topic }) => ({
      ...topic,
      score: performanceScore(weaknessScore)
    })),
    todaysPlan: plan?.problems.map(({ title, slug, topic, difficulty, reason, completed }) => ({
      title,
      slug,
      topic,
      difficulty,
      reason,
      completed
    })),
    recentProblems: recentProblems.map(({ title, slug, difficulty, topicTags, attempts, accepted, firstAttemptRate }) => ({
      title,
      slug,
      difficulty,
      topicTags,
      attempts,
      accepted,
      firstAttemptRate
    }))
  })

  const fallback = () => fallbackAnswer(question, topics, plan, webContext, recentProblems)

  try {
    const answer = await askModel(buildPrompt(question, context, webContext))
    if (!answer?.trim()) {
      console.warn(`AI mentor used fallback: provider ${MENTOR_PROVIDER} returned no answer.`)
      return fallback()
    }
    return answer.trim()
  } catch (error) {
    console.warn('AI mentor failed; using profile fallback.', error)
    return fallback()
  }
}
