import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDoctorApi } from "@/lib/server-auth";

const createPrescriptionSchema = z.object({
  patientId: z.string().min(1),
  recordId: z.string().min(1).optional(),
  medication: z.string().min(1, "Medication is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().optional(),
  instructions: z.string().optional(),
});

/**
 * GET /api/doctor/prescriptions?patientId=<id>
 * Lists prescriptions issued by the current doctor.
 */
export async function GET(req: Request) {
  const auth = await requireDoctorApi();
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const patientId = url.searchParams.get("patientId") ?? undefined;

  const prescriptions = await prisma.prescription.findMany({
    where: { doctorId: auth.doctor.id, ...(patientId && { patientId }) },
    include: {
      patient: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ prescriptions });
}

/**
 * POST /api/doctor/prescriptions
 * Body: { patientId, recordId?, medication, dosage, frequency, duration?, instructions? }
 */
export async function POST(req: Request) {
  const auth = await requireDoctorApi();
  if (!auth.ok) return auth.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createPrescriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  // If a recordId is provided, verify it belongs to this doctor and this patient.
  if (data.recordId) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: data.recordId },
    });
    if (
      !record ||
      record.doctorId !== auth.doctor.id ||
      record.patientId !== data.patientId
    ) {
      return NextResponse.json(
        { error: "Invalid record for this patient" },
        { status: 400 }
      );
    }
  }

  const prescription = await prisma.prescription.create({
    data: {
      patientId: data.patientId,
      doctorId: auth.doctor.id,
      recordId: data.recordId,
      medication: data.medication,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration,
      instructions: data.instructions,
    },
  });

  return NextResponse.json({ prescription }, { status: 201 });
}
