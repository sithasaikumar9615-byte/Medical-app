import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePharmacistPage } from "@/lib/server-auth";
import QueueRow from "./QueueRow";

export const dynamic = "force-dynamic";

export default async function PharmacistQueuePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requirePharmacistPage();
  const q = (searchParams.q ?? "").trim();

  const where: Prisma.PrescriptionWhereInput = {
    status: "PENDING",
    ...(q && {
      patient: {
        user: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    }),
  };

  const prescriptions = await prisma.prescription.findMany({
    where,
    include: {
      patient: { include: { user: { select: { name: true, email: true } } } },
      doctor: { include: { user: { select: { name: true } } } },
    },
    orderBy: { issuedAt: "asc" }, // oldest first
    take: 100,
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
          Dispense queue
        </h1>
        <p className="text-sm text-gray-600">
          Pending prescriptions, oldest first.
        </p>
      </header>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Filter by patient name or email…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm text-white transition hover:bg-brand-dark"
        >
          Filter
        </button>
        {q && (
          <Link
            href="/pharmacist/queue"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-brand hover:text-brand"
          >
            Clear
          </Link>
        )}
      </form>

      {prescriptions.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
          {q
            ? "No pending prescriptions match your filter."
            : "Queue is empty — nothing to dispense right now."}
        </div>
      ) : (
        <ul className="space-y-3">
          {prescriptions.map((p) => (
            <QueueRow
              key={p.id}
              id={p.id}
              patientName={p.patient.user.name}
              patientEmail={p.patient.user.email}
              doctorName={p.doctor.user.name}
              medication={p.medication}
              dosage={p.dosage}
              frequency={p.frequency}
              duration={p.duration}
              instructions={p.instructions}
              issuedAt={p.issuedAt.toISOString()}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
