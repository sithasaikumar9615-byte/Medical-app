import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DoctorDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-dark">
          Doctor Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Signed in as <span className="font-medium">Dr. {session?.user.name}</span>.
          Manage your patients, write medical records, and issue prescriptions.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">My Patients</h2>
          <p className="mt-2 text-sm text-gray-600">
            Patients under your care. (Coming soon)
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">New Record</h2>
          <p className="mt-2 text-sm text-gray-600">
            Record a visit, diagnosis, and notes. (Coming soon)
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Issue Prescription</h2>
          <p className="mt-2 text-sm text-gray-600">
            Prescribe medication tied to a record. (Coming soon)
          </p>
        </div>
      </section>
    </div>
  );
}
