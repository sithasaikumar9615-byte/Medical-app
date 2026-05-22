import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePatientApi } from "@/lib/server-auth";

const updateProfileSchema = z.object({
  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || !Number.isNaN(Date.parse(v)),
      "Invalid date of birth"
    ),
  gender: z.string().max(40).optional().nullable(),
  bloodType: z.string().max(8).optional().nullable(),
  allergies: z.string().max(1000).optional().nullable(),
});

/**
 * GET /api/patient/profile  — read own demographic info.
 */
export async function GET() {
  const auth = await requirePatientApi();
  if (!auth.ok) return auth.res;

  return NextResponse.json({
    profile: {
      dateOfBirth: auth.patient.dateOfBirth,
      gender: auth.patient.gender,
      bloodType: auth.patient.bloodType,
      allergies: auth.patient.allergies,
    },
  });
}

/**
 * PATCH /api/patient/profile  — update own demographic info.
 */
export async function PATCH(req: Request) {
  const auth = await requirePatientApi();
  if (!auth.ok) return auth.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updated = await prisma.patient.update({
    where: { id: auth.patient.id },
    data: {
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender ?? null,
      bloodType: data.bloodType ?? null,
      allergies: data.allergies ?? null,
    },
    select: {
      dateOfBirth: true,
      gender: true,
      bloodType: true,
      allergies: true,
    },
  });

  return NextResponse.json({ profile: updated });
}
