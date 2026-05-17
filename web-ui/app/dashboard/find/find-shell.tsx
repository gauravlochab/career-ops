"use client"

import { ScannerClient } from "./scanner-client"
import { EvaluateClient } from "./evaluate-client"
import { BatchClient } from "../batch/batch-client"
import { Suspense } from "react"
import type { PipelineItem } from "@/lib/api"

const TABS = [
  { key: "pipeline", label: "Pipeline" },
  { key: "scan", label: "Scan for Jobs" },
  { key: "evaluate", label: "Evaluate" },
  { key: "batch", label: "Batch Evaluate" },
]

interface FindShellProps {
  activeTab: string
  pendingCount: number
  doneCount: number
  batchItems: PipelineItem[]
  prefillUrl?: string
  children: React.ReactNode
}

export function FindShell({
  activeTab,
  pendingCount,
  doneCount,
  batchItems,
  prefillUrl,
  children,
}: FindShellProps) {
  const subtitle: Record<string, string> = {
    pipeline: `${pendingCount} pending · ${doneCount} done`,
    scan: "Zero-token scan of Greenhouse, Ashby, and Lever portals",
    evaluate: "Evaluate a single job posting — report + tracker update",
    batch: "Evaluate multiple pending jobs in parallel",
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find Jobs</h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle[activeTab] ?? ""}</p>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <a
            key={t.key}
            href={`/dashboard/find?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-2">
        {activeTab === "pipeline" && children}
        {activeTab === "scan" && <ScannerClient />}
        {activeTab === "evaluate" && (
          <Suspense>
            <EvaluateClient initialUrl={prefillUrl} />
          </Suspense>
        )}
        {activeTab === "batch" && <BatchClient items={batchItems} />}
      </div>
    </>
  )
}
