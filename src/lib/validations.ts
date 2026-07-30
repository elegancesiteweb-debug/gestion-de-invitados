import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  accessCode: z.string().min(1, "El código de acceso es requerido"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const eventSchema = z.object({
  title: z.string().min(2, "El título es muy corto"),
  description: z.string().optional(),
  eventDate: z.string().min(1, "La fecha es requerida"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const guestSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  maxCompanions: z.coerce.number().int().min(0).default(0),
  tableName: z.string().optional(),
  invitationLinkUrl: z.string().url("Link inválido").optional().or(z.literal("")),
});

export const rsvpSchema = z.object({
  status: z.enum(["CONFIRMED", "DECLINED"]),
  companionsConfirmed: z.coerce.number().int().min(0).default(0),
  messageFromGuest: z.string().max(500).optional(),
  dietaryNotes: z.string().max(200).optional(),
});

export const generalRsvpSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  status: z.enum(["CONFIRMED", "DECLINED"]),
  companionsConfirmed: z.coerce.number().int().min(0).default(0),
  messageFromGuest: z.string().max(500).optional(),
  dietaryNotes: z.string().max(200).optional(),
});
