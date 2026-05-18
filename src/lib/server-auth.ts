import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Doctor, Pharmacist, Patient, User } from "@prisma/client";

/**
 * For pages: require a logged-in user with one of the given roles.
 * Redirects to /login if anonymous, or /post-login if wrong role.
 */
export async function requireSession(
  roles?: Array<User["role"]>
): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (roles && !roles.includes(session.user.role)) redirect("/post-login");
  return session;
}

/**
 * For pages: require the current user to be a DOCTOR and return their Doctor row.
 */
export async function requireDoctorPage(): Promise<{
  session: Session;
  doctor: Doctor;
}> {
  const session = await requireSession(["DOCTOR"]);
  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });
  if (!doctor) redirect("/post-login");
  return { session, doctor };
}

/**
 * For pages: require the current user to be a PATIENT and return their Patient row.
 */
export async function requirePatientPage(): Promise<{
  session: Session;
  patient: Patient;
}> {
  const session = await requireSession(["PATIENT"]);
  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
  });
  if (!patient) redirect("/post-login");
  return { session, patient };
}

/**
 * For API routes: require a logged-in PATIENT. Returns the Patient row, or an error response.
 */
export async function requirePatientApi(): Promise<
  { ok: true; patient: Patient; userId: string } | { ok: false; res: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.user.role !== "PATIENT") {
    return {
      ok: false,
      res: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
  });
  if (!patient) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "Patient profile missing" },
        { status: 404 }
      ),
    };
  }
  return { ok: true, patient, userId: session.user.id };
}

/**
 * For API routes: require a logged-in DOCTOR. Returns either the Doctor row,
 * or a NextResponse error to be returned by the handler.
 */
export async function requireDoctorApi(): Promise<
  { ok: true; doctor: Doctor; userId: string } | { ok: false; res: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.user.role !== "DOCTOR") {
    return {
      ok: false,
      res: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });
  if (!doctor) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "Doctor profile missing" },
        { status: 404 }
      ),
    };
  }
  return { ok: true, doctor, userId: session.user.id };
}

/**
 * For API routes: require a logged-in user with any of the given roles.
 */
export async function requireRoleApi(roles: Array<User["role"]>): Promise<
  | { ok: true; userId: string; role: User["role"] }
  | { ok: false; res: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!roles.includes(session.user.role)) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, userId: session.user.id, role: session.user.role };
}

export type { Doctor, Pharmacist, Patient, User };
