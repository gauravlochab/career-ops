import { getApplications, ALL_STATUSES, STATUS_LABELS } from "@/lib/api"
import { Metadata } from "next"
import { IntelShell } from "./intel-shell"
import { AnalyticsContent } from "./analytics-content"

export const metadata: Metadata = { title: "Intelligence — career-ops" }

function weekNumber(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "unknown"
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay())
  return start.toISOString().slice(0, 10)
}

export default async function IntelPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = "analytics" } = await searchParams
  const apps = await getApplications()

  const byStatus = ALL_STATUSES.map(s => ({
    status: STATUS_LABELS[s],
    slug: s,
    count: apps.filter(a => a.status === s).length,
  })).filter(s => s.count > 0)

  const byCompany = Object.entries(
    apps.reduce((acc, a) => {
      acc[a.company] = (acc[a.company] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const scoreGroups = [
    { label: "Excellent (4.5+)", count: apps.filter(a => a.score >= 4.5).length, color: "bg-green-500" },
    { label: "Strong (4.0–4.4)", count: apps.filter(a => a.score >= 4.0 && a.score < 4.5).length, color: "bg-lime-500" },
    { label: "Good (3.5–3.9)",   count: apps.filter(a => a.score >= 3.5 && a.score < 4.0).length, color: "bg-yellow-500" },
    { label: "Fair (3.0–3.4)",   count: apps.filter(a => a.score >= 3.0 && a.score < 3.5).length, color: "bg-orange-500" },
    { label: "Low (<3.0)",        count: apps.filter(a => a.score > 0 && a.score < 3.0).length, color: "bg-red-500" },
  ].filter(g => g.count > 0)

  // Conversion funnel — pipeline stages ordered by depth
  const funnelStages = [
    { label: "Evaluated", count: apps.filter(a => ["evaluated", "applied", "responded", "interview", "offer"].includes(a.status)).length },
    { label: "Applied",   count: apps.filter(a => ["applied", "responded", "interview", "offer"].includes(a.status)).length },
    { label: "Responded", count: apps.filter(a => ["responded", "interview", "offer"].includes(a.status)).length },
    { label: "Interview", count: apps.filter(a => ["interview", "offer"].includes(a.status)).length },
    { label: "Offer",     count: apps.filter(a => a.status === "offer").length },
  ]

  // Weekly cadence (last 8 weeks)
  const weeklyMap: Record<string, number> = {}
  for (const app of apps) {
    const wk = weekNumber(app.date)
    weeklyMap[wk] = (weeklyMap[wk] || 0) + 1
  }
  const last8Weeks = [...Array(8)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() - i * 7)
    const wk = d.toISOString().slice(0, 10)
    return { wk, count: weeklyMap[wk] || 0 }
  }).reverse()

  // Actionable insight
  let insight = ""
  const applied = apps.filter(a => a.status === "applied").length
  const responded = apps.filter(a => a.status === "responded").length
  const interviews = apps.filter(a => a.status === "interview").length
  const highScoreEval = apps.filter(a => a.status === "evaluated" && a.score >= 4.0).length

  if (highScoreEval > 0) {
    insight = `${highScoreEval} high-score job${highScoreEval > 1 ? "s are" : " is"} evaluated but not yet applied. Apply now to keep momentum.`
  } else if (applied > 0 && responded === 0) {
    insight = `${applied} application${applied > 1 ? "s" : ""} sent with no responses yet. Consider following up on any sent 7+ days ago.`
  } else if (responded > 0 && interviews === 0) {
    insight = `${responded} compan${responded > 1 ? "ies have" : "y has"} responded. Move quickly — schedule interviews while interest is hot.`
  } else if (interviews > 0) {
    insight = `${interviews} active interview${interviews > 1 ? "s" : ""} in progress. Check Interview Prep to sharpen your stories.`
  } else if (apps.length === 0) {
    insight = "No applications yet. Start by evaluating a job posting."
  }

  return (
    <IntelShell activeTab={tab}>
      {tab === "analytics" && (
        <AnalyticsContent
          apps={apps.length}
          byStatus={byStatus}
          byCompany={byCompany}
          scoreGroups={scoreGroups}
          funnelStages={funnelStages}
          last8Weeks={last8Weeks}
          insight={insight}
        />
      )}
    </IntelShell>
  )
}
