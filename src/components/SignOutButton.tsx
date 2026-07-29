"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-ink-muted hover:text-ink"
    >
      Cerrar sesión
    </button>
  );
}
