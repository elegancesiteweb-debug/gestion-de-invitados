import Link from "next/link";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/SocialIcons";

const WHATSAPP_URL =
  "https://wa.me/523311843408?text=%C2%A1Hola%20Elegance%20Site!%20%F0%9F%92%8C%0AMe%20interesa%20conocer%20m%C3%A1s%20sobre%20el%20la%20app%20de%20gesti%C3%B3n%20de%20eventos.";
const FACEBOOK_URL = "https://www.facebook.com/share/1BiWaV8Adg/?mibextid=wwXIfr";
const INSTAGRAM_URL = "https://www.instagram.com/elegancesite.web?igsh=MWN3a2Rnc2Vjejl3eA==";

const PROBLEMS = [
  {
    tag: "Confirmaciones",
    text: "Invitados confirmando por WhatsApp, Excel y llamadas sueltas — nada queda en un solo lugar.",
  },
  {
    tag: "Mesas",
    text: "Armar el acomodo a mano, sin saber en tiempo real quién falta por confirmar.",
  },
  {
    tag: "Ventas",
    text: "Cotizar y dar seguimiento a clientes potenciales sin un sistema real de CRM.",
  },
  {
    tag: "Cobros",
    text: "Cobrar anticipos y pagos sin una forma profesional de facturar.",
  },
  {
    tag: "Proveedores",
    text: "Coordinar proveedores, tareas y fechas repartidos entre cinco aplicaciones distintas.",
  },
];

const PARTICULAR_FEATURES = [
  {
    title: "Invitados y confirmaciones",
    text: "Liga y QR personalizado por invitado, check-in de acceso el día del evento, etiquetas (VIP, con niños, familia) y búsqueda instantánea.",
  },
  {
    title: "Mesas y plano del salón",
    text: "Acomodo visual arrastrando invitados con conteo automático, una vista simple alternativa, y un editor de plano con formas movibles y redimensionables.",
  },
  {
    title: "Organización del día",
    text: "Checklist con calendario, presupuesto con límite total y aviso de sobregiro, preferencias alimentarias, recordatorios y aviso de cuenta regresiva.",
  },
  {
    title: "Exportar todo",
    text: "Listas de invitados, plano de mesas y agenda en CSV o listos para imprimir en PDF.",
  },
];

const PLANNER_FEATURES = [
  {
    title: "Proveedores",
    text: "Directorio reutilizable, cronograma del día e itinerario individual por proveedor, con un portal donde cada uno confirma su participación.",
  },
  {
    title: "CRM completo",
    text: "Leads y pipeline de ventas, propuestas con imágenes y comentarios, contratos con firma electrónica, y cobros por tarjeta, Stripe, Mercado Pago o Clip.",
  },
  {
    title: "Portal de cliente con tu marca",
    text: "Los novios ven su progreso, aprueban proveedores, suben inspiración y responden una encuesta de satisfacción al terminar la boda.",
  },
  {
    title: "Negocio multi-boda",
    text: "Biblioteca de documentos, paquetes y plantillas reutilizables, reportes de ingresos, y cuentas de equipo con roles.",
  },
];

const DIFFERENTIATORS = [
  {
    title: "La confirmación es el corazón, no un añadido",
    text: "Muchas plataformas de este tipo tratan el RSVP como una casilla más. Aquí es el punto de partida: cada invitado tiene su propio link y QR, y esa confirmación alimenta en tiempo real las mesas, el presupuesto y los reportes.",
  },
  {
    title: "Control de acceso, no solo confirmación",
    text: "El mismo QR que usa el invitado para confirmar sirve para el check-in de acceso el día del evento — sin listas de papel ni apps adicionales.",
  },
  {
    title: "Proveedores con voz propia",
    text: "Cada proveedor recibe su propio itinerario y puede confirmar su participación o dejar un comentario, algo que casi ninguna otra herramienta de este tipo ofrece.",
  },
  {
    title: "Un solo precio, sin dólares ni tarjetas internacionales",
    text: "Planes simples en pesos mexicanos, pensados para wedding planners y parejas en México.",
  },
  {
    title: "También diseñamos las invitaciones",
    text: "El mismo equipo detrás de la app crea invitaciones digitales 100% personalizadas — no tienes que buscar a alguien más.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-4 py-20 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Elegance Site" className="mx-auto h-20 w-20" />
        <p className="mt-2 text-sm font-medium text-ink">Elegance Site</p>
        <p className="mt-6 text-xs uppercase tracking-[0.25em] text-gold-dark">
          Organización de eventos
        </p>
        <h1 className="mx-auto mt-2 max-w-2xl font-serif text-4xl font-medium text-ink sm:text-5xl">
          Organiza tu evento y gestiona a tus invitados
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-muted">
          Invitados, mesas, presupuesto, proveedores y pagos — todo con confirmaciones por QR y
          el respaldo de un equipo que también diseña las invitaciones digitales de cada boda.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-gold/30 transition hover:shadow-lg hover:shadow-gold/40"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gold/30 bg-white px-6 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:bg-warm"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-4 py-14">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-gold-dark">
          El problema
        </p>
        <h2 className="mx-auto mt-2 max-w-lg text-center font-serif text-2xl font-medium text-ink sm:text-3xl">
          Organizar un evento no debería sentirse como perseguir información.
        </h2>
        <div className="mt-10 divide-y divide-gold/15 border-t border-gold/15">
          {PROBLEMS.map((item) => (
            <div key={item.tag} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <p className="text-sm text-ink-light">{item.tag}</p>
              <p className="text-sm text-ink-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-gold-dark">
          Qué incluye
        </p>
        <h2 className="mx-auto mt-2 max-w-xl text-center font-serif text-2xl font-medium text-ink sm:text-3xl">
          Todo lo que necesitas, organizado en dos planes.
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gold/20 bg-white p-7 shadow-md">
            <span className="inline-block rounded-full border border-gold/30 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gold-dark">
              Particular
            </span>
            <h3 className="mt-4 font-serif text-xl font-medium text-ink">Para cualquier boda</h3>
            <div className="mt-5 space-y-5">
              {PARTICULAR_FEATURES.map((feature) => (
                <div key={feature.title}>
                  <p className="text-sm font-semibold text-ink">{feature.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gold/20 bg-white p-7 shadow-md">
            <span className="inline-block rounded-full border border-gold/30 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gold-dark">
              Wedding Planner
            </span>
            <h3 className="mt-4 font-serif text-xl font-medium text-ink">Además, para tu negocio</h3>
            <div className="mt-5 space-y-5">
              {PLANNER_FEATURES.map((feature) => (
                <div key={feature.title}>
                  <p className="text-sm font-semibold text-ink">{feature.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto w-full max-w-4xl px-4">
          <p className="text-center text-xs uppercase tracking-[0.25em] text-gold-dark">
            Qué nos distingue
          </p>
          <h2 className="mx-auto mt-2 max-w-lg text-center font-serif text-2xl font-medium text-ink sm:text-3xl">
            No es solo una lista de invitados con otro nombre.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {DIFFERENTIATORS.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-gold/20 bg-cream/60 p-5"
              >
                <p className="font-serif text-lg font-medium text-ink">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-4 py-14 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-dark">Y además</p>
        <h2 className="mt-2 font-serif text-2xl font-medium text-ink sm:text-3xl">
          También diseñamos tus invitaciones digitales.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">
          Cada invitación la creamos desde cero, 100% personalizada al estilo de cada evento, con
          más de dos años de experiencia. Cotiza directamente con nosotros.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-5 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Cotizar por WhatsApp
        </a>
        <div className="mt-6 flex items-center justify-center gap-4 border-t border-gold/15 pt-6">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 bg-white text-gold-dark hover:bg-warm"
          >
            <FacebookIcon className="h-5 w-5" />
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 bg-white text-gold-dark hover:bg-warm"
          >
            <InstagramIcon className="h-5 w-5" />
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 bg-white text-gold-dark hover:bg-warm"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-14">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-gold-dark">Planes</p>
        <h2 className="mx-auto mt-2 max-w-lg text-center font-serif text-2xl font-medium text-ink sm:text-3xl">
          Un precio simple para cada tipo de boda.
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-gold/20 bg-white p-7 shadow-md">
            <p className="font-serif text-xl font-medium text-ink">Particular</p>
            <p className="mt-1 text-sm text-ink-muted">
              Para organizar tu propia boda, de principio a fin.
            </p>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-serif text-4xl font-medium text-ink">$500</span>
              <span className="text-sm text-ink-muted">MXN</span>
            </div>
            <p className="mt-1 text-xs text-ink-light">Pago único · sin mensualidades</p>
            <ul className="mt-5 space-y-2 text-sm text-ink-muted">
              <li className="border-b border-gold/10 pb-2">Invitados, confirmaciones y check-in por QR</li>
              <li className="border-b border-gold/10 pb-2">Mesas, plano del salón y presupuesto</li>
              <li className="pb-2">Checklist, recordatorios y cuenta regresiva</li>
            </ul>
            <Link
              href="/register"
              className="mt-6 rounded-lg border border-gold/30 bg-white px-5 py-2.5 text-center text-sm font-medium text-ink shadow-sm hover:bg-warm"
            >
              Empezar
            </Link>
          </div>

          <div className="flex flex-col rounded-2xl border border-gold bg-white p-7 shadow-lg">
            <p className="font-serif text-xl font-medium text-ink">Wedding Planner</p>
            <p className="mt-1 text-sm text-ink-muted">
              Para planners que manejan varias bodas y quieren un CRM completo.
            </p>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-serif text-4xl font-medium text-ink">$300</span>
              <span className="text-sm text-ink-muted">MXN / mes</span>
            </div>
            <div className="mt-3 border-t border-dashed border-gold/20 pt-3">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-medium text-ink">$2,400</span>
                <span className="text-sm text-ink-muted">MXN / año</span>
              </div>
              <span className="mt-2 inline-block rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
                Ahorras $1,200 MXN — 4 meses gratis
              </span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-ink-muted">
              <li className="border-b border-gold/10 pb-2">Todo lo del plan Particular, en bodas ilimitadas</li>
              <li className="border-b border-gold/10 pb-2">Proveedores, itinerarios y portal de confirmación</li>
              <li className="border-b border-gold/10 pb-2">CRM: leads, propuestas, contratos y cobros</li>
              <li className="pb-2">Portal de cliente con tu marca y reportes de negocio</li>
            </ul>
            <Link
              href="/register"
              className="mt-6 rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-5 py-2.5 text-center text-sm font-medium text-white shadow-md hover:shadow-lg"
            >
              Empezar
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gold/15 px-4 py-8">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Elegance Site" className="h-7 w-7" />
            <span className="font-serif text-sm font-medium text-ink">Elegance Site</span>
          </div>
          <p className="text-xs text-ink-light">
            Gestión de bodas e invitaciones digitales · Precios en pesos mexicanos (MXN)
          </p>
        </div>
      </footer>
    </div>
  );
}
