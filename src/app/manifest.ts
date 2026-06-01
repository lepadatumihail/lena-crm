import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lena — Real Estate CRM",
    short_name: "Lena",
    description: "CRM for independent real estate agents.",
    start_url: "/clients/buyers",
    display: "standalone",
    background_color: "#faf8f3",
    theme_color: "#c0603f",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
