import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendRsvpEmail(params: {
  to: string;
  guestName: string;
  eventTitle: string;
  eventDate: string;
  location?: string | null;
  confirmUrl: string;
}) {
  if (!resend) {
    throw new Error(
      "RESEND_API_KEY no está configurada. Agrégala en tus variables de entorno para poder enviar correos."
    );
  }

  const { to, guestName, eventTitle, eventDate, location, confirmUrl } = params;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: `Confirma tu asistencia: ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>${eventTitle}</h2>
        <p>Hola ${guestName},</p>
        <p>Fecha: ${eventDate}</p>
        ${location ? `<p>Lugar: ${location}</p>` : ""}
        <p>Por favor confirma tu asistencia haciendo clic en el siguiente enlace:</p>
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
