import { getLocale } from "next-intl/server";
import { LoginForm } from "./LoginForm";
import type { AppLocale } from "@/lib/locale";

export default async function LoginPage() {
  const locale = (await getLocale()) as AppLocale;
  return <LoginForm currentLocale={locale} />;
}
