import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePatientPage } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function PatientDashboard() {
  const { session, patient } = await requirePatientPage();

  const [recordCount, pendingCount, dispensedCount, recentRecords, recentRx] =
    await Promise.all([
      prisma.medicalRecord.count({ where: { patientId: patient.id } }),
      prisma.prescription.count({
        where: { patientId: patient.id, status: "PENDING" },
      }),
      prisma.prescription.count({
        where: { patientId: patient.id, status: "DISPENSED" },
      }),
      prisma.medicalRecord.findMany({
        where: { patientId: patient.id },
        include: { doctor: { include: { user: { select: { name: true } } } } },
        orderBy: { visitDate: "desc" },
        take: 5,
      }),
      prisma.prescription.findMany({
        where: { patientId: patient.id },
        include: { doctor: { include: { user: { select: { name: true } } } } },
        orderBy: { issuedAt: "desc" },
        take: 5,
      }),
    ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand-dark">
          Patient Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Signed in as <span className="font-medium">{session.user.name}</span>.
          View your medical history and active prescriptions.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Medical records" value={recordCount} />
        <Stat label="Active prescriptions" value={pendingCount} accent="amber" />
        <Stat label="Dispensed" value={dispensedCount} accent="green" />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent records</h2>
            <Link
              href="/patient/records"
              className="text-sm text-brand hover:text-brand-dark"
            >
              View all →
            </Link>
          </div>
          {recentRecords.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No records yet.</p>
          ) : (
            <ul className="mt-3 divide-y text-sm">
              {recentRecords.map((r) => (
                <li key={r.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.diagnosis}</span>
                    <time className="text-xs text-gray-500">
                      {new Date(r.visitDate).toLocaleDateString()}
                    </time>
                  </div>
                  <p className="text-xs text-gray-500">
                    Dr. {r.doctor.user.name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent prescriptions</h2>
            <Link
              href="/patient/prescriptions"
              className="text-sm text-brand hover:text-brand-dark"
            >
              View all →
            </Link>
          </div>
          {recentRx.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No prescriptions yet.</p>
          ) : (
            <ul className="mt-3 divide-y text-sm">
              {recentRx.map((p) => (
                <li key={p.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {p.medication}{" "}
                      <span className="font-normal text-gray-600">
                        — {p.dosage}, {p.frequency}
                      </span>
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-gray-500">
                    Issued {new Date(p.issuedAt).toLocaleDateString()} by Dr.{" "}
                    {p.doctor.user.name}
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

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "DISPENSED"
      ? "bg-green-100 text-green-700"
      : status === "CANCELLED"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {status.toLowerCase()}
    </span>
  );
}
