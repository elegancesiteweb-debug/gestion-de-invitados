import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";

const FACEBOOK_URL = "https://www.facebook.com/share/1BiWaV8Adg/?mibextid=wwXIfr";
const INSTAGRAM_URL = "https://www.instagram.com/elegancesite.web?igsh=MWN3a2Rnc2Vjejl3eA==";
const WHATSAPP_URL =
  "https://wa.me/523311843408?text=%C2%A1Hola%20Elegance%20Site!%20%F0%9F%92%8C%0AMe%20interesa%20conocer%20m%C3%A1s%20sobre%20el%20la%20app%20de%20gesti%C3%B3n%20de%20eventos.";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
      <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.522 1.492-3.915 3.777-3.915 1.094 0 2.238.196 2.238.196v2.475h-1.26c-1.243 0-1.63.775-1.63 1.57v1.888h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
      <path d="M12 2.2c3.2 0 3.58.012 4.85.07 1.17.054 1.97.24 2.43.41.6.23 1.03.51 1.48.96.45.45.73.88.96 1.48.17.46.356 1.26.41 2.43.058 1.27.07 1.65.07 4.85s-.012 3.58-.07 4.85c-.054 1.17-.24 1.97-.41 2.43-.23.6-.51 1.03-.96 1.48-.45.45-.88.73-1.48.96-.46.17-1.26.356-2.43.41-1.27.058-1.65.07-4.85.07s-3.58-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.41a3.99 3.99 0 0 1-1.48-.96 3.99 3.99 0 0 1-.96-1.48c-.17-.46-.356-1.26-.41-2.43C2.212 15.58 2.2 15.2 2.2 12s.012-3.58.07-4.85c.054-1.17.24-1.97.41-2.43.23-.6.51-1.03.96-1.48.45-.45.88-.73 1.48-.96.46-.17 1.26-.356 2.43-.41C8.42 2.212 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.5.012-4.74.068-.96.044-1.48.204-1.82.34-.46.178-.78.39-1.12.73-.34.34-.552.66-.73 1.12-.136.34-.296.86-.34 1.82C3.212 8.5 3.2 8.86 3.2 12s.012 3.5.068 4.74c.044.96.204 1.48.34 1.82.178.46.39.78.73 1.12.34.34.66.552 1.12.73.34.136.86.296 1.82.34C8.5 20.788 8.86 20.8 12 20.8s3.5-.012 4.74-.068c.96-.044 1.48-.204 1.82-.34.46-.178.78-.39 1.12-.73.34-.34.552-.66.73-1.12.136-.34.296-.86.34-1.82.056-1.24.068-1.6.068-4.74s-.012-3.5-.068-4.74c-.044-.96-.204-1.48-.34-1.82a2.19 2.19 0 0 0-.73-1.12 2.19 2.19 0 0 0-1.12-.73c-.34-.136-.86-.296-1.82-.34C15.5 4.012 15.14 4 12 4Zm0 3.05a4.95 4.95 0 1 1 0 9.9 4.95 4.95 0 0 1 0-9.9Zm0 1.8a3.15 3.15 0 1 0 0 6.3 3.15 3.15 0 0 0 0-6.3Zm5.15-2.4a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.76.46 3.42 1.26 4.86L2 22l5.28-1.39a9.96 9.96 0 0 0 4.76 1.21h.01c5.52 0 10-4.48 10-10s-4.49-10-10.01-10Zm0 18.13a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.13.82.84-3.05-.19-.31a8.09 8.09 0 0 1-1.24-4.28c0-4.48 3.65-8.13 8.14-8.13 2.17 0 4.21.85 5.75 2.38a8.07 8.07 0 0 1 2.38 5.75c0 4.48-3.65 8.13-8.12 8.13Zm4.46-6.09c-.24-.12-1.45-.71-1.67-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.29.18-.53.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.31-.01-.47-.01-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

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
          <WhatsAppIcon />
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
            <FacebookIcon />
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("instagram")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 text-gold-dark hover:bg-warm"
          >
            <InstagramIcon />
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("whatsapp")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 text-gold-dark hover:bg-warm"
          >
            <WhatsAppIcon />
          </a>
        </div>
      </div>
    </div>
  );
}
