"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

export type SidebarLink = { href: string; label: string };

function NavLinks({ links, onNavigate }: { links: SidebarLink[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active = link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              active ? "bg-warm text-gold-dark" : "text-ink-muted hover:bg-warm/60 hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardSidebar({
  links,
  userName,
  teamMemberName,
  isCollaborator,
}: {
  links: SidebarLink[];
  userName: string;
  teamMemberName: string | null;
  isCollaborator: boolean;
}) {
  const [open, setOpen] = useState(false);

  const identityLine = teamMemberName
    ? `${teamMemberName} · ${isCollaborator ? "Colaborador (solo lectura)" : "Admin de equipo"}`
    : userName;

  return (
    <>
      {/* Barra móvil: parte normal del flujo, no flotante, no tapa contenido */}
      <div className="flex items-center justify-between border-b border-gold/20 bg-white/60 px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm font-medium text-ink"
          aria-label="Abrir menú"
        >
          <span aria-hidden>☰</span> Menú
        </button>
        <p className="truncate text-xs text-ink-muted">{identityLine}</p>
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] overflow-y-auto bg-white p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="truncate text-sm font-medium text-ink">{identityLine}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-ink-muted hover:bg-warm"
                  aria-label="Cerrar menú"
                >
                  ×
                </button>
              </div>
              <NavLinks links={links} onNavigate={() => setOpen(false)} />
              <div className="mt-4 border-t border-gold/15 pt-4">
                <SignOutButton />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Barra lateral de escritorio */}
      <aside className="hidden shrink-0 md:block md:w-56">
        <div className="md:sticky md:top-6 md:pl-4 md:pt-10">
          <p className="mb-3 truncate px-3 text-xs text-ink-muted">{identityLine}</p>
          <NavLinks links={links} />
          <div className="mt-4 border-t border-gold/15 px-3 pt-4">
            <SignOutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
