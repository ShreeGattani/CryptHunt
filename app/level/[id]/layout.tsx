import { getAuthenticatedUser, checkIsLocked } from "@/lib/server/auth";
import { redirect } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function DynamicLevelLayout({
  children,
  params,
}: LayoutProps) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect("/");
  }

  if (checkIsLocked(user.createdAt)) {
    redirect("/");
  }

  const resolvedParams = await params;
  const levelId = parseInt(resolvedParams.id, 10);

  if (isNaN(levelId) || user.currentLevel !== levelId) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
