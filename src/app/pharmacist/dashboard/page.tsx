import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePharmacistPage } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function PharmacistDashboard() {
  const { session, pharmacist } = await requirePharmacistPage();

  const [pendingCount, dispensedByMeCount, totalDispensed, recentDispensed] =
    await Promise.all([
      prisma.prescription.count({ where: { status: "PENDING" } }),
      prisma.prescription.count({
        where: { status: "DISPENSED", dispensedById: pharmacist.id },
      }),
      prisma.prescription.count({ where: { status: "DISPENSED" } }),
      prisma.prescription.findMany({
        where: { status: "DISPENSED", dispensedById: pharmacist.id },
        include: {
          patient: { include: { user: { select: { name: true } } } },
        },
        orderBy: { dispensedAt: "desc" },
        take: 5,
      }),
    ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand-dark">
          Pharmacist Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Signed in as <span className="font-medium">{session.user.name}</span>
          {pharmacist.pharmacyName ? ` — ${pharmacist.pharmacyName}` : ""}.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Pending in queue" value={pendingCount} accent="amber" />
        <Stat label="Dispensed by me" value={dispensedByMeCount} accent="green" />
        <Stat label="Dispensed total" value={totalDispensed} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Quick actions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/pharmacist/queue"
                className="text-brand hover:text-brand-dark"
              >
                Open the dispense queue →
              </Link>
            </li>
            <li>
              <Link
                href="/pharmacist/history"
                className="text-brand hover:text-brand-dark"
              >
                View my dispense history →
              </Link>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Recently dispensed by me</h2>
          {recentDispensed.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">
              You haven&apos;t dispensed any prescriptions yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y text-sm">
              {recentDispensed.map((p) => (
                <li key={p.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {p.medication}{" "}
                      <span className="font-normal text-gray-600">
                        — {p.dosage}
                      </span>
                    </span>
                    <time className="text-xs text-gray-500">
                      {p.dispensedAt
                        ? new Date(p.dispensedAt).toLocaleDateString()
                        : ""}
                    </time>
                  </div>
                  <p className="text-xs text-gray-500">
                    For {p.patient.user.name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "amber" | "green";
}) {
  const color =
    accent === "amber"
      ? "text-amber-700"
      : accent === "green"
        ? "text-green-700"
        : "text-brand-dark";
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
