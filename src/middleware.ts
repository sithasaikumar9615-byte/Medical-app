import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const ROLE_PREFIXES: Record<string, string> = {
  "/patient": "PATIENT",
  "/doctor": "DOCTOR",
  "/pharmacist": "PHARMACIST",
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Determine which role prefix this URL belongs to (if any).
    const prefix = Object.keys(ROLE_PREFIXES).find((p) =>
      pathname.startsWith(p)
    );
    if (!prefix) return NextResponse.next();

    const requiredRole = ROLE_PREFIXES[prefix];
    if (token?.role !== requiredRole && token?.role !== "ADMIN") {
      // Wrong role -> send them to their own dashboard (or home).
      const url = req.nextUrl.clone();
      url.pathname = "/post-login";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*", "/pharmacist/:path*"],
};
