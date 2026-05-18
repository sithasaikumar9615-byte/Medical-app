import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, dashboardPathForRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PostLoginPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  redirect(dashboardPathForRole(session.user.role));
}
