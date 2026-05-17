"use client"

import { useState, useRef, useCallback } from "react"
import { API_BASE } from "@/lib/constants"
import type { StagePattern } from "@/lib/stage-patterns"
import { makeDetectStage } from "@/lib/stage-patterns"

type JobState = "idle" | "running" | "done" | "error"

interface UseStreamingJobOptions {
  startEndpoint: string
  streamPath: (jobId: string) => string
  stagePatterns: StagePattern[]
  onDone?: (jobId: string) => void
}

interface UseStreamingJobReturn {
  state: JobState
  lines: string[]
  currentStage: string | null
  completedStages: string[]
  errorMsg: string | null
  start: (body?: Record<string, unknown>) => Promise<void>
  reset: () => void
}

export function useStreamingJob({
  startEndpoint,
  streamPath,
  stagePatterns,
  onDone,
}: UseStreamingJobOptions): UseStreamingJobReturn {
  const [state, setState] = useState<JobState>("idle")
  const [lines, setLines] = useState<string[]>([])
  const [currentStage, setCurrentStage] = useState<string | null>(null)
  const [completedStages, setCompletedStages] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  const detectStage = makeDetectStage(stagePatterns)

  const reset = useCallback(() => {
    esRef.current?.close()
    esRef.current = null
    setState("idle")
    setLines([])
    setCurrentStage(null)
    setCompletedStages([])
    setErrorMsg(null)
  }, [])

  const start = useCallback(async (body?: Record<string, unknown>) => {
    esRef.current?.close()
    esRef.current = null

    setState("running")
    setLines([])
    setCurrentStage(null)
    setCompletedStages([])
    setErrorMsg(null)

    let jobId: string
    try {
      const r = await fetch(`${API_BASE}${startEndpoint}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!r.ok) {
        const payload = await r.json().catch(() => ({}))
        throw new Error((payload as { error?: string }).error || `Server error ${r.status}`)
      }
      const data = await r.json() as { jobId: string }
      jobId = data.jobId
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setState("error")
      setErrorMsg(msg)
      return
    }

    const es = new EventSource(`${API_BASE}${streamPath(jobId)}`)
    esRef.current = es

    const seenStages = new Set<string>()
    let lastStage: string | null = null

    es.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as { line?: string; done?: boolean; error?: string }

      if (msg.line !== undefined) {
        setLines(prev => [...prev, msg.line!])
        const stage = detectStage(msg.line!)
        if (stage && !seenStages.has(stage)) {
          seenStages.add(stage)
          if (lastStage && lastStage !== stage) {
            const prev = lastStage
            setCompletedStages(cs => cs.includes(prev) ? cs : [...cs, prev])
          }
          lastStage = stage
          setCurrentStage(stage)
        }
      }

      if (msg.done) {
        es.close()
        esRef.current = null
        if (msg.error) {
          setState("error")
          setErrorMsg(msg.error)
          setCurrentStage(null)
        } else {
          setState("done")
          setCurrentStage(null)
          onDone?.(jobId)
        }
      }
    }

    es.onerror = () => {
      es.close()
      esRef.current = null
      setState("error")
      setErrorMsg("Connection lost.")
      setCurrentStage(null)
    }
  }, [startEndpoint, streamPath, detectStage, onDone])

  return { state, lines, currentStage, completedStages, errorMsg, start, reset }
}
