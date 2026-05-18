/**
 * Seed script for Medical-app.
 *
 * Creates a small set of users (one of each role), some clinical data, and a
 * handful of prescriptions in various states so every flow has something to
 * click through.
 *
 * Run with:
 *     npx prisma db seed
 *
 * All seeded accounts share the same password: "Password123!"
 * (DO NOT use this script outside of local development.)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PASSWORD = "Password123!";

async function ensureUser(opts: {
  email: string;
  name: string;
  role: "PATIENT" | "DOCTOR" | "PHARMACIST" | "ADMIN";
  passwordHash: string;
}) {
  return prisma.user.upsert({
    where: { email: opts.email },
    update: { name: opts.name, role: opts.role },
    create: {
      email: opts.email,
      name: opts.name,
      role: opts.role,
      passwordHash: opts.passwordHash,
    },
  });
}

async function main() {
  console.log("Seeding Medical-app…");

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // --- Clinic --------------------------------------------------------------
  const clinic = await prisma.clinic.upsert({
    where: { id: "seed-clinic-westside" },
    update: {},
    create: {
      id: "seed-clinic-westside",
      name: "Westside Family Clinic",
      address: "123 Oak Street",
      phone: "+1-555-0100",
    },
  });

  // --- Doctors -------------------------------------------------------------
  const drAdamsUser = await ensureUser({
    email: "dr.adams@example.com",
    name: "Alice Adams",
    role: "DOCTOR",
    passwordHash,
  });
  const drAdams = await prisma.doctor.upsert({
    where: { userId: drAdamsUser.id },
    update: {
      specialty: "General practice",
      licenseNumber: "DOC-1001",
      clinicId: clinic.id,
    },
    create: {
      userId: drAdamsUser.id,
      specialty: "General practice",
      licenseNumber: "DOC-1001",
      clinicId: clinic.id,
    },
  });

  const drBakerUser = await ensureUser({
    email: "dr.baker@example.com",
    name: "Ben Baker",
    role: "DOCTOR",
    passwordHash,
  });
  const drBaker = await prisma.doctor.upsert({
    where: { userId: drBakerUser.id },
    update: {
      specialty: "Cardiology",
      licenseNumber: "DOC-1002",
      clinicId: clinic.id,
    },
    create: {
      userId: drBakerUser.id,
      specialty: "Cardiology",
      licenseNumber: "DOC-1002",
      clinicId: clinic.id,
    },
  });

  // --- Pharmacists ---------------------------------------------------------
  const pharmCarrUser = await ensureUser({
    email: "pharm.carr@example.com",
    name: "Casey Carr",
    role: "PHARMACIST",
    passwordHash,
  });
  const pharmCarr = await prisma.pharmacist.upsert({
    where: { userId: pharmCarrUser.id },
    update: {
      pharmacyName: "Westside Pharmacy",
      licenseNumber: "PHARM-2001",
    },
    create: {
      userId: pharmCarrUser.id,
      pharmacyName: "Westside Pharmacy",
      licenseNumber: "PHARM-2001",
    },
  });

  // --- Patients ------------------------------------------------------------
  const patAlexUser = await ensureUser({
    email: "alex.patient@example.com",
    name: "Alex Rivera",
    role: "PATIENT",
    passwordHash,
  });
  const patAlex = await prisma.patient.upsert({
    where: { userId: patAlexUser.id },
    update: {
      dateOfBirth: new Date("1990-04-12"),
      gender: "Non-binary",
      bloodType: "O+",
      allergies: "Penicillin",
    },
    create: {
      userId: patAlexUser.id,
      dateOfBirth: new Date("1990-04-12"),
      gender: "Non-binary",
      bloodType: "O+",
      allergies: "Penicillin",
    },
  });

  const patBlairUser = await ensureUser({
    email: "blair.patient@example.com",
    name: "Blair Johnson",
    role: "PATIENT",
    passwordHash,
  });
  const patBlair = await prisma.patient.upsert({
    where: { userId: patBlairUser.id },
    update: {
      dateOfBirth: new Date("1982-11-23"),
      gender: "Female",
      bloodType: "A-",
      allergies: null,
    },
    create: {
      userId: patBlairUser.id,
      dateOfBirth: new Date("1982-11-23"),
      gender: "Female",
      bloodType: "A-",
    },
  });

  const patCharlieUser = await ensureUser({
    email: "charlie.patient@example.com",
    name: "Charlie Singh",
    role: "PATIENT",
    passwordHash,
  });
  const patCharlie = await prisma.patient.upsert({
    where: { userId: patCharlieUser.id },
    update: { dateOfBirth: new Date("2001-07-30"), gender: "Male" },
    create: {
      userId: patCharlieUser.id,
      dateOfBirth: new Date("2001-07-30"),
      gender: "Male",
    },
  });

  // --- Records & prescriptions --------------------------------------------
  // Wipe seeded clinical data so the script is idempotent without leaving
  // stale records around. Scope to seeded patients only.
  const seededPatientIds = [patAlex.id, patBlair.id, patCharlie.id];
  await prisma.prescription.deleteMany({
    where: { patientId: { in: seededPatientIds } },
  });
  await prisma.medicalRecord.deleteMany({
    where: { patientId: { in: seededPatientIds } },
  });

  // Alex: a strep throat visit with a dispensed antibiotic (3 weeks ago).
  const alexStrepRecord = await prisma.medicalRecord.create({
    data: {
      patientId: patAlex.id,
      doctorId: drAdams.id,
      visitDate: daysAgo(21),
      diagnosis: "Streptococcal pharyngitis",
      notes:
        "Painful sore throat, fever 38.5C. Rapid strep positive. Started antibiotics; advised hydration and rest.",
      prescriptions: {
        create: {
          patientId: patAlex.id,
          doctorId: drAdams.id,
          medication: "Amoxicillin",
          dosage: "500 mg",
          frequency: "3x daily",
          duration: "10 days",
          instructions: "Take with food. Complete the full course.",
          status: "DISPENSED",
          issuedAt: daysAgo(21),
          dispensedAt: daysAgo(20),
          dispensedById: pharmCarr.id,
        },
      },
    },
  });

  // Alex: follow-up hypertension visit (3 days ago) -> prescription pending.
  await prisma.medicalRecord.create({
    data: {
      patientId: patAlex.id,
      doctorId: drBaker.id,
      visitDate: daysAgo(3),
      diagnosis: "Stage 1 hypertension",
      notes:
        "BP 142/92 over multiple readings. Discussed lifestyle changes; starting low-dose ACE inhibitor.",
      prescriptions: {
        create: {
          patientId: patAlex.id,
          doctorId: drBaker.id,
          medication: "Lisinopril",
          dosage: "10 mg",
          frequency: "Once daily",
          duration: "30 days",
          instructions: "Take in the morning. Monitor BP weekly.",
          status: "PENDING",
          issuedAt: daysAgo(3),
        },
      },
    },
  });

  // Blair: seasonal allergies (1 week ago) — pending Rx.
  await prisma.medicalRecord.create({
    data: {
      patientId: patBlair.id,
      doctorId: drAdams.id,
      visitDate: daysAgo(7),
      diagnosis: "Allergic rhinitis",
      notes: "Seasonal symptoms. OTC options ineffective; prescribing nasal steroid.",
      prescriptions: {
        create: {
          patientId: patBlair.id,
          doctorId: drAdams.id,
          medication: "Fluticasone nasal spray",
          dosage: "50 mcg/spray",
          frequency: "2 sprays each nostril daily",
          duration: "30 days",
          status: "PENDING",
          issuedAt: daysAgo(7),
        },
      },
    },
  });

  // Charlie: skin infection — Rx was cancelled (e.g. cleared on its own).
  await prisma.medicalRecord.create({
    data: {
      patientId: patCharlie.id,
      doctorId: drAdams.id,
      visitDate: daysAgo(14),
      diagnosis: "Mild contact dermatitis",
      notes: "Localized rash on forearm. Initially considered topical steroid, ultimately not needed.",
      prescriptions: {
        create: {
          patientId: patCharlie.id,
          doctorId: drAdams.id,
          medication: "Hydrocortisone 1% cream",
          dosage: "Apply thin layer",
          frequency: "Twice daily",
          duration: "7 days",
          instructions: "Stop if irritation worsens.",
          status: "CANCELLED",
          issuedAt: daysAgo(14),
        },
      },
    },
  });

  // A standalone follow-up Rx for Alex (no record), still pending — to demo
  // the "standalone" prescription path on the doctor flow.
  await prisma.prescription.create({
    data: {
      patientId: patAlex.id,
      doctorId: drAdams.id,
      medication: "Ibuprofen",
      dosage: "400 mg",
      frequency: "As needed, up to 3x daily",
      duration: "5 days",
      instructions: "For headache; take with food.",
      status: "PENDING",
      issuedAt: daysAgo(1),
    },
  });

  // Use alexStrepRecord so TS doesn't flag the unused binding.
  void alexStrepRecord;

  console.log(`
Seed complete. Sign in with any of these (password: ${SEED_PASSWORD}):

  Doctors:
    dr.adams@example.com   (General practice)
    dr.baker@example.com   (Cardiology)

  Pharmacist:
    pharm.carr@example.com (Westside Pharmacy)

  Patients:
    alex.patient@example.com
    blair.patient@example.com
    charlie.patient@example.com
`);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
