"use client";

import { useEffect } from "react";

export function AuthThemeFix() {
  useEffect(() => {
    // Auth pages always render in light mode for a clean, consistent look.
    // The dashboard Header re-applies the user's stored theme after login.
    document.documentElement.classList.remove("dark");
  }, []);
  return null;
}
