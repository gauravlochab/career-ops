import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PipelineActions } from "../pipeline/pipeline-actions"
import { AddToPipelineForm } from "../pipeline/pipeline-add"
import type { PipelineItem } from "@/lib/api"

interface Props {
  paginated: PipelineItem[]
  done: PipelineItem[]
  query: string
  q: string | undefined
  filtered: PipelineItem[]
  currentPage: number
  totalPages: number
  pageStart: number
  pageEnd: number
}

function platformBadge(url: string) {
  if (url.includes("greenhouse.io")) return "Greenhouse"
  if (url.includes("ashbyhq.com")) return "Ashby"
  if (url.includes("lever.co")) return "Lever"
  if (url.includes("linkedin.com")) return "LinkedIn"
  if (url.includes("workday.com")) return "Workday"
  return "Job Board"
}

function platformColor(platform: string) {
  const map: Record<string, string> = {
    Greenhouse: "bg-green-100 text-green-800",
    Ashby: "bg-blue-100 text-blue-800",
    Lever: "bg-purple-100 text-purple-800",
    LinkedIn: "bg-sky-100 text-sky-800",
    Workday: "bg-orange-100 text-orange-800",
  }
  return map[platform] ?? "bg-gray-100 text-gray-600"
}

function pageHref(p: number, query: string, q: string | undefined) {
  const params = new URLSearchParams()
  params.set("tab", "pipeline")
  if (query) params.set("q", q!)
  if (p > 1) params.set("page", String(p))
  return `/dashboard/find?${params.toString()}`
}

export function PipelineContent({
  paginated,
  done,
  query,
  q,
  filtered,
  currentPage,
  totalPages,
  pageStart,
  pageEnd,
}: Props) {
  const sections = [...new Set(paginated.map(i => i.section))]

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div />
        <AddToPipelineForm baseHref="/dashboard/find?tab=pipeline" />
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input type="hidden" name="tab" value="pipeline" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by company, role, or URL…"
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {query && (
          <a
            href="/dashboard/find?tab=pipeline"
            className="h-9 px-3 py-1 text-sm rounded-md border flex items-center text-muted-foreground hover:bg-muted"
          >
            Clear
          </a>
        )}
      </form>

      {/* Pending list */}
      {paginated.length === 0 && filtered.length > 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <p className="text-2xl">🔍</p>
          <p className="font-medium">No results for &ldquo;{q}&rdquo;</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <p className="text-2xl">📬</p>
          <p className="font-medium">Pipeline is empty</p>
          <p className="text-sm">Add job URLs or use the Scan tab to find new jobs</p>
        </div>
      ) : (
        <>
          {sections.map(section => (
            <div key={section} className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono">
                {section === "Pendientes" || section === "PENDIENTES" ? "Pending" : section}
              </p>
              {paginated
                .filter(i => i.section === section)
                .map((item, idx) => {
                  const platform = platformBadge(item.url)
                  return (
                    <Card key={idx} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="size-2 rounded-full bg-orange-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              {item.company && (
                                <span className="font-semibold text-sm">{item.company}</span>
                              )}
                              {item.role && (
                                <span className="text-sm text-muted-foreground truncate">
                                  {item.role}
                                </span>
                              )}
                              <Badge
                                className={`text-[10px] shrink-0 ${platformColor(platform)}`}
                                variant="secondary"
                              >
                                {platform}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              {item.url}
                            </p>
                          </div>
                          <PipelineActions
                            url={item.url}
                            evaluateHref={`/dashboard/find?tab=evaluate&url=${encodeURIComponent(item.url)}`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages} · {filtered.length} total
              </span>
              <div className="flex gap-1">
                {currentPage > 1 && (
                  <a
                    href={pageHref(currentPage - 1, query, q)}
                    className="h-8 px-3 text-sm rounded-md border flex items-center hover:bg-muted"
                  >
                    ← Prev
                  </a>
                )}
                {currentPage < totalPages && (
                  <a
                    href={pageHref(currentPage + 1, query, q)}
                    className="h-8 px-3 text-sm rounded-md border flex items-center hover:bg-muted"
                  >
                    Next →
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {done.length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono">
            Done ({done.length})
          </p>
          {done.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg border px-3 py-2 opacity-50"
            >
              <span className="text-green-700 text-sm">✓</span>
              <span className="text-sm truncate flex-1">
                {item.company && item.role
                  ? `${item.company} — ${item.role}`
                  : item.url}
              </span>
              <PipelineActions url={item.url} done={true} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
