import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Family Cloud",
    short_name: "Family Cloud",
    description:
      "Private home cloud infrastructure for families to stay organized, secure, and connected.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f0e6",
    theme_color: "#b86642",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
