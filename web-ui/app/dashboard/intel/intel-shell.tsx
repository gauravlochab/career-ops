"use client"

import { InsightsClient } from "./insights-client"

const TABS = [
  { key: "analytics", label: "Analytics" },
  { key: "insights", label: "AI Insights" },
]

interface IntelShellProps {
  activeTab: string
  children: React.ReactNode
}

export function IntelShell({ activeTab, children }: IntelShellProps) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Intelligence</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activeTab === "analytics"
            ? "Charts and metrics across your pipeline"
            : "AI-powered pattern analysis"}
        </p>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <a
            key={t.key}
            href={`/dashboard/intel?tab=${t.key}`}
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
        {activeTab === "analytics" && children}
        {activeTab === "insights" && <InsightsClient />}
      </div>
    </>
  )
}
