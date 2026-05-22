"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type RecordOption = {
  id: string;
  diagnosis: string;
  visitDate: string;
};

export default function NewPrescriptionForm({
  patientId,
  myRecords,
}: {
  patientId: string;
  myRecords: RecordOption[];
}) {
  const router = useRouter();
  const [recordId, setRecordId] = useState<string>("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/doctor/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        recordId: recordId || undefined,
        medication,
        dosage,
        frequency,
        duration: duration || undefined,
        instructions: instructions || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to issue prescription");
      return;
    }
    setMedication("");
    setDosage("");
    setFrequency("");
    setDuration("");
    setInstructions("");
    setRecordId("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 text-sm">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-red-700">
          {error}
        </div>
      )}

      {myRecords.length > 0 && (
        <div>
          <label className="block font-medium text-gray-700">
            Attach to record (optional)
          </label>
          <select
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="">— Standalone —</option>
            {myRecords.map((r) => (
              <option key={r.id} value={r.id}>
                {new Date(r.visitDate).toLocaleDateString()} · {r.diagnosis}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block font-medium text-gray-700">Medication</label>
        <input
          required
          value={medication}
          onChange={(e) => setMedication(e.target.value)}
          placeholder="e.g. Amoxicillin"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-medium text-gray-700">Dosage</label>
          <input
            required
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 500 mg"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block font-medium text-gray-700">Frequency</label>
          <input
            required
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="e.g. 3x daily"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div>
        <label className="block font-medium text-gray-700">Duration</label>
        <input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g. 7 days"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      <div>
        <label className="block font-medium text-gray-700">Instructions</label>
        <textarea
          rows={2}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Take with food"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand px-4 py-2 text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? "Issuing…" : "Issue prescription"}
      </button>
    </form>
  );
}
