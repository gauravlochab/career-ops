"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { marked } from "marked"
import { API_BASE } from "@/lib/constants"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractQuestions(markdown: string): string[] {
  const questions: string[] = []
  const lines = markdown.split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (
      trimmed.startsWith("**Q:") ||
      trimmed.startsWith("**Question:") ||
      trimmed.match(/^\*\*.*\?\*\*/)
    ) {
      questions.push(
        trimmed
          .replace(/\*\*/g, "")
          .replace(/^Q:\s*/, "")
          .replace(/^Question:\s*/, "")
      )
    } else if (trimmed.match(/^#+\s+.+\?$/)) {
      questions.push(trimmed.replace(/^#+\s+/, ""))
    }
  }
  return questions
}

// ---------------------------------------------------------------------------
// PracticeMode — random flashcard drawn from the story bank
// ---------------------------------------------------------------------------

function PracticeMode({ storyBank }: { storyBank: string }) {
  const questions = extractQuestions(storyBank)
  const fallbackQuestions = [
    "Tell me about a time you led a team through a technical challenge.",
    "Describe a situation where you had to make a difficult decision with limited information.",
    "Give an example of when you delivered results under a tight deadline.",
    "Tell me about a time you disagreed with a stakeholder and how you handled it.",
    "What's the most complex system you've designed or contributed to?",
    "Tell me about a time your work had a measurable business impact.",
    "Describe a failure and what you learned from it.",
  ]
  const allQ = questions.length > 0 ? questions : fallbackQuestions

  const [current, setCurrent] = useState<string | null>(null)
  const [showing, setShowing] = useState(false)

  function draw() {
    const next = allQ[Math.floor(Math.random() * allQ.length)]
    setCurrent(next)
    setShowing(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant="outline" onClick={draw} className="w-full">
        Practice random question
      </Button>
      {showing && current && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-foreground mb-1">Question:</p>
            <p className="text-sm text-muted-foreground">{current}</p>
            <div className="mt-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Use the STAR+R framework:</p>
              <p>Situation &rarr; Task &rarr; Action &rarr; Result &rarr; Reflection</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs"
              onClick={draw}
            >
              Next question &rarr;
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CompanyFileViewer — loads a prep file on demand via the API
// ---------------------------------------------------------------------------

function CompanyFileViewer({ files }: { files: string[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadFile(name: string) {
    if (selected === name) {
      setSelected(null)
      setContent(null)
      return
    }
    setSelected(name)
    setLoading(true)
    try {
      const r = await fetch(
        `${API_BASE}/api/interview-file/${encodeURIComponent(name)}`
      )
      if (r.ok) {
        const d = await r.json()
        setContent(d.content)
      }
    } finally {
      setLoading(false)
    }
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2 text-center">
        <p className="text-2xl">🏢</p>
        <p className="text-sm font-medium">No company files yet</p>
        <p className="text-xs">
          Run a job evaluation to generate company-specific prep.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        {files.map((f) => (
          <button
            key={f}
            onClick={() => loadFile(f)}
            className={`rounded-md px-3 py-2 text-sm text-left transition-colors capitalize ${
              selected === f
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {f.replace(".md", "").replace(/-/g, " ")}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-3 border-t pt-3">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading&hellip;</p>
          ) : content ? (
            <div
              className="prose prose-sm max-w-none max-h-80 overflow-y-auto
                prose-headings:font-semibold prose-headings:text-foreground
                prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-li:text-muted-foreground prose-strong:text-foreground
                prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs"
              dangerouslySetInnerHTML={{ __html: marked(content) as string }}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Could not load file.
            </p>
          )}
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// InterviewContent — main export: story bank + practice + company selector
// ---------------------------------------------------------------------------

interface InterviewContentProps {
  storyBank: string
  companyReport: string
  prepFiles: string[]
}

export function InterviewContent({
  storyBank,
  companyReport,
  prepFiles,
}: InterviewContentProps) {
  const storyHTML = marked(storyBank) as string
  const companyReportHTML = companyReport
    ? (marked(companyReport) as string)
    : null

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Story bank — main panel */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Story Bank</CardTitle>
            <span className="text-xs text-muted-foreground">
              Your STAR+R stories
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {storyBank.trim() === "# Story Bank\n\nNo stories yet." ||
          storyBank.includes("No stories yet") ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 text-center">
              <p className="text-3xl">📖</p>
              <p className="text-sm font-medium">Story bank is empty</p>
              <p className="text-xs max-w-xs">
                Your STAR+R stories will be extracted automatically when you
                evaluate jobs.{" "}
                <a
                  href="/dashboard/find?tab=evaluate"
                  className="text-blue-600 hover:underline"
                >
                  Evaluate a job
                </a>{" "}
                to get started.
              </p>
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none max-h-[60vh] overflow-y-auto
                prose-headings:font-semibold prose-headings:text-foreground
                prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-li:text-muted-foreground prose-strong:text-foreground
                prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs"
              dangerouslySetInnerHTML={{ __html: storyHTML }}
            />
          )}
        </CardContent>
      </Card>

      {/* Right sidebar: practice + company selector */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Practice Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <PracticeMode storyBank={storyBank} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Company Prep ({prepFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Link list so URL updates and server re-fetches the report */}
            {prepFiles.length > 0 && (
              <div className="flex flex-col gap-1 mb-3">
                {prepFiles.map((f) => (
                  <a
                    key={f}
                    href={`/dashboard/prep?tab=practice&company=${encodeURIComponent(f)}`}
                    className="rounded-md px-3 py-2 text-sm capitalize hover:bg-muted transition-colors"
                  >
                    {f.replace(/-/g, " ")}
                  </a>
                ))}
              </div>
            )}
            <CompanyFileViewer files={prepFiles} />
          </CardContent>
        </Card>

        {/* Company prep report (loaded via URL param) */}
        {companyReportHTML && (
          <Card className="border-blue-200 bg-blue-50/20">
            <CardHeader>
              <CardTitle className="text-base">Company Prep Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none max-h-80 overflow-y-auto
                  prose-headings:font-semibold prose-headings:text-foreground
                  prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-li:text-muted-foreground prose-strong:text-foreground
                  prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs"
                dangerouslySetInnerHTML={{ __html: companyReportHTML }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
