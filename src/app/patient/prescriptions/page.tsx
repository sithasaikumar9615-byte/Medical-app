import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePatientPage } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "DISPENSED", label: "Dispensed" },
  { key: "CANCELLED", label: "Cancelled" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default async function PatientPrescriptionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { patient } = await requirePatientPage();

  const requested = (searchParams.status ?? "all") as FilterKey;
  const active: FilterKey = FILTERS.some((f) => f.key === requested)
    ? requested
    : "all";

  const where: Prisma.PrescriptionWhereInput = {
    patientId: patient.id,
    ...(active !== "all" && { status: active }),
  };

  const prescriptions = await prisma.prescription.findMany({
    where,
    include: {
      doctor: { include: { user: { select: { name: true } } } },
      record: { select: { id: true, diagnosis: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/patient/dashboard"
          className="text-sm text-gray-500 hover:text-brand"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-brand-dark">
          Prescriptions
        </h1>
        <p className="text-sm text-gray-600">
          All prescriptions issued to you, with their dispense status.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => {
          const isActive = active === f.key;
          const href =
            f.key === "all"
              ? "/patient/prescriptions"
              : `/patient/prescriptions?status=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`rounded-full border px-3 py-1 transition ${
                isActive
                  ? "border-brand bg-brand text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-brand hover:text-brand"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {prescriptions.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
          No prescriptions match this filter.
        </div>
      ) : (
        <ul className="space-y-3">
          {prescriptions.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium text-brand-dark">
                    {p.medication}
                  </h2>
                  <p className="text-sm text-gray-700">
                    {p.dosage} · {p.frequency}
                    {p.duration ? ` · ${p.duration}` : ""}
                  </p>
                  {p.instructions && (
                    <p className="mt-1 text-sm text-gray-600">
                      {p.instructions}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Issued {new Date(p.issuedAt).toLocaleDateString()} by Dr.{" "}
                    {p.doctor.user.name}
                    {p.dispensedAt && (
                      <>
                        {" · "}Dispensed{" "}
                        {new Date(p.dispensedAt).toLocaleDateString()}
                      </>
                    )}
                    {p.record && (
                      <>
                        {" · "}For visit:{" "}
                        <span className="text-gray-600">
                          {p.record.diagnosis}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
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
