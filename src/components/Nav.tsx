import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, dashboardPathForRole } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function Nav() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-brand-dark">
          Medical-app
        </Link>
        <div className="flex items-center gap-6 text-sm">
          {session?.user ? (
            <>
              <Link
                href={dashboardPathForRole(session.user.role)}
                className="hover:text-brand"
              >
                Dashboard
              </Link>
              <span className="text-gray-600">
                {session.user.name}{" "}
                <span className="text-xs text-gray-400">
                  ({session.user.role.toLowerCase()})
                </span>
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-brand">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
