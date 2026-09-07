import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import NextTopLoader from "nextjs-toploader";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
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
      locale: locale === "es" ? "es_ES" : SITE_LOCALE,
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

export const viewport: Viewport = {
  themeColor: "#c0603f",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Thin progress bar at the top during route transitions. */}
        <NextTopLoader
          color="var(--primary)"
          height={3}
          showSpinner={false}
          shadow={false}
          zIndex={1600}
        />
        <ThemeProvider>
          <NextIntlClientProvider>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
