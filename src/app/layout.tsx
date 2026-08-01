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
  title: "AgroDirect | Από τον παραγωγό στο τραπέζι σας",
  description: "Φρέσκα τοπικά προϊόντα απευθείας από Έλληνες παραγωγούς, χωρίς μεσάζοντες.",
  manifest: "/manifest.webmanifest",
  applicationName: "AgroDirect",
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
      </head>
      <body className="font-sans antialiased">
        {children}
        <PwaInstallPrompt />
        <CookieConsent />
      </body>
    </html>
  );
}