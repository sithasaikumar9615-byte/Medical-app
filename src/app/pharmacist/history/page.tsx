import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePharmacistPage } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function PharmacistHistoryPage() {
  const { pharmacist } = await requirePharmacistPage();

  const prescriptions = await prisma.prescription.findMany({
    where: { status: "DISPENSED", dispensedById: pharmacist.id },
    include: {
      patient: { include: { user: { select: { name: true, email: true } } } },
      doctor: { include: { user: { select: { name: true } } } },
    },
    orderBy: { dispensedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/pharmacist/dashboard"
          className="text-sm text-gray-500 hover:text-brand"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-brand-dark">
          Dispense history
        </h1>
        <p className="text-sm text-gray-600">
          Prescriptions you have dispensed, most recent first.
        </p>
      </header>

      {prescriptions.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
          You haven&apos;t dispensed any prescriptions yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Dispensed</th>
                <th className="px-4 py-2">Patient</th>
                <th className="px-4 py-2">Medication</th>
                <th className="px-4 py-2">Dose / freq.</th>
                <th className="px-4 py-2">Prescribed by</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2 text-gray-600">
                    {p.dispensedAt
                      ? new Date(p.dispensedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{p.patient.user.name}</div>
                    <div className="text-xs text-gray-500">
                      {p.patient.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium">{p.medication}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {p.dosage} · {p.frequency}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    Dr. {p.doctor.user.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
