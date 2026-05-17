import { getApplications, getFollowUps, ALL_STATUSES, STATUS_LABELS, type CanonicalStatus } from "@/lib/api"
import { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TrackerCard } from "./tracker-client"
import { CompareContent } from "./compare-content"
import { TrackButton, AddFollowUpForm, DeleteFollowUpButton } from "../followups/followup-client"

export const metadata: Metadata = { title: "Tracker — career-ops" }

function daysSince(dateStr: string): number {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function urgencyLabel(dueDate: string): { label: string; cls: string } {
  if (!dueDate) return { label: "", cls: "" }
  const diff = (new Date(dueDate).getTime() - Date.now()) / 86400000
  if (diff < 0) return { label: `${Math.abs(Math.floor(diff))}d overdue`, cls: "bg-red-100 text-red-800" }
  if (diff <= 1) return { label: "Today/Tomorrow", cls: "bg-yellow-100 text-yellow-800" }
  return { label: `${Math.floor(diff)}d left`, cls: "bg-green-100 text-green-800" }
}

type SortKey = "days" | "date" | "company"

const SPECIAL_TABS = [
  { key: "followups", label: "Follow-ups" },
  { key: "compare", label: "Compare" },
] as const

type SpecialTab = (typeof SPECIAL_TABS)[number]["key"]

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; sort?: string }>
}) {
  const { tab, q, sort } = await searchParams

  const isSpecial = (tab === "followups" || tab === "compare")
  const activeTab = isSpecial ? (tab as SpecialTab) : ((tab as CanonicalStatus) || "evaluated")

  const apps = await getApplications()

  // Follow-ups data (needed for follow-ups tab + badge count)
  const followUps = await getFollowUps()
  const overdue = followUps.filter(f => f.dueDate && (new Date(f.dueDate).getTime() - Date.now()) / 86400000 < 0)
  const dueSoon = followUps.filter(f => f.dueDate && (new Date(f.dueDate).getTime() - Date.now()) / 86400000 >= 0 && (new Date(f.dueDate).getTime() - Date.now()) / 86400000 <= 2)

  // Applications tabs
  const countByStatus = (s: CanonicalStatus) => apps.filter(a => a.status === s).length

  // Filtered apps for status tab
  const query = q?.toLowerCase().trim() ?? ""
  const tabApps = isSpecial ? [] : apps.filter(a => a.status === (activeTab as CanonicalStatus))
  const filtered = query
    ? tabApps.filter(a =>
        a.company.toLowerCase().includes(query) ||
        a.role.toLowerCase().includes(query) ||
        a.notes.toLowerCase().includes(query)
      )
    : tabApps

  // Follow-ups tab data
  const sortKey: SortKey = (sort === "days" || sort === "date" || sort === "company") ? sort : "days"
  const trackedCompanies = new Set(followUps.map(f => f.company.toLowerCase()))
  const suggestions = apps.filter(a =>
    ["applied", "responded"].includes(a.status) && !trackedCompanies.has(a.company.toLowerCase())
  )
  const sorted = [...followUps].sort((a, b) => {
    if (sortKey === "company") return a.company.localeCompare(b.company)
    if (sortKey === "date") return (a.appliedDate || "").localeCompare(b.appliedDate || "")
    return daysSince(b.lastContact || b.appliedDate) - daysSince(a.lastContact || a.appliedDate)
  })

  function sortHref(key: SortKey) {
    const base = key === "days" ? "/dashboard/tracker?tab=followups" : `/dashboard/tracker?tab=followups&sort=${key}`
    return base
  }

  function sortHeader(label: string, key: SortKey) {
    const active = sortKey === key
    return (
      <a href={sortHref(key)} className={`hover:text-foreground ${active ? "text-foreground underline underline-offset-2" : ""}`}>
        {label}{active ? " ↓" : ""}
      </a>
    )
  }

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {apps.length} total application{apps.length !== 1 ? "s" : ""}
            {overdue.length > 0 && <span className="text-red-600 ml-2">· {overdue.length} follow-up{overdue.length !== 1 ? "s" : ""} overdue</span>}
          </p>
        </div>
        {activeTab === "followups" && <AddFollowUpForm />}
      </div>

      {/* Tab bar — status tabs + special tabs */}
      <div className="flex gap-1 overflow-x-auto border-b pb-px">
        {ALL_STATUSES.map(s => {
          const count = countByStatus(s)
          const isActive = !isSpecial && s === activeTab
          return (
            <Link
              key={s}
              href={`/dashboard/tracker?tab=${s}`}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {STATUS_LABELS[s]}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                {count}
              </span>
            </Link>
          )
        })}
        <div className="w-px bg-border mx-1 self-stretch" />
        <Link
          href="/dashboard/tracker?tab=followups"
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "followups"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Follow-ups
          {(overdue.length > 0 || dueSoon.length > 0) && (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-mono bg-orange-100 text-orange-700">
              {overdue.length + dueSoon.length}
            </span>
          )}
        </Link>
        <Link
          href="/dashboard/tracker?tab=compare"
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "compare"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Compare
        </Link>
      </div>

      {/* ── Status tab content ── */}
      {!isSpecial && (
        <>
          {tabApps.length > 3 && (
            <form method="GET" className="flex gap-2">
              <input type="hidden" name="tab" value={activeTab} />
              <input
                name="q"
                defaultValue={q}
                placeholder={`Search ${STATUS_LABELS[activeTab as CanonicalStatus].toLowerCase()} applications…`}
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {query && (
                <a href={`/dashboard/tracker?tab=${activeTab}`} className="h-9 px-3 py-1 text-sm rounded-md border flex items-center text-muted-foreground hover:bg-muted">
                  Clear
                </a>
              )}
            </form>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <p className="text-2xl">📭</p>
              <p className="font-medium">
                {query ? `No results for "${q}"` : `No ${STATUS_LABELS[activeTab as CanonicalStatus].toLowerCase()} applications`}
              </p>
              {!query && activeTab === "evaluated" && (
                <p className="text-sm">
                  Evaluate a job on the{" "}
                  <Link href="/dashboard/find?tab=evaluate" className="text-blue-600 hover:underline">Find Jobs page</Link>{" "}
                  to see it here.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(app => (
                <TrackerCard key={app.number} app={app} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Follow-ups tab content ── */}
      {activeTab === "followups" && (
        <>
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-700 font-mono">Suggested — Applied but not tracked</p>
              {suggestions.map(app => (
                <Card key={app.number} className="border-orange-200 bg-orange-50/20">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 grid grid-cols-3 gap-2 items-center">
                        <span className="font-semibold text-sm">{app.company}</span>
                        <span className="text-sm text-muted-foreground truncate">{app.role}</span>
                        <span className="text-xs text-muted-foreground font-mono">{daysSince(app.date)}d ago · {app.date}</span>
                      </div>
                      <TrackButton company={app.company} role={app.role} appliedDate={app.date} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {followUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <p className="text-2xl">📮</p>
              <p className="font-medium">No follow-ups tracked yet</p>
              <p className="text-sm">Use the &ldquo;+ Add follow-up&rdquo; button or track suggestions above.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{sortHeader("Company", "company")}</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Role</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{sortHeader("Applied", "date")}</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{sortHeader("Days Since", "days")}</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Next Action</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Due</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Notes</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(f => {
                        const urg = urgencyLabel(f.dueDate)
                        const isOverdue = urg.cls.includes("red")
                        return (
                          <tr key={f.number} className={`border-b last:border-0 hover:bg-muted/30 ${isOverdue ? "bg-red-50/30" : ""}`}>
                            <td className="px-4 py-3 font-semibold whitespace-nowrap">{f.company}</td>
                            <td className="px-4 py-3 text-muted-foreground max-w-48 truncate">{f.role}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{f.appliedDate}</td>
                            <td className="px-4 py-3 font-mono text-xs">
                              <span className={daysSince(f.lastContact || f.appliedDate) > 7 ? "text-orange-600 font-semibold" : "text-muted-foreground"}>
                                {daysSince(f.lastContact || f.appliedDate)}d
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{f.nextAction}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {urg.label && <Badge className={urg.cls} variant="secondary">{urg.label}</Badge>}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-40 truncate text-xs">{f.notes}</td>
                            <td className="px-4 py-3"><DeleteFollowUpButton num={f.number} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── Compare tab content ── */}
      {activeTab === "compare" && <CompareContent apps={apps.filter(a => a.reportNumber !== null)} />}
    </>
  )
}
