import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/SocialIcons";

const FACEBOOK_URL = "https://www.facebook.com/share/1BiWaV8Adg/?mibextid=wwXIfr";
const INSTAGRAM_URL = "https://www.instagram.com/elegancesite.web?igsh=MWN3a2Rnc2Vjejl3eA==";
const WHATSAPP_URL =
  "https://wa.me/523311843408?text=%C2%A1Hola%20Elegance%20Site!%20%F0%9F%92%8C%0AMe%20interesa%20conocer%20m%C3%A1s%20sobre%20el%20la%20app%20de%20gesti%C3%B3n%20de%20eventos.";

export default async function InvitacionesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const t = await getTranslations("invitationsPage");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-gold/20 bg-white/60 p-8 text-center shadow-lg backdrop-blur-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Elegance Site" className="mx-auto h-16 w-16" />
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gold-dark">{t("title")}</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-ink">{t("subtitle")}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">{t("description")}</p>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-5 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg"
        >
          <WhatsAppIcon className="h-6 w-6" />
          {t("ctaWhatsapp")}
        </a>

        <div className="mt-8 flex items-center justify-center gap-4 border-t border-gold/15 pt-6">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("facebook")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 text-gold-dark hover:bg-warm"
          >
            <FacebookIcon className="h-6 w-6" />
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("instagram")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 text-gold-dark hover:bg-warm"
          >
            <InstagramIcon className="h-6 w-6" />
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("whatsapp")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 text-gold-dark hover:bg-warm"
          >
            <WhatsAppIcon className="h-6 w-6" />
          </a>
        </div>
      </div>
    </div>
  );
}
