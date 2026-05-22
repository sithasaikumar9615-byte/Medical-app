import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePatientApi } from "@/lib/server-auth";

/**
 * GET /api/patient/prescriptions?status=PENDING|DISPENSED|CANCELLED
 * Returns the current patient's prescriptions, optionally filtered by status.
 */
export async function GET(req: Request) {
  const auth = await requirePatientApi();
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const validStatuses = ["PENDING", "DISPENSED", "CANCELLED"] as const;
  const filter =
    status && (validStatuses as readonly string[]).includes(status)
      ? (status as (typeof validStatuses)[number])
      : undefined;

  const where: Prisma.PrescriptionWhereInput = {
    patientId: auth.patient.id,
    ...(filter && { status: filter }),
  };

  const prescriptions = await prisma.prescription.findMany({
    where,
    include: {
      doctor: { include: { user: { select: { name: true } } } },
      record: { select: { id: true, diagnosis: true, visitDate: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json({ prescriptions });
}
