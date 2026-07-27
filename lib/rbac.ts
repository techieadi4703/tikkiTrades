import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type UserRole = "Admin" | "Premium User" | "User";

export const requireRole = async (allowedRoles: UserRole[]) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // better-auth user object might have custom fields untyped, cast it safely
  const userRole = (session.user as any).role || "User";

  if (!allowedRoles.includes(userRole)) {
    redirect("/unauthorized"); // or return false if you prefer error throwing
  }

  return session.user;
};
