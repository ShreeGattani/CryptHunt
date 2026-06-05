import { getAuthenticatedUser, checkIsLocked } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export default async function EyelessjackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect("/");
  }

  if (checkIsLocked(user.createdAt)) {
    redirect("/");
  }

  if (user.currentLevel !== 2) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
