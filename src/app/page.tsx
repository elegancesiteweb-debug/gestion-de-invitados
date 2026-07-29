import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-3xl font-semibold sm:text-4xl">
        Organiza tu evento y gestiona a tus invitados
      </h1>
      <p className="mt-4 max-w-xl text-gray-500">
        Crea tu evento, agrega a tus invitados y comparte un link (o QR) de confirmación
        de asistencia para pegar en la invitación que ya diseñaste. Lleva el control de
        quién confirmó, en tiempo real.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/register"
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Crear cuenta gratis
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
