"use client";

import { useEffect } from "react";

export function EmbedTransparentBackground() {
  useEffect(() => {
    document.documentElement.classList.add("embed-transparent");
    return () => {
      document.documentElement.classList.remove("embed-transparent");
    };
  }, []);

  return null;
}
