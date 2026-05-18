import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleApi } from "@/lib/server-auth";

/**
 * GET /api/patients?q=<search>
 * Returns patients matching the query (by user name or email). Limited to 20.
 * Available to any clinical role (DOCTOR, PHARMACIST).
 */
export async function GET(req: Request) {
  const auth = await requireRoleApi(["DOCTOR", "PHARMACIST", "ADMIN"]);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  const patients = await prisma.patient.findMany({
    where: q
      ? {
          user: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : undefined,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { user: { name: "asc" } },
    take: 20,
  });

  return NextResponse.json({
    patients: patients.map((p) => ({
      id: p.id,
      name: p.user.name,
      email: p.user.email,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      bloodType: p.bloodType,
      allergies: p.allergies,
    })),
  });
}
