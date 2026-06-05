import { getAuthenticatedUser, checkIsLocked } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export default async function BenLayout({
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

  if (user.currentLevel !== 3) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
