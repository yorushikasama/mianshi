import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getUserSession() {
  return auth.api.getSession({
    headers: await headers()
  });
}

export async function requireUserSession() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
