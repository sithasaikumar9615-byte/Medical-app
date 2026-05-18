import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireDoctorPage } from "@/lib/server-auth";
import NewRecordForm from "./NewRecordForm";
import NewPrescriptionForm from "./NewPrescriptionForm";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { doctor } = await requireDoctorPage();

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!patient) notFound();

  const [records, prescriptions] = await Promise.all([
    prisma.medicalRecord.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        prescriptions: { select: { id: true, medication: true, status: true } },
      },
      orderBy: { visitDate: "desc" },
    }),
    prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { doctor: { include: { user: { select: { name: true } } } } },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  // Records authored by THIS doctor — eligible to attach a new prescription to.
  const myRecords = records.filter((r) => r.doctorId === doctor.id);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <Link
            href="/doctor/patients"
            className="text-sm text-gray-500 hover:text-brand"
          >
            ← Back to patients
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-brand-dark">
            {patient.user.name}
          </h1>
          <p className="text-sm text-gray-600">{patient.user.email}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-right text-sm">
          <dt className="text-gray-500">DOB</dt>
          <dd>
            {patient.dateOfBirth
              ? new Date(patient.dateOfBirth).toLocaleDateString()
              : "—"}
          </dd>
          <dt className="text-gray-500">Gender</dt>
          <dd>{patient.gender ?? "—"}</dd>
          <dt className="text-gray-500">Blood type</dt>
          <dd>{patient.bloodType ?? "—"}</dd>
          <dt className="text-gray-500">Allergies</dt>
          <dd>{patient.allergies ?? "—"}</dd>
        </dl>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">New medical record</h2>
          <NewRecordForm patientId={patient.id} />
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Issue prescription</h2>
          <NewPrescriptionForm
            patientId={patient.id}
            myRecords={myRecords.map((r) => ({
              id: r.id,
              diagnosis: r.diagnosis,
              visitDate: r.visitDate.toISOString(),
            }))}
          />
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Medical records</h2>
        {records.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No records yet.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {records.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.diagnosis}</span>
                  <time className="text-xs text-gray-500">
                    {new Date(r.visitDate).toLocaleDateString()} · Dr.{" "}
                    {r.doctor.user.name}
                  </time>
                </div>
                {r.notes && (
                  <p className="mt-1 whitespace-pre-line text-gray-600">
                    {r.notes}
                  </p>
                )}
                {r.prescriptions.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {r.prescriptions.length} prescription
                    {r.prescriptions.length === 1 ? "" : "s"} attached
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Prescriptions</h2>
        {prescriptions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No prescriptions yet.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {prescriptions.map((p) => (
              <li key={p.id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {p.medication}{" "}
                    <span className="font-normal text-gray-600">
                      — {p.dosage}, {p.frequency}
                      {p.duration ? `, ${p.duration}` : ""}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.status === "DISPENSED"
                        ? "bg-green-100 text-green-700"
                        : p.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.status.toLowerCase()}
                  </span>
                </div>
                {p.instructions && (
                  <p className="mt-1 text-gray-600">{p.instructions}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Issued {new Date(p.issuedAt).toLocaleDateString()} by Dr.{" "}
                  {p.doctor.user.name}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
