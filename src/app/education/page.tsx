import Link from "next/link";
import { requireSignedInPage } from "@/lib/server-auth";
import { dashboardPathForRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TOPICS: Array<{ slug: string; title: string; summary: string }> = [
  {
    slug: "glp1",
    title:
      "GLP-1 Receptor Agonists: How They Manage Blood Sugar and Help With Weight Loss",
    summary:
      "A plain-language overview of how GLP-1 medicines like semaglutide, liraglutide, and dulaglutide work, what to expect from them, and what to discuss with your doctor.",
  },
];

export default async function PatientEducationPage() {
  const session = await requireSignedInPage();

  return (
    <div className="space-y-6">
      <header>
        <Link
          href={dashboardPathForRole(session.user.role)}
          className="text-sm text-gray-500 hover:text-brand"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-brand-dark">
          Education
        </h1>
        <p className="text-sm text-gray-600">
          Plain-language guides to common conditions and medications.
        </p>
      </header>

      <ul className="space-y-3">
        {TOPICS.map((topic) => (
          <li
            key={topic.slug}
            className="rounded-lg border bg-white p-6 shadow-sm"
          >
            <h2 className="font-medium text-brand-dark">{topic.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{topic.summary}</p>
            <Link
              href={`/education/${topic.slug}`}
              className="mt-3 inline-block text-sm text-brand hover:text-brand-dark"
            >
              Read guide →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
