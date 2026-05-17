import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireDoctorPage } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function DoctorDashboard() {
  const { session, doctor } = await requireDoctorPage();

  const [patientCount, recordCount, prescriptionCount, recentRecords] =
    await Promise.all([
      prisma.medicalRecord
        .findMany({
          where: { doctorId: doctor.id },
          distinct: ["patientId"],
          select: { patientId: true },
        })
        .then((rs) => rs.length),
      prisma.medicalRecord.count({ where: { doctorId: doctor.id } }),
      prisma.prescription.count({ where: { doctorId: doctor.id } }),
      prisma.medicalRecord.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: { include: { user: { select: { name: true } } } },
        },
        orderBy: { visitDate: "desc" },
        take: 5,
      }),
    ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand-dark">
          Doctor Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Signed in as <span className="font-medium">Dr. {session.user.name}</span>
          {doctor.specialty ? ` — ${doctor.specialty}` : ""}.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Patients" value={patientCount} />
        <Stat label="Records written" value={recordCount} />
        <Stat label="Prescriptions issued" value={prescriptionCount} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Quick actions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/doctor/patients"
                className="text-brand hover:text-brand-dark"
              >
                Find a patient →
              </Link>
            </li>
            <li className="text-gray-600">
              Open a patient to write a record or issue a prescription.
            </li>
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Recent records</h2>
          {recentRecords.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No records yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {recentRecords.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/doctor/patients/${r.patientId}`}
                      className="font-medium text-brand-dark hover:text-brand"
                    >
                      {r.patient.user.name}
                    </Link>
                    <span className="ml-2 text-gray-600">{r.diagnosis}</span>
                  </div>
                  <time className="text-xs text-gray-500">
                    {new Date(r.visitDate).toLocaleDateString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-brand-dark">{value}</p>
    </div>
  );
}
