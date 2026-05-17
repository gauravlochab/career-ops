"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { API_BASE } from "@/lib/constants"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RunState = "idle" | "running" | "done" | "error"

const STAGE_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "Searching LinkedIn",   pattern: /linkedin|search|query/i },
  { label: "Finding profiles",     pattern: /profile|recruit|hr|people/i },
  { label: "Extracting contacts",  pattern: /email|contact|extract/i },
  { label: "Done",                 pattern: /complete|finish|found|result/i },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectStage(line: string): string | null {
  for (const { label, pattern } of STAGE_PATTERNS) {
    if (pattern.test(line)) return label
  }
  return null
}

function extractFoundCount(lines: string[]): number | null {
  for (const line of lines) {
    const m = line.match(/(\d+)\s+(recruit|contact|profile|result)/i)
    if (m) return parseInt(m[1], 10)
  }
  return null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecruiterFindClient() {
  const [company, setCompany] = useState("")
  const [state, setState] = useState<RunState>("idle")
  const [lines, setLines] = useState<string[]>([])
  const [currentStage, setCurrentStage] = useState<string | null>(null)
  const [completedStages, setCompletedStages] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const logRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)
  const seenStages = useRef<Set<string>>(new Set())
  const currentStageRef = useRef<string | null>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [lines])

  useEffect(() => () => { esRef.current?.close() }, [])

  async function handleFind(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim()) return

    setState("running")
    setLines([])
    setErrorMsg("")
    setCurrentStage(null)
    setCompletedStages([])
    seenStages.current = new Set()
    currentStageRef.current = null

    let jobId: string
    try {
      const r = await fetch(`${API_BASE}/api/recruiter-find`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: company.trim() }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `Server error ${r.status}`)
      }
      const data = await r.json() as { jobId: string }
      jobId = data.jobId
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setState("error")
      return
    }

    const es = new EventSource(`${API_BASE}/api/recruiter-find/${jobId}/stream`)
    esRef.current = es

    es.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as { line?: string; done?: boolean; error?: string }
      if (msg.line !== undefined) {
        setLines((prev) => [...prev, msg.line as string])
        const stage = detectStage(msg.line as string)
        if (stage && !seenStages.current.has(stage)) {
          seenStages.current.add(stage)
          const prev = currentStageRef.current
          if (prev && prev !== stage) {
            setCompletedStages((cs) =>
              cs.includes(prev) ? cs : [...cs, prev]
            )
          }
          currentStageRef.current = stage
          setCurrentStage(stage)
        }
      }
      if (msg.done) {
        es.close()
        if (msg.error) {
          setErrorMsg(msg.error)
          setState("error")
        } else {
          if (currentStageRef.current) {
            setCompletedStages((cs) =>
              cs.includes(currentStageRef.current!)
                ? cs
                : [...cs, currentStageRef.current!]
            )
          }
          setCurrentStage(null)
          setState("done")
        }
      }
    }

    es.onerror = () => {
      es.close()
      setErrorMsg("Connection to server lost.")
      setState("error")
    }
  }

  function handleReset() {
    esRef.current?.close()
    setCompany("")
    setLines([])
    setErrorMsg("")
    setCurrentStage(null)
    setCompletedStages([])
    seenStages.current = new Set()
    setState("idle")
  }

  const allStages = STAGE_PATTERNS.map((s) => s.label)
  const foundCount = state === "done" ? extractFoundCount(lines) : null

  return (
    <>
      {/* Input card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Find Recruiters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFind} className="flex gap-2">
            <Input
              placeholder="Company name (required)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={state === "running"}
              className="flex-1"
              required
            />
            {state === "idle" || state === "error" ? (
              <Button type="submit" disabled={!company.trim()}>
                Find Recruiters
              </Button>
            ) : state === "running" ? (
              <Button type="button" variant="outline" disabled>
                Running&hellip;
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={handleReset}>
                Search Again
              </Button>
            )}
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Searches LinkedIn for HR and recruiting contacts at the target company.
          </p>
        </CardContent>
      </Card>

      {/* Success state */}
      {state === "done" && (
        <Card className="max-w-2xl border-green-200 bg-green-50/30">
          <CardContent className="pt-5">
            <div className="flex items-start gap-4">
              <div className="text-3xl">✅</div>
              <div className="flex-1">
                <p className="font-semibold text-base">Search complete</p>
                {foundCount !== null ? (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {foundCount} recruiter{foundCount !== 1 ? "s" : ""} found for{" "}
                    <span className="font-medium">{company}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Check the output above for recruiter contacts
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Use the contact details to send a personalised outreach message.
                  Check the <span className="font-mono">output/</span> directory
                  for the saved results.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={handleReset}>
                Search Another Company
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log / progress card */}
      {state !== "idle" && (
        <Card className="max-w-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {state === "running" && "Searching for recruiters…"}
                {state === "done" && "Full log"}
                {state === "error" && "Search failed"}
              </CardTitle>
              {state === "running" && (
                <div className="flex items-center gap-2">
                  {currentStage && (
                    <span className="text-xs text-muted-foreground italic">
                      {currentStage}&hellip;
                    </span>
                  )}
                  <span className="inline-flex size-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              )}
            </div>

            {/* Stage pills */}
            {state === "running" && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {allStages.map((stage) => {
                  const isDone = completedStages.includes(stage)
                  const isActive = stage === currentStage
                  return (
                    <span
                      key={stage}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        isDone
                          ? "bg-green-100 text-green-700"
                          : isActive
                          ? "bg-blue-100 text-blue-700 animate-pulse"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? "✓ " : isActive ? "⟳ " : ""}
                      {stage}
                    </span>
                  )
                })}
              </div>
            )}
          </CardHeader>

          <CardContent>
            <div
              ref={logRef}
              className="bg-muted rounded-md p-3 h-64 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap"
            >
              {lines.length === 0 && state === "running" && (
                <span className="text-muted-foreground">Starting search&hellip;</span>
              )}
              {lines.map((l, i) => (
                <div
                  key={i}
                  className={l.startsWith("⚠") ? "text-yellow-600" : ""}
                >
                  {l}
                </div>
              ))}
              {state === "error" && errorMsg && (
                <div className="text-red-500 mt-2 font-semibold">{errorMsg}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
