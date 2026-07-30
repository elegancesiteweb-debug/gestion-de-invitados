import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import {
  updateResendCredentials,
  removeResendCredentials,
  updateStripeCredentials,
  removeStripeCredentials,
  updateMercadoPagoCredentials,
  removeMercadoPagoCredentials,
  updateClipCredentials,
  removeClipCredentials,
} from "@/lib/actions/integrations";

export default async function IntegrationsSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!hasFeature(session.user.accountType, "own_integrations")) {
    notFound();
  }

  const organizer = await prisma.organizer.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
        ← Tus eventos
      </Link>

      <h1 className="mt-2 font-serif text-2xl font-medium text-ink">Integraciones</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Conecta tus propias cuentas para que los correos y cobros salgan a nombre de tu negocio, no
        del general de la app. Si dejas algo sin configurar, se usa el respaldo general mientras
        esté disponible.
      </p>

      <section className="mt-6 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="font-medium text-ink">Resend (envío de correos)</p>
          <StatusBadge configured={!!organizer.resendApiKey} />
        </div>
        <form action={updateResendCredentials} className="space-y-2">
          <div>
            <label className="block text-xs font-medium mb-1">API Key</label>
            <input
              name="apiKey"
              type="password"
              placeholder={organizer.resendApiKey ? "•••••••••• (guardada)" : "re_..."}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email remitente</label>
            <input
              name="fromEmail"
              type="email"
              defaultValue={organizer.resendFromEmail ?? ""}
              placeholder="invitaciones@tudominio.com"
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Guardar
            </button>
            {organizer.resendApiKey && (
              <button
                formAction={removeResendCredentials}
                className="text-sm text-danger hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
        </form>
        <p className="text-xs text-ink-muted">
          Crea tu API Key en{" "}
          <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-gold-dark hover:underline">
            resend.com
          </a>
          .
        </p>
      </section>

      <section className="mt-4 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="font-medium text-ink">Stripe</p>
          <StatusBadge configured={!!organizer.stripeSecretKey} />
        </div>
        <form action={updateStripeCredentials} className="space-y-2">
          <div>
            <label className="block text-xs font-medium mb-1">Clave secreta</label>
            <input
              name="secretKey"
              type="password"
              placeholder={organizer.stripeSecretKey ? "•••••••••• (guardada)" : "sk_live_... o sk_test_..."}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Guardar
            </button>
            {organizer.stripeSecretKey && (
              <button
                formAction={removeStripeCredentials}
                className="text-sm text-danger hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
        </form>
        <p className="text-xs text-ink-muted">
          Dashboard &gt; Developers &gt; API keys en{" "}
          <a href="https://stripe.com" target="_blank" rel="noreferrer" className="text-gold-dark hover:underline">
            stripe.com
          </a>
          .
        </p>
      </section>

      <section className="mt-4 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="font-medium text-ink">Mercado Pago</p>
          <StatusBadge configured={!!organizer.mercadoPagoAccessToken} />
        </div>
        <form action={updateMercadoPagoCredentials} className="space-y-2">
          <div>
            <label className="block text-xs font-medium mb-1">Access Token</label>
            <input
              name="accessToken"
              type="password"
              placeholder={organizer.mercadoPagoAccessToken ? "•••••••••• (guardado)" : "APP_USR-..."}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Guardar
            </button>
            {organizer.mercadoPagoAccessToken && (
              <button
                formAction={removeMercadoPagoCredentials}
                className="text-sm text-danger hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
        </form>
        <p className="text-xs text-ink-muted">
          Tu negocio &gt; Credenciales en{" "}
          <a
            href="https://www.mercadopago.com"
            target="_blank"
            rel="noreferrer"
            className="text-gold-dark hover:underline"
          >
            mercadopago.com
          </a>
          .
        </p>
      </section>

      <section className="mt-4 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="font-medium text-ink">Clip</p>
          <StatusBadge configured={!!organizer.clipApiKey} />
        </div>
        <form action={updateClipCredentials} className="space-y-2">
          <div>
            <label className="block text-xs font-medium mb-1">API Key</label>
            <input
              name="apiKey"
              type="password"
              placeholder={organizer.clipApiKey ? "•••••••••• (guardada)" : "clip_..."}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Guardar
            </button>
            {organizer.clipApiKey && (
              <button
                formAction={removeClipCredentials}
                className="text-sm text-danger hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
        </form>
        <p className="text-xs text-ink-muted">
          Panel &gt; Desarrolladores &gt; API Keys en{" "}
          <a href="https://clip.mx" target="_blank" rel="noreferrer" className="text-gold-dark hover:underline">
            clip.mx
          </a>
          .
        </p>
      </section>
    </div>
  );
}

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        configured ? "bg-success-bg text-success" : "bg-warm text-ink-muted"
      }`}
    >
      {configured ? "Configurado" : "Usando el general"}
    </span>
  );
}
