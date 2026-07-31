import { getLocale } from "next-intl/server";
import { RegisterForm } from "./RegisterForm";
import type { AppLocale } from "@/lib/locale";

export default async function RegisterPage() {
  const locale = (await getLocale()) as AppLocale;
  return <RegisterForm currentLocale={locale} />;
}
