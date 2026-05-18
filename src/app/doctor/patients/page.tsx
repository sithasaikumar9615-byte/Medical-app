import { requireDoctorPage } from "@/lib/server-auth";
import PatientSearch from "./PatientSearch";

export const dynamic = "force-dynamic";

export default async function DoctorPatientsPage() {
  await requireDoctorPage();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-dark">Patients</h1>
        <p className="text-sm text-gray-600">
          Search by name or email. Open a patient to view records and write new
          ones.
        </p>
      </header>
      <PatientSearch />
    </div>
  );
}
