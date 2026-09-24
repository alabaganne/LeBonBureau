"use client";

/* Note l'origine du visiteur et signale chaque changement de page au pixel Meta.
   Les scripts eux-mêmes sont posés dans app/layout.tsx. */

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { captureSource, pixel } from "@/lib/track";

export default function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    captureSource();
  }, []);

  // La première page est déjà comptée par le script du pixel.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    pixel("PageView");
  }, [pathname]);

  return null;
}
