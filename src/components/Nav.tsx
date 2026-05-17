import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-brand-dark">
          Medical-app
        </Link>
        <div className="flex gap-6 text-sm">
          <Link href="/patient/dashboard" className="hover:text-brand">
            Patient
          </Link>
          <Link href="/doctor/dashboard" className="hover:text-brand">
            Doctor
          </Link>
          <Link href="/pharmacist/dashboard" className="hover:text-brand">
            Pharmacist
          </Link>
          <Link href="/login" className="font-medium text-brand hover:text-brand-dark">
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
