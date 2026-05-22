"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRecordForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/doctor/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, diagnosis, notes: notes || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save record");
      return;
    }
    setDiagnosis("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 text-sm">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-red-700">
          {error}
        </div>
      )}
      <div>
        <label className="block font-medium text-gray-700">Diagnosis</label>
        <input
          required
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label className="block font-medium text-gray-700">Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand px-4 py-2 text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save record"}
      </button>
    </form>
  );
}
