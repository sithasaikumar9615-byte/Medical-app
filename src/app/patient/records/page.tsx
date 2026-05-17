import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePatientPage } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function PatientRecordsPage() {
  const { patient } = await requirePatientPage();

  const records = await prisma.medicalRecord.findMany({
    where: { patientId: patient.id },
    include: {
      doctor: { include: { user: { select: { name: true } } } },
      prescriptions: {
        select: { id: true, medication: true, status: true },
      },
    },
    orderBy: { visitDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <Link
            href="/patient/dashboard"
            className="text-sm text-gray-500 hover:text-brand"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-brand-dark">
            Medical records
          </h1>
          <p className="text-sm text-gray-600">
            Your full visit history across all doctors.
          </p>
        </div>
      </header>

      {records.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
          You don&apos;t have any medical records yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {records.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-medium text-brand-dark">{r.diagnosis}</h2>
                  <p className="text-xs text-gray-500">
                    Dr. {r.doctor.user.name} ·{" "}
                    {new Date(r.visitDate).toLocaleDateString()}
                  </p>
                </div>
                {r.prescriptions.length > 0 && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {r.prescriptions.length} prescription
                    {r.prescriptions.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {r.notes && (
                <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
                  {r.notes}
                </p>
              )}
              {r.prescriptions.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-gray-600">
                  {r.prescriptions.map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <span className="text-gray-400">·</span>
                      <span className="font-medium text-gray-700">
                        {p.medication}
                      </span>
                      <span className="text-gray-400">—</span>
                      <span className="lowercase">{p.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
