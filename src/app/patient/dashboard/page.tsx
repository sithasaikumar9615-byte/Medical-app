export default function PatientDashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-dark">
          Patient Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          View your medical history and active prescriptions.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Medical Records</h2>
          <p className="mt-2 text-sm text-gray-600">
            Past visits, diagnoses, and clinical notes. (Stub)
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Prescriptions</h2>
          <p className="mt-2 text-sm text-gray-600">
            Active and historical prescriptions and their status. (Stub)
          </p>
        </div>
      </section>
    </div>
  );
}
