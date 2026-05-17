import Link from "next/link";

const roles = [
  {
    title: "Patient",
    href: "/patient/dashboard",
    description: "View your medical records and prescriptions.",
  },
  {
    title: "Doctor",
    href: "/doctor/dashboard",
    description: "Manage patients, write records, issue prescriptions.",
  },
  {
    title: "Pharmacist",
    href: "/pharmacist/dashboard",
    description: "Review and dispense patient prescriptions.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-brand-dark">
          Medical-app
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          Medical records, clinic and doctor management, and prescription
          tracking — for patients, doctors, and pharmacists.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {roles.map((r) => (
          <Link
            key={r.title}
            href={r.href}
            className="rounded-lg border bg-white p-6 shadow-sm transition hover:border-brand hover:shadow"
          >
            <h2 className="text-lg font-semibold text-brand-dark">{r.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{r.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
