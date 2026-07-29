export function buildWhatsAppLink(phone: string, message: string): string {
  const digitsOnly = phone.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${digitsOnly}?text=${encodedMessage}`;
}

export function buildRsvpMessage(params: {
  guestName: string;
  eventTitle: string;
  eventDate: string;
  confirmUrl: string;
}): string {
  const { guestName, eventTitle, eventDate, confirmUrl } = params;
  return `Hola ${guestName}! Confirma tu asistencia a "${eventTitle}" (${eventDate}) aquí: ${confirmUrl}`;
}
