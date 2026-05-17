import { getPipeline } from "@/lib/api"
import { Metadata } from "next"
import { FindShell } from "./find-shell"
import { PipelineContent } from "./pipeline-content"

export const metadata: Metadata = { title: "Find Jobs — career-ops" }

const PAGE_SIZE = 50

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string; url?: string }>
}) {
  const { tab = "pipeline", q, page: pageParam, url: prefillUrl } = await searchParams
  const query = q?.toLowerCase().trim() ?? ""
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const items = await getPipeline()
  const pending = items.filter(i => !i.done)
  const done = items.filter(i => i.done)

  const filtered = query
    ? pending.filter(i =>
        i.company.toLowerCase().includes(query) ||
        i.role.toLowerCase().includes(query) ||
        i.url.toLowerCase().includes(query)
      )
    : pending

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageEnd = pageStart + PAGE_SIZE
  const paginated = filtered.slice(pageStart, pageEnd)

  return (
    <FindShell
      activeTab={tab}
      pendingCount={pending.length}
      doneCount={done.length}
      batchItems={pending}
      prefillUrl={prefillUrl}
    >
      {tab === "pipeline" && (
        <PipelineContent
          paginated={paginated}
          done={done}
          query={query}
          q={q}
          filtered={filtered}
          currentPage={currentPage}
          totalPages={totalPages}
          pageStart={pageStart}
          pageEnd={pageEnd}
        />
      )}
    </FindShell>
  )
}
