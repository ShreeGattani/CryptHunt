"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../context/GameContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DynamicLevelRedirectPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { state } = useGame();

  useEffect(() => {
    if (!state.isLoggedIn) {
      router.replace("/");
      return;
    }

    const levelId = parseInt(resolvedParams.id, 10);
    
    if (isNaN(levelId)) {
      router.replace("/dashboard");
      return;
    }

    switch (levelId) {
      case 1:
        router.replace("/level/slenderman");
        break;
      case 2:
        router.replace("/level/eyelessjack");
        break;
      case 3:
        router.replace("/level/ben");
        break;
      case 4:
        router.replace("/level/puppeteer");
        break;
      case 5:
        router.replace("/level/candlecove");
        break;
      default:
        router.replace("/dashboard");
        break;
    }
  }, [resolvedParams.id, state.isLoggedIn, router]);

  return null;
}
