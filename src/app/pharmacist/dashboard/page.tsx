import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PharmacistDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-dark">
          Pharmacist Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Signed in as <span className="font-medium">{session?.user.name}</span>.
          Review pending prescriptions and mark them dispensed.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Pending Prescriptions</h2>
          <p className="mt-2 text-sm text-gray-600">
            Prescriptions awaiting dispense. (Coming soon)
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Dispense History</h2>
          <p className="mt-2 text-sm text-gray-600">
            Recently dispensed prescriptions. (Coming soon)
          </p>
        </div>
      </section>
    </div>
  );
}
