import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { requirePatientPage } from "@/lib/server-auth";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export default async function Glp1EducationPage() {
  await requirePatientPage();

  const mdPath = path.join(
    process.cwd(),
    "docs",
    "glp1-education",
    "glp1_patient_guide.md",
  );
  const md = await fs.readFile(mdPath, "utf8");

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
