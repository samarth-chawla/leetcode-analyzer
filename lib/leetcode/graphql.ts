import type { GraphQLSubmission } from '@/lib/import/normalize'

type Page = {
  submissions: GraphQLSubmission[]
  // We can’t reliably paginate without an offset argument.
  hasNext: boolean
}

export async function fetchSubmissionPage(username: string, limit: number): Promise<Page> {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        query: `
          query recentSubmissions($username: String!, $limit: Int!) {
            recentSubmissionList(username: $username, limit: $limit) {
              id
              title
              titleSlug
              timestamp
              statusDisplay
              lang
              runtime
              memory
              url
            }
          }
        `,
        variables: { username, limit }
      })
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`LeetCode request failed with ${response.status}:`, text)
      throw new Error(`LeetCode request failed with ${response.status}`)
    }

    const payload = await response.json()
    if (payload.errors) {
      console.error('LeetCode GraphQL errors:', payload.errors)
      throw new Error(`LeetCode GraphQL error: ${JSON.stringify(payload.errors)}`)
    }

    const submissions = payload.data?.recentSubmissionList ?? []
    return {
      submissions,
      hasNext: false
    }
  } catch (error) {
    console.error('fetchSubmissionPage error:', error)
    throw error
  }
}

export async function fetchSubmissionsSince(
  username: string,
  cutoff: Date
): Promise<GraphQLSubmission[]> {
  // LeetCode pagination in this schema doesn’t support `offset` (and `question` isn’t available),
  // so we use a time-window narrowing approach:
  // - fetch the latest batch (ordered by timestamp from LeetCode)
  // - take the oldest timestamp from that batch as the new window boundary
  // - repeat until we’ve covered everything newer than `cutoff`
  const limit = 50
  const all: GraphQLSubmission[] = []

  // Current upper boundary for what we’re trying to discover.
  // Start wide: fetch the newest submissions and narrow backwards.
  let windowEnd: Date = new Date()

  // Safety: avoid infinite loops if the API returns unexpected ordering/duplicates.
  for (let i = 0; i < 50; i++) {
    console.log(`[LeetCode sync] windowEnd=${windowEnd.toISOString()} iter=${i}`)

    const page = await fetchSubmissionPage(username, limit)
    console.log(`[LeetCode sync] fetched batch size=${page.submissions.length}`)

    if (!page.submissions.length) break

    // Parse timestamps from the batch.
    const parsed = page.submissions
      .map((s) => ({ raw: s, ts: new Date(parseInt(s.timestamp, 10) * 1000) }))
      .filter((x) => !Number.isNaN(x.ts.getTime()))

    console.log(
      `[LeetCode sync] parsed timestamps valid=${parsed.length} invalid=${page.submissions.length - parsed.length}`
    )

    if (!parsed.length) break

    // Track which submissions are newly relevant (newer than cutoff).
    const relevant = parsed.filter((x) => x.ts > cutoff)
    console.log(
      `[LeetCode sync] cutoff=${cutoff.toISOString()} relevant(count ts>cutoff)=${relevant.length}`
    )

    all.push(...relevant.map((x) => x.raw))

    // Narrow the window by moving the end boundary to the oldest submission we got.
    const oldestInBatch = parsed.reduce(
      (min, x) => (x.ts < min ? x.ts : min),
      parsed[0].ts
    )
    const newestInBatch = parsed.reduce(
      (max, x) => (x.ts > max ? x.ts : max),
      parsed[0].ts
    )

    console.log(
      `[LeetCode sync] batch ts range: newest=${newestInBatch.toISOString()} oldest=${oldestInBatch.toISOString()}`
    )

    // If the oldest batch item is already <= cutoff, then nothing older than that can be relevant.
    if (oldestInBatch <= cutoff) break

    // If we didn't move the boundary, break to prevent infinite loops.
    if (oldestInBatch >= windowEnd) break
    windowEnd = oldestInBatch

    // Small delay to be polite with the upstream API.
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  // De-dupe defensively because time windows can overlap.
  // Unique key is submission.id.
  const seen = new Set<string>()
  const deduped: GraphQLSubmission[] = []
  for (const s of all) {
    if (seen.has(s.id)) continue
    seen.add(s.id)
    deduped.push(s)
  }

  return deduped
}
