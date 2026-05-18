import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDoctorApi } from "@/lib/server-auth";

const createRecordSchema = z.object({
  patientId: z.string().min(1),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  notes: z.string().optional(),
  visitDate: z.string().datetime().optional(),
});

/**
 * GET /api/doctor/records?patientId=<id>
 * Lists records authored by the current doctor, optionally filtered by patient.
 */
export async function GET(req: Request) {
  const auth = await requireDoctorApi();
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const patientId = url.searchParams.get("patientId") ?? undefined;

  const records = await prisma.medicalRecord.findMany({
    where: { doctorId: auth.doctor.id, ...(patientId && { patientId }) },
    include: {
      patient: { include: { user: { select: { name: true, email: true } } } },
      prescriptions: { select: { id: true, medication: true, status: true } },
    },
    orderBy: { visitDate: "desc" },
    take: 100,
  });

  return NextResponse.json({ records });
}

/**
 * POST /api/doctor/records
 * Body: { patientId, diagnosis, notes?, visitDate? }
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

  const parsed = createRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { patientId, diagnosis, notes, visitDate } = parsed.data;

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const record = await prisma.medicalRecord.create({
    data: {
      patientId,
      doctorId: auth.doctor.id,
      diagnosis,
      notes,
      ...(visitDate && { visitDate: new Date(visitDate) }),
    },
  });

  return NextResponse.json({ record }, { status: 201 });
}
