"use client"

import { InterviewContent } from "./interview-content"
import { RecruiterFindClient } from "./recruiter-find-client"

const TABS = [
  { key: "practice", label: "Interview Practice" },
  { key: "recruiter", label: "Find Recruiters" },
]

interface PrepShellProps {
  activeTab: string
  storyBank: string
  companyReport: string
  prepFiles: string[]
}

export function PrepShell({
  activeTab,
  storyBank,
  companyReport,
  prepFiles,
}: PrepShellProps) {
  const subtitle: Record<string, string> = {
    practice: "Flashcard practice + company-specific prep reports",
    recruiter: "Find recruiters at target companies via LinkedIn",
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interview Prep</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {subtitle[activeTab] ?? ""}
        </p>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`/dashboard/prep?tab=${t.key}`}
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
        {activeTab === "practice" && (
          <InterviewContent
            storyBank={storyBank}
            companyReport={companyReport}
            prepFiles={prepFiles}
          />
        )}
        {activeTab === "recruiter" && <RecruiterFindClient />}
      </div>
    </>
  )
}
