export default function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-dark">
          Doctor Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Manage your patients, write medical records, and issue prescriptions.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">My Patients</h2>
          <p className="mt-2 text-sm text-gray-600">
            Patients under your care. (Stub)
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">New Record</h2>
          <p className="mt-2 text-sm text-gray-600">
            Record a visit, diagnosis, and notes. (Stub)
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Issue Prescription</h2>
          <p className="mt-2 text-sm text-gray-600">
            Prescribe medication tied to a record. (Stub)
          </p>
        </div>
      </section>
    </div>
  );
}
