import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { extendAccess } from "@/lib/accessExpiry";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { name, email, password, accessCode } = parsed.data;

  const existing = await prisma.organizer.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const normalizedCode = accessCode.trim().toUpperCase();

  try {
    await prisma.$transaction(async (tx) => {
      const claim = await tx.accessCode.updateMany({
        where: { code: normalizedCode, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claim.count === 0) {
        throw new Error("INVALID_CODE");
      }

      const codeRow = await tx.accessCode.findUniqueOrThrow({
        where: { code: normalizedCode },
      });

      const accessExpiresAt =
        codeRow.accountType === "PLANNER" && codeRow.durationMonths
          ? extendAccess(null, codeRow.durationMonths)
          : null;

      const organizer = await tx.organizer.create({
        data: { name, email, passwordHash, accountType: codeRow.accountType, accessExpiresAt },
      });

      await tx.accessCode.update({
        where: { code: normalizedCode },
        data: { usedByOrganizerId: organizer.id },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_CODE") {
      return NextResponse.json(
        { error: "Código de acceso inválido o ya utilizado" },
        { status: 400 }
      );
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
