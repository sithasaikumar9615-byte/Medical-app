"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  initial,
}: {
  initial: {
    dateOfBirth: string | null;
    gender: string | null;
    bloodType: string | null;
    allergies: string | null;
  };
}) {
  const router = useRouter();
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth ?? "");
  const [gender, setGender] = useState(initial.gender ?? "");
  const [bloodType, setBloodType] = useState(initial.bloodType ?? "");
  const [allergies, setAllergies] = useState(initial.allergies ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const res = await fetch("/api/patient/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        bloodType: bloodType || null,
        allergies: allergies || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update profile");
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-sm">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-700">
          Profile saved.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium text-gray-700">
            Date of birth
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block font-medium text-gray-700">Gender</label>
          <input
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            placeholder="e.g. Female"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div>
        <label className="block font-medium text-gray-700">Blood type</label>
        <select
          value={bloodType}
          onChange={(e) => setBloodType(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="">— Unknown —</option>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium text-gray-700">Allergies</label>
        <textarea
          rows={3}
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="e.g. Penicillin, peanuts"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand px-4 py-2 text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
