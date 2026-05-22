import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import Link from "next/link";
import { requirePatientPage } from "@/lib/server-auth";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

// The Markdown source is repo-controlled and never changes between deploys.
// `React.cache` (re-exported from the existing `react` 18.3.1 dep, no new
// package) memoises the result for the duration of a single render pass,
// so even if this loader were called from multiple Server Components in
// the same request graph the underlying `fs.readFile` would fire once
// per request instead of once per call site. This was the lowest-friction
// fix the v1 review suggested for the per-request disk-read concern.
const loadGuideMarkdown = cache(async (): Promise<string> => {
  const mdPath = path.join(
    process.cwd(),
    "docs",
    "glp1-education",
    "glp1_patient_guide.md",
  );
  return fs.readFile(mdPath, "utf8");
});

export default async function Glp1EducationPage() {
  await requirePatientPage();

  const md = await loadGuideMarkdown();

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/patient/education"
          className="text-sm text-gray-500 hover:text-brand"
        >
          ← Education
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/education/glp1_patient_guide.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Preview / Download PDF
        </a>
      </div>

      <article className="rounded-lg border bg-white p-6 shadow-sm">
        {renderMarkdown(md)}
      </article>
    </div>
  );
}
