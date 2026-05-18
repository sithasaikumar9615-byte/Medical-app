import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePatientApi } from "@/lib/server-auth";

/**
 * GET /api/patient/records
 * Returns the current patient's medical records (from all doctors).
 */
export async function GET() {
  const auth = await requirePatientApi();
  if (!auth.ok) return auth.res;

  const records = await prisma.medicalRecord.findMany({
    where: { patientId: auth.patient.id },
    include: {
      doctor: {
        include: { user: { select: { name: true, email: true } } },
      },
      prescriptions: {
        select: {
          id: true,
          medication: true,
          dosage: true,
          status: true,
        },
      },
    },
    orderBy: { visitDate: "desc" },
  });

  return NextResponse.json({ records });
}
