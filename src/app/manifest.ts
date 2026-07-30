import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Elegance Site",
    short_name: "Elegance Site",
    description: "Gestión de invitados y confirmación de asistencia",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5f0e8",
    theme_color: "#c9a84c",
    icons: [
      {
        src: "/icon-bg.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
