import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import Link from "next/link";
import { requirePatientPage } from "@/lib/server-auth";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

// `React.cache` (re-exported from the existing `react` 18.3.1 dep, no new
// package) provides request-scoped dedup: any future Server Component on
// the same render pass that calls `loadGuideMarkdown()` reuses the same
// `fs.readFile` instead of re-reading the file. It does NOT cache across
// requests or across the process; with `dynamic = "force-dynamic"` and a
// single call site today the wrapper is a no-op, but it keeps the loader
// safe to call from additional Server Components later without fan-out.
// A 10 KB file does not warrant module-scope memoisation, which has its
// own dev-mode HMR subtleties.
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
