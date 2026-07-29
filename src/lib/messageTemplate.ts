export const DEFAULT_MESSAGE_TEMPLATE = `Hola {nombre},

{evento} te invita a confirmar tu asistencia.

Fecha: {fecha}
Lugar: {lugar}
Mesa: {mesa}
Pases: {pases}

Confirma tu asistencia aquí: {link}`;

export const TEMPLATE_VARIABLES = [
  "nombre",
  "evento",
  "fecha",
  "lugar",
  "mesa",
  "pases",
  "link",
] as const;

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}
