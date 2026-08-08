import "@/styles/globals.css";

import { Manrope } from "next/font/google";
import { type Metadata, type Viewport } from "next";
import { CookieConsent } from "@/components/CookieConsent";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agrodirect.gr"),
  title: "AgroDirect | Από τον παραγωγό στο τραπέζι σας",
  description: "Φρέσκα τοπικά προϊόντα απευθείας από Έλληνες παραγωγούς, χωρίς μεσάζοντες.",
  keywords: ["αγροτικά προϊόντα", "τοπικά προϊόντα", "παραγωγοί", "αγορά από παραγωγό", "AgroDirect"],
  manifest: "/manifest.webmanifest",
  applicationName: "AgroDirect",
  alternates: {
    canonical: "https://agrodirect.gr",
  },
  openGraph: {
    title: "AgroDirect | Από τον παραγωγό στο τραπέζι σας",
    description: "Φρέσκα τοπικά προϊόντα απευθείας από Έλληνες παραγωγούς, χωρίς μεσάζοντες.",
    url: "https://agrodirect.gr",
    siteName: "AgroDirect",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "AgroDirect" }],
    locale: "el_GR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgroDirect | Από τον παραγωγό στο τραπέζι σας",
    description: "Φρέσκα τοπικά προϊόντα απευθείας από Έλληνες παραγωγούς, χωρίς μεσάζοντες.",
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AgroDirect",
  },
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/icons/apple-touch-icon.png" },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="el" className={`${manrope.variable}`}>
      <head>
        <meta name="theme-color" content="#16a34a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="AgroDirect" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="robots" content="index, follow" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <PwaInstallPrompt />
        <CookieConsent />
      </body>
    </html>
  );
}