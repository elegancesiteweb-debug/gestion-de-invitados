import { Resend } from "resend";
import type { Organizer } from "@prisma/client";
import { renderTemplate } from "@/lib/messageTemplate";
import { decryptSecret } from "@/lib/crypto";

export function resolveResendCredentials(
  organizer: Pick<Organizer, "resendApiKey" | "resendFromEmail">
): { apiKey: string; fromEmail: string } {
  const apiKey = organizer.resendApiKey
    ? decryptSecret(organizer.resendApiKey)
    : process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No hay una API Key de Resend configurada. Agrégala en Integraciones o pide al administrador que configure RESEND_API_KEY."
    );
  }

  const fromEmail = organizer.resendFromEmail || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  return { apiKey, fromEmail };
}

export async function sendRsvpEmail(params: {
  to: string;
  template: string;
  guestName: string;
  eventTitle: string;
  eventDate: string;
  location?: string | null;
  tableName?: string | null;
  maxCompanions: number;
  confirmUrl: string;
  invitationUrl?: string | null;
  apiKey: string;
  fromEmail: string;
}) {
  const {
    to,
    template,
    guestName,
    eventTitle,
    eventDate,
    location,
    tableName,
    maxCompanions,
    confirmUrl,
    invitationUrl,
    apiKey,
    fromEmail,
  } = params;
  const resend = new Resend(apiKey);

  const bodyText = renderTemplate(template, {
    nombre: guestName,
    evento: eventTitle,
    fecha: eventDate,
    lugar: location || "por confirmar",
    mesa: tableName || "por asignar",
    pases: String(maxCompanions + 1),
    link: confirmUrl,
    invitacion: invitationUrl || "",
  });

  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `Confirma tu asistencia: ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <p style="white-space: pre-wrap; line-height: 1.6;">${bodyText}</p>
        <p>
          <a href="${confirmUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
            Confirmar asistencia
          </a>
        </p>
        <p style="color:#666;font-size:12px;">Si el botón no funciona, copia y pega este link: ${confirmUrl}</p>
      </div>
    `,
  });
}
