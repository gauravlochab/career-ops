"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { API_BASE } from "@/lib/constants"

type State = "idle" | "running" | "done" | "error"

const STAGE_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "Fetching job posting", pattern: /fetch|scraping|getting|retrieving|navigat/i },
  { label: "Analyzing fit",        pattern: /analyz|evaluat|assess|review/i },
  { label: "Scoring",              pattern: /scor|block [A-F]|A\.|B\.|C\.|D\.|E\.|F\./i },
  { label: "Writing report",       pattern: /report|writing|generat/i },
  { label: "Updating tracker",     pattern: /tracker|application|tsv|merge/i },
]

function detectStage(line: string): string | null {
  for (const { label, pattern } of STAGE_PATTERNS) {
    if (pattern.test(line)) return label
  }
  return null
}

function extractSummary(lines: string[]): { score: string | null; company: string | null } {
  let score: string | null = null
  let company: string | null = null
  for (const line of lines) {
    const scoreMatch = line.match(/(\d+\.?\d*)\/5/)
    if (scoreMatch && !score) score = scoreMatch[1]
    const companyMatch = line.match(/(?:company|empresa|firma)[:\s]+([A-Z][a-zA-Z\s]+?)(?:\s*[-|,]|$)/i)
    if (companyMatch && !company) company = companyMatch[1].trim()
  }
  return { score, company }
}

export function EvaluateClient({ initialUrl }: { initialUrl?: string }) {
  const searchParams = useSearchParams()
  const [url, setUrl] = useState(initialUrl ?? "")

  useEffect(() => {
    // Prefer initialUrl prop, then fall back to ?url= searchParam
    const prefill = initialUrl ?? searchParams?.get("url") ?? ""
    if (prefill) setUrl(prefill)
  }, [initialUrl, searchParams])

  const [pastedJd, setPastedJd] = useState("")
  const [showPaste, setShowPaste] = useState(false)

  const [state, setState] = useState<State>("idle")
  const [lines, setLines] = useState<string[]>([])
  const [currentStage, setCurrentStage] = useState<string | null>(null)
  const [completedStages, setCompletedStages] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const logRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)
  const seenStages = useRef<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [lines])

  useEffect(() => () => { esRef.current?.close() }, [])

  // Submission is valid if URL is filled, or pasted JD is filled (or both)
  const canSubmit = url.trim().length > 0 || pastedJd.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setState("running")
    setLines([])
    setErrorMsg("")
    setCurrentStage(null)
    setCompletedStages([])
    seenStages.current = new Set()

    // Build request body — include pastedJd when present
    const body: Record<string, string> = {}
    if (url.trim()) body.url = url.trim()
    if (pastedJd.trim()) body.pastedJd = pastedJd.trim()
    // If only pasted JD with no URL, send a placeholder so the server's URL validation
    // is satisfied only when there really is a URL; the server accepts pastedJd-only.
    // (Server was updated to allow pastedJd without url.)

    let jobId: string
    try {
      const r = await fetch(`${API_BASE}/api/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}))
        throw new Error(errBody.error || `Server error ${r.status}`)
      }
      const data = await r.json()
      jobId = data.jobId
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setState("error")
      return
    }

    const es = new EventSource(`${API_BASE}/api/evaluate/${jobId}/stream`)
    esRef.current = es

    es.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.line !== undefined) {
        setLines(prev => [...prev, msg.line])
        const stage = detectStage(msg.line)
        if (stage && !seenStages.current.has(stage)) {
          seenStages.current.add(stage)
          setCurrentStage(stage)
          setCompletedStages(prev => {
            return prev
          })
        }
        setCompletedStages(prev => {
          if (stage && stage !== currentStage && currentStage && !prev.includes(currentStage)) {
            return [...prev, currentStage]
          }
          return prev
        })
      }
      if (msg.done) {
        es.close()
        if (msg.error) {
          setErrorMsg(msg.error)
          setState("error")
        } else {
          setCurrentStage(null)
          setState("done")
          // Auto-mark pipeline item done if URL came from prefill (pipeline link)
          const fromPipeline = initialUrl ?? searchParams?.get("url")
          if (fromPipeline) {
            fetch(`${API_BASE}/api/pipeline`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: fromPipeline, done: true }),
            }).catch(() => {})
          }
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
    setUrl("")
    setPastedJd("")
    setShowPaste(false)
    setLines([])
    setErrorMsg("")
    setCurrentStage(null)
    setCompletedStages([])
    seenStages.current = new Set()
    setState("idle")
  }

  const summary = state === "done" ? extractSummary(lines) : { score: null, company: null }
  const allStages = STAGE_PATTERNS.map(s => s.label)

  return (
    <>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Job URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://jobs.lever.co/company/job-id"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={state === "running"}
                className="flex-1"
              />
              {state === "idle" || state === "error" ? (
                <Button type="submit" disabled={!canSubmit}>
                  Evaluate
                </Button>
              ) : state === "running" ? (
                <Button type="button" variant="outline" disabled>
                  Running…
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handleReset}>
                  Evaluate another
                </Button>
              )}
            </div>

            {/* Paste JD toggle */}
            {(state === "idle" || state === "error") && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPaste(v => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors select-none"
                >
                  {showPaste ? "hide paste area ▴" : "or paste job description ▾"}
                </button>

                {showPaste && (
                  <div className="mt-2 space-y-1">
                    <textarea
                      rows={8}
                      placeholder="Paste the full job description here…"
                      value={pastedJd}
                      onChange={e => setPastedJd(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {url.trim()
                        ? "URL is set — the pasted text will be used instead of fetching the URL."
                        : "No URL needed — evaluation will use the pasted text only."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {state === "done" && (
        <Card className="max-w-2xl border-green-200 bg-green-50/30">
          <CardContent className="pt-5">
            <div className="flex items-start gap-4">
              <div className="text-3xl">✅</div>
              <div className="flex-1">
                <p className="font-semibold text-base">Evaluation complete</p>
                {summary.company && (
                  <p className="text-sm text-muted-foreground mt-0.5">{summary.company}</p>
                )}
                {summary.score && (
                  <p className="text-sm mt-1">
                    Score: <span className="font-bold text-foreground">{summary.score}/5</span>
                    <span className="text-muted-foreground ml-2">
                      {parseFloat(summary.score) >= 4.0
                        ? "— Strong fit, consider applying"
                        : parseFloat(summary.score) >= 3.5
                        ? "— Decent fit"
                        : "— Weak fit"}
                    </span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Report saved · Tracker updated</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => router.push("/dashboard/tracker")}>
                View in Tracker
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Evaluate another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {state !== "idle" && (
        <Card className="max-w-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {state === "running" && "Running evaluation…"}
                {state === "done" && "Full log"}
                {state === "error" && "Evaluation failed"}
              </CardTitle>
              {state === "running" && (
                <div className="flex items-center gap-2">
                  {currentStage && (
                    <span className="text-xs text-muted-foreground italic">{currentStage}…</span>
                  )}
                  <span className="inline-flex size-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              )}
            </div>
            {state === "running" && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {allStages.map(stage => {
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
                      {isDone ? "✓ " : isActive ? "⟳ " : ""}{stage}
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
                <span className="text-muted-foreground">Starting claude…</span>
              )}
              {lines.map((l, i) => (
                <div key={i} className={l.startsWith("⚠") ? "text-yellow-600" : ""}>{l}</div>
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
