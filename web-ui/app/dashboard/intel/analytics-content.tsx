import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface ScoreGroup {
  label: string
  count: number
  color: string
}

export interface FunnelStage {
  label: string
  count: number
}

export interface WeekBucket {
  wk: string
  count: number
}

export interface AnalyticsContentProps {
  apps: number
  byStatus: { status: string; slug: string; count: number }[]
  byCompany: [string, number][]
  scoreGroups: ScoreGroup[]
  funnelStages: FunnelStage[]
  last8Weeks: WeekBucket[]
  insight: string
}

export function AnalyticsContent({
  apps,
  byCompany,
  scoreGroups,
  funnelStages,
  last8Weeks,
  insight,
}: AnalyticsContentProps) {
  const funnelMax = funnelStages[0]?.count || 1
  const maxCount = Math.max(...byCompany.map(([, c]) => c), 1)
  const totalScored = scoreGroups.reduce((s, g) => s + g.count, 0)
  const sparkMax = Math.max(...last8Weeks.map(w => w.count), 1)

  return (
    <>
      <p className="text-muted-foreground text-sm -mt-2">
        Patterns across {apps} application{apps !== 1 ? "s" : ""}
      </p>

      {insight && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm">
          <span className="font-semibold text-blue-900">Insight: </span>
          <span className="text-blue-800">{insight}</span>
        </div>
      )}

      {/* Conversion funnel */}
      <Card>
        <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {funnelStages.map((stage, i) => {
            const convPct =
              i > 0 && funnelStages[i - 1].count > 0
                ? Math.round((stage.count / funnelStages[i - 1].count) * 100)
                : null
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <a
                  href={`/dashboard/tracker?tab=${stage.label.toLowerCase()}`}
                  className="text-xs text-muted-foreground w-20 shrink-0 hover:text-foreground hover:underline"
                >
                  {stage.label}
                </a>
                <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(stage.count / funnelMax) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-semibold w-6 text-right shrink-0">
                  {stage.count}
                </span>
                {convPct !== null && (
                  <span className="text-[10px] text-muted-foreground w-12 shrink-0">
                    {convPct}% conv.
                  </span>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        {/* Weekly cadence sparkline */}
        <Card>
          <CardHeader><CardTitle className="text-base">Weekly Applications</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-16">
              {last8Weeks.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t bg-primary/70 transition-all"
                    style={{
                      height: `${
                        sparkMax > 0
                          ? Math.max((w.count / sparkMax) * 52, w.count > 0 ? 4 : 0)
                          : 0
                      }px`,
                    }}
                    title={`${w.wk}: ${w.count}`}
                  />
                  {i === last8Weeks.length - 1 && (
                    <span className="text-[9px] text-muted-foreground">now</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last 8 weeks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">By Score Range</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {scoreGroups.map(g => (
              <div key={g.label} className="flex items-center gap-2">
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{g.label}</span>
                    <span className="font-mono font-semibold">{g.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${g.color} rounded-full`}
                      style={{
                        width: `${totalScored > 0 ? (g.count / totalScored) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Companies</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {byCompany.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              byCompany.map(([company, count]) => (
                <div key={company} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{company}</span>
                    <span className="font-mono text-xs text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
