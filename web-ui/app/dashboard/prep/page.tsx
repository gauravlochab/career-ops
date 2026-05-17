import { Metadata } from "next"
import fs from "fs/promises"
import path from "path"
import { PrepShell } from "./prep-shell"

export const metadata: Metadata = { title: "Interview Prep — career-ops" }

const ROOT = path.resolve(process.cwd(), "..")

export default async function PrepPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; company?: string }>
}) {
  const { tab = "practice", company } = await searchParams

  // Read story bank (optional)
  let storyBank = ""
  try {
    storyBank = await fs.readFile(path.join(ROOT, "interview-prep", "story-bank.md"), "utf-8")
  } catch {}

  // Read interview prep files for a company if provided
  let companyReport = ""
  if (company) {
    try {
      const files = await fs.readdir(path.join(ROOT, "interview-prep"))
      const match = files.find(
        (f) =>
          f.toLowerCase().includes(company.toLowerCase()) &&
          f.endsWith(".md") &&
          f !== "story-bank.md"
      )
      if (match) {
        companyReport = await fs.readFile(
          path.join(ROOT, "interview-prep", match),
          "utf-8"
        )
      }
    } catch {}
  }

  // List available company prep files
  let prepFiles: string[] = []
  try {
    const files = await fs.readdir(path.join(ROOT, "interview-prep"))
    prepFiles = files
      .filter((f) => f.endsWith(".md") && f !== "story-bank.md")
      .map((f) => f.replace(".md", ""))
  } catch {}

  return (
    <PrepShell
      activeTab={tab}
      storyBank={storyBank}
      companyReport={companyReport}
      prepFiles={prepFiles}
    />
  )
}
