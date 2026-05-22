import Link from "next/link";
import { requirePatientPage } from "@/lib/server-auth";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function PatientProfilePage() {
  const { session, patient } = await requirePatientPage();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <Link
          href="/patient/dashboard"
          className="text-sm text-gray-500 hover:text-brand"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-brand-dark">
          My profile
        </h1>
        <p className="text-sm text-gray-600">
          Keep your demographic and clinical info up to date so doctors can
          treat you safely.
        </p>
      </header>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-800">{session.user.name}</span>{" "}
          · {session.user.email}
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <ProfileForm
          initial={{
            dateOfBirth: patient.dateOfBirth
              ? patient.dateOfBirth.toISOString().slice(0, 10)
              : null,
            gender: patient.gender,
            bloodType: patient.bloodType,
            allergies: patient.allergies,
          }}
        />
      </div>
    </div>
  );
}
