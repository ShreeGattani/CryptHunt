import { getAuthenticatedUser, checkIsLocked } from "@/lib/server/auth";
import { redirect } from "next/navigation";

export default async function LevelRootLayout({
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

  return <>{children}</>;
}
