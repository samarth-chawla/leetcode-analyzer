# TODO

## Step 1: Prisma model + migration
- [ ] Add `LeetCodeProfile` model to `prisma/schema.prisma` (heatmap + streak/counters fields)
- [ ] Update `prisma` client types via `npx prisma generate`
- [ ] Run `npx prisma migrate dev`

## Step 2: LeetCode GraphQL profile analytics fetch (Option B)
- [ ] Extend `lib/leetcode/graphql.ts` with a new `fetchLeetCodeProfileAnalytics(username)`
- [ ] Implement best-effort GraphQL query; on schema mismatch fall back later

## Step 3: Compute/populate `LeetCodeProfile`
- [ ] Add `lib/profile/compute-leetcode-profile.ts` to compute DB fallback metrics from `Submission`
- [ ] Update `lib/import/pipeline.ts` to recompute/store `LeetCodeProfile` after imports/rebuilds

## Step 4: Cache invalidation / refresh
- [ ] Update `app/api/plan/sync/route.ts` to call `revalidatePath('/dashboard')` and `/analytics`

## Step 5: Dashboard redesign
- [ ] Update `app/dashboard/page.tsx` to reorder sections + show Profile Overview, Today plan details, Weak topics, Quick stats, Recent activity (10)
- [ ] Replace counters sourced from `User` with `LeetCodeProfile` (and fallback)

## Step 6: Thorough verification
- [ ] Run sync end-to-end; confirm POST `/api/plan/sync` returns valid JSON
- [ ] Confirm dashboard reflects updated profile metrics immediately
- [ ] Confirm analytics page still works

