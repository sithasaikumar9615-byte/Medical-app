export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-brand-dark">Sign in</h1>
      <p className="mt-2 text-sm text-gray-600">
        Authentication is wired up via NextAuth (credentials provider). The
        sign-in form will be added in a follow-up commit.
      </p>

      <form className="mt-6 space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            disabled
            className="mt-1 w-full rounded-md border-gray-300 bg-gray-100 px-3 py-2 text-sm"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            disabled
            className="mt-1 w-full rounded-md border-gray-300 bg-gray-100 px-3 py-2 text-sm"
            placeholder="••••••••"
          />
        </div>
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-md bg-brand px-4 py-2 text-white opacity-60"
        >
          Sign in (coming soon)
        </button>
      </form>
    </div>
  );
}
