import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Noto_Serif_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import NextTopLoader from "nextjs-toploader";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { MarketingTracking } from "@/components/marketing/marketing-tracking";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SITE_LOCALE, SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * The display face for marketing headlines and big numbers: a regular-weight
 * serif set large, so the type carries the page instead of bold sans.
 * Swapping it is this block plus `--font-display` in globals.css.
 */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/**
 * Instrument Serif has no Cyrillic, so Russian pages set their display type
 * in Noto Serif Display, narrowed on its width axis to Instrument's colour
 * (globals.css, `html:lang(ru)`). Not preloaded: the other languages never
 * download it.
 */
const cyrillicDisplay = Noto_Serif_Display({
  variable: "--font-cyrillic-display",
  style: ["normal", "italic"],
  subsets: ["cyrillic", "latin"],
  axes: ["wdth"],
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("site")]);
  const title = `${SITE_NAME} — ${t("tagline")}`;
  const description = t("description");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s · ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    keywords: [
      "real estate CRM",
      "estate agent CRM",
      "CRM inmobiliario",
      "independent real estate agents",
      "multi-agency CRM",
      "real estate lead management",
    ],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "business",
    referrer: "origin-when-cross-origin",
    openGraph: {
      type: "website",
      url: "/",
      siteName: SITE_NAME,
      locale: locale === "es" ? "es_ES" : locale === "ru" ? "ru_RU" : SITE_LOCALE,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
  };
}

// The phone browser bar takes the page's own ground: white by day, the dark
// background (--background in .dark, oklch(0.19 0.005 56)) at night.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#161312" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${cyrillicDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Thin progress bar at the top during route transitions. */}
        <NextTopLoader
          color="var(--foreground)"
          height={3}
          showSpinner={false}
          shadow={false}
          zIndex={1600}
        />
        <ThemeProvider>
          <NextIntlClientProvider>
            {children}
            <Toaster />
            {/* Meta Pixel + cookie notice: marketing URLs only, and only after consent. */}
            <Suspense fallback={null}>
              <MarketingTracking />
            </Suspense>
          </NextIntlClientProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
