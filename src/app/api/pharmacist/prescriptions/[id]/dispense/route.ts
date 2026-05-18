import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacistApi } from "@/lib/server-auth";

/**
 * POST /api/pharmacist/prescriptions/[id]/dispense
 * Marks a PENDING prescription as DISPENSED by the current pharmacist.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requirePharmacistApi();
  if (!auth.ok) return auth.res;

  const prescription = await prisma.prescription.findUnique({
    where: { id: params.id },
  });
  if (!prescription) {
    return NextResponse.json(
      { error: "Prescription not found" },
      { status: 404 }
    );
  }
  if (prescription.status !== "PENDING") {
    return NextResponse.json(
      { error: `Cannot dispense a ${prescription.status.toLowerCase()} prescription` },
      { status: 409 }
    );
  }

  const updated = await prisma.prescription.update({
    where: { id: prescription.id },
    data: {
      status: "DISPENSED",
      dispensedAt: new Date(),
      dispensedById: auth.pharmacist.id,
    },
  });

  return NextResponse.json({ prescription: updated });
}
