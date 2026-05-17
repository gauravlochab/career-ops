export interface StagePattern {
  label: string
  pattern: RegExp
}

export const EVALUATE_STAGE_PATTERNS: StagePattern[] = [
  { label: "Fetching job posting", pattern: /fetch|scraping|getting|retrieving|navigat/i },
  { label: "Analyzing fit",        pattern: /analyz|evaluat|assess|review/i },
  { label: "Scoring",              pattern: /scor|block [A-F]|A\.|B\.|C\.|D\.|E\.|F\./i },
  { label: "Writing report",       pattern: /report|writing|generat/i },
  { label: "Updating tracker",     pattern: /tracker|application|tsv|merge/i },
]

export const SCAN_STAGE_PATTERNS: StagePattern[] = [
  { label: "Connecting to portals", pattern: /fetch|connect|request|greenhouse|ashby|lever/i },
  { label: "Searching jobs",        pattern: /search|query|scan|found|job/i },
  { label: "Filtering results",     pattern: /filter|dedup|skip|seen|new/i },
  { label: "Saving to pipeline",    pattern: /writ|sav|pipeline|append/i },
  { label: "Done",                  pattern: /complete|finish|total|result/i },
]

export const PDF_STAGE_PATTERNS: StagePattern[] = [
  { label: "Reading CV",   pattern: /read|load|cv|resume/i },
  { label: "Customizing", pattern: /custom|tailor|adapt|match/i },
  { label: "Rendering",   pattern: /render|html|template|generat/i },
  { label: "Saving PDF",  pattern: /pdf|save|output|write|file/i },
]

export function makeDetectStage(patterns: StagePattern[]) {
  return function detectStage(line: string): string | null {
    for (const { label, pattern } of patterns) {
      if (pattern.test(line)) return label
    }
    return null
  }
}
