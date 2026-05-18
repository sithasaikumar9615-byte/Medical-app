import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePharmacistApi } from "@/lib/server-auth";

/**
 * GET /api/pharmacist/prescriptions?status=PENDING|DISPENSED|CANCELLED&q=<patient>
 * Defaults to PENDING (the queue). With ?status=DISPENSED&mine=1, restricts to
 * prescriptions dispensed by the current pharmacist.
 */
export async function GET(req: Request) {
  const auth = await requirePharmacistApi();
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") ?? "PENDING";
  const q = (url.searchParams.get("q") ?? "").trim();
  const mine = url.searchParams.get("mine") === "1";

  const validStatuses = ["PENDING", "DISPENSED", "CANCELLED"] as const;
  const status = (validStatuses as readonly string[]).includes(statusParam)
    ? (statusParam as (typeof validStatuses)[number])
    : "PENDING";

  const where: Prisma.PrescriptionWhereInput = {
    status,
    ...(mine && status === "DISPENSED" && { dispensedById: auth.pharmacist.id }),
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
    orderBy: status === "PENDING" ? { issuedAt: "asc" } : { issuedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ prescriptions });
}
