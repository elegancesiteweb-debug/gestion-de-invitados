import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { updateNotificationSettings } from "@/lib/actions/notifications";
import { updateBrand, removeBrandLogo } from "@/lib/actions/brand";
import { setLocale } from "@/lib/actions/locale";
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

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.teamRole === "COLLABORATOR") {
    notFound();
  }
  const t = await getTranslations("settingsPage");

  const organizer = await prisma.organizer.findUniqueOrThrow({ where: { id: session.user.id } });
  const showBranding = hasFeature(session.user.accountType, "own_branding");
  const showIntegrations = hasFeature(session.user.accountType, "own_integrations");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
        {t("backToEvents")}
      </Link>

      <h1 className="mt-2 font-serif text-2xl font-medium text-ink">{t("title")}</h1>

      <section className="mt-6 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <p className="font-medium text-ink">{t("language")}</p>
        <p className="text-xs text-ink-muted">{t("languageHint")}</p>
        <form action={async (formData) => { "use server"; await setLocale(formData.get("locale") as "es" | "en"); }} className="flex items-end gap-3">
          <select
            name="locale"
            defaultValue={organizer.locale}
            className="rounded-lg border border-gold/25 px-3 py-1.5 text-sm"
          >
            <option value="es">{t("spanish")}</option>
            <option value="en">{t("english")}</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("save")}
          </button>
        </form>
      </section>

      <section className="mt-4 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <p className="font-medium text-ink">{t("notifications")}</p>
        <form action={updateNotificationSettings} className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              name="notifyByEmail"
              type="checkbox"
              defaultChecked={organizer.notifyByEmail}
              className="h-4 w-4"
            />
            {t("notifyByEmail")}
          </label>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("save")}
          </button>
        </form>
      </section>

      {showBranding && (
        <section className="mt-4 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
          <p className="font-medium text-ink">{t("brandTitle")}</p>
          <p className="text-xs text-ink-muted">{t("brandHint")}</p>
          <form action={updateBrand} className="space-y-2" encType="multipart/form-data">
            <div>
              <label className="block text-xs font-medium mb-1">{t("businessName")}</label>
              <input
                name="brandName"
                defaultValue={organizer.brandName ?? ""}
                placeholder={t("businessNamePlaceholder")}
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t("mainColor")}</label>
              <input
                name="brandColor"
                type="color"
                defaultValue={organizer.brandColor ?? "#c9a84c"}
                className="h-9 w-16 rounded border border-gold/25"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t("businessPhone")}</label>
              <input
                name="businessPhone"
                defaultValue={organizer.businessPhone ?? ""}
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
              <p className="mt-1 text-xs text-ink-muted">{t("businessPhoneHint")}</p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t("businessEmail")}</label>
              <input
                name="businessEmail"
                type="email"
                defaultValue={organizer.businessEmail ?? ""}
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t("logo")}</label>
              {organizer.brandLogoType && (
                <div className="mb-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/organizers/${organizer.id}/brand-logo`}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <button
                    formAction={removeBrandLogo}
                    className="text-sm text-danger hover:underline"
                  >
                    {t("removeLogo")}
                  </button>
                </div>
              )}
              <input name="brandLogo" type="file" accept="image/*" className="text-sm" />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              {t("save")}
            </button>
          </form>
        </section>
      )}

      {showIntegrations && (
        <>
          <h2 className="mt-8 font-serif text-xl font-medium text-ink">{t("integrations")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("integrationsHint")}</p>

          <section className="mt-4 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink">{t("resendTitle")}</p>
              <IntegrationStatusBadge configured={!!organizer.resendApiKey} t={t} />
            </div>
            <form action={updateResendCredentials} className="space-y-2">
              <div>
                <label className="block text-xs font-medium mb-1">{t("apiKey")}</label>
                <input
                  name="apiKey"
                  type="password"
                  placeholder={organizer.resendApiKey ? t("savedPlaceholder") : "re_..."}
                  className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t("fromEmail")}</label>
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
                  {t("save")}
                </button>
                {organizer.resendApiKey && (
                  <button
                    formAction={removeResendCredentials}
                    className="text-sm text-danger hover:underline"
                  >
                    {t("remove")}
                  </button>
                )}
              </div>
            </form>
            <p className="text-xs text-ink-muted">
              {t("createApiKeyAt")}{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noreferrer"
                className="text-gold-dark hover:underline"
              >
                resend.com
              </a>
              .
            </p>
          </section>

          <section className="mt-4 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink">Stripe</p>
              <IntegrationStatusBadge configured={!!organizer.stripeSecretKey} t={t} />
            </div>
            <form action={updateStripeCredentials} className="space-y-2">
              <div>
                <label className="block text-xs font-medium mb-1">{t("secretKey")}</label>
                <input
                  name="secretKey"
                  type="password"
                  placeholder={
                    organizer.stripeSecretKey ? t("savedPlaceholder") : "sk_live_... o sk_test_..."
                  }
                  className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
                >
                  {t("save")}
                </button>
                {organizer.stripeSecretKey && (
                  <button
                    formAction={removeStripeCredentials}
                    className="text-sm text-danger hover:underline"
                  >
                    {t("remove")}
                  </button>
                )}
              </div>
            </form>
            <p className="text-xs text-ink-muted">
              Dashboard &gt; Developers &gt; API keys {t("inSite")}{" "}
              <a
                href="https://stripe.com"
                target="_blank"
                rel="noreferrer"
                className="text-gold-dark hover:underline"
              >
                stripe.com
              </a>
              .
            </p>
          </section>

          <section className="mt-4 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink">Mercado Pago</p>
              <IntegrationStatusBadge configured={!!organizer.mercadoPagoAccessToken} t={t} />
            </div>
            <form action={updateMercadoPagoCredentials} className="space-y-2">
              <div>
                <label className="block text-xs font-medium mb-1">Access Token</label>
                <input
                  name="accessToken"
                  type="password"
                  placeholder={organizer.mercadoPagoAccessToken ? t("savedPlaceholderM") : "APP_USR-..."}
                  className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
                >
                  {t("save")}
                </button>
                {organizer.mercadoPagoAccessToken && (
                  <button
                    formAction={removeMercadoPagoCredentials}
                    className="text-sm text-danger hover:underline"
                  >
                    {t("remove")}
                  </button>
                )}
              </div>
            </form>
            <p className="text-xs text-ink-muted">
              {t("yourBusinessCredentials")} {t("inSite")}{" "}
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
              <IntegrationStatusBadge configured={!!organizer.clipApiKey} t={t} />
            </div>
            <form action={updateClipCredentials} className="space-y-2">
              <div>
                <label className="block text-xs font-medium mb-1">{t("apiKey")}</label>
                <input
                  name="apiKey"
                  type="password"
                  placeholder={organizer.clipApiKey ? t("savedPlaceholder") : "clip_..."}
                  className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
                >
                  {t("save")}
                </button>
                {organizer.clipApiKey && (
                  <button
                    formAction={removeClipCredentials}
                    className="text-sm text-danger hover:underline"
                  >
                    {t("remove")}
                  </button>
                )}
              </div>
            </form>
            <p className="text-xs text-ink-muted">
              Panel &gt; Desarrolladores &gt; API Keys {t("inSite")}{" "}
              <a
                href="https://clip.mx"
                target="_blank"
                rel="noreferrer"
                className="text-gold-dark hover:underline"
              >
                clip.mx
              </a>
              .
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function IntegrationStatusBadge({
  configured,
  t,
}: {
  configured: boolean;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        configured ? "bg-success-bg text-success" : "bg-warm text-ink-muted"
      }`}
    >
      {configured ? t("configured") : t("usingGeneral")}
    </span>
  );
}
