"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QueueRow({
  id,
  patientName,
  patientEmail,
  doctorName,
  medication,
  dosage,
  frequency,
  duration,
  instructions,
  issuedAt,
}: {
  id: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  instructions: string | null;
  issuedAt: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"dispense" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(kind: "dispense" | "cancel") {
    if (kind === "cancel") {
      const ok = window.confirm(`Cancel prescription for ${patientName}?`);
      if (!ok) return;
    }
    setBusy(kind);
    setError(null);
    const res = await fetch(`/api/pharmacist/prescriptions/${id}/${kind}`, {
      method: "POST",
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Action failed");
      return;
    }
    router.refresh();
  }

  return (
    <li className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h3 className="font-medium text-brand-dark">{medication}</h3>
            <p className="text-sm text-gray-700">
              {dosage} · {frequency}
              {duration ? ` · ${duration}` : ""}
            </p>
          </div>
          {instructions && (
            <p className="mt-1 text-sm text-gray-600">{instructions}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Patient: <span className="text-gray-700">{patientName}</span> ·{" "}
            {patientEmail} · Issued{" "}
            {new Date(issuedAt).toLocaleDateString()} by Dr. {doctorName}
          </p>
          {error && (
            <p className="mt-2 text-xs text-red-700">{error}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => act("dispense")}
            disabled={!!busy}
            className="rounded-md bg-brand px-3 py-1.5 text-sm text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {busy === "dispense" ? "Dispensing…" : "Dispense"}
          </button>
          <button
            onClick={() => act("cancel")}
            disabled={!!busy}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:border-red-300 hover:text-red-700 disabled:opacity-60"
          >
            {busy === "cancel" ? "Cancelling…" : "Cancel"}
          </button>
        </div>
      </div>
    </li>
  );
}
