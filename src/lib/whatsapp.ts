import { renderTemplate } from "@/lib/messageTemplate";

export function buildWhatsAppLink(phone: string, message: string): string {
  const digitsOnly = phone.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${digitsOnly}?text=${encodedMessage}`;
}

export function buildRsvpMessage(params: {
  template: string;
  guestName: string;
  eventTitle: string;
  eventDate: string;
  location?: string | null;
  tableName?: string | null;
  maxCompanions: number;
  confirmUrl: string;
  invitationUrl?: string | null;
}): string {
  const rendered = renderTemplate(params.template, {
    nombre: params.guestName,
    evento: params.eventTitle,
    fecha: params.eventDate,
    lugar: params.location || "por confirmar",
    mesa: params.tableName || "por asignar",
    pases: String(params.maxCompanions + 1),
    link: params.confirmUrl,
    invitacion: params.invitationUrl || "",
  });

  // Si la plantilla no incluye {invitacion} pero el invitado sí tiene un link de
  // invitación, se agrega al final para no perderlo silenciosamente.
  if (params.invitationUrl && !params.template.includes("{invitacion}")) {
    return `${rendered}\n\nInvitación: ${params.invitationUrl}`;
  }
  return rendered;
}
