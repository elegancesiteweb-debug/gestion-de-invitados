import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Elegance Site" className="h-20 w-20" />
      <p className="mt-2 text-sm font-medium text-ink">Elegance Site</p>
      <p className="mt-6 text-xs uppercase tracking-[0.25em] text-gold-dark">
        Organización de eventos
      </p>
      <h1 className="mt-2 max-w-2xl font-serif text-4xl font-medium text-ink sm:text-5xl">
        Organiza tu evento y gestiona a tus invitados
      </h1>
      <p className="mt-4 max-w-xl text-ink-muted">
        Crea tu evento, agrega a tus invitados y comparte un link (o QR) de confirmación de
        asistencia para pegar en la invitación que ya diseñaste. Lleva el control de quién
        confirmó, en tiempo real.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/register"
          className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-gold/30 transition hover:shadow-lg hover:shadow-gold/40"
        >
          Crear cuenta gratis
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-gold/30 bg-white/60 px-6 py-2.5 text-sm font-medium text-ink backdrop-blur transition hover:bg-white/90"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
