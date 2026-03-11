import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JoJoias",
    short_name: "JoJoias",
    description: "Semijoias premium com entrega rápida e compra segura.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    background_color: "#ffffff",
    theme_color: "#111111",
    lang: "pt-BR",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/demo-products/anel-luna.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/demo-products/anel-luna.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
