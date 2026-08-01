import "@/styles/globals.css";

import { Manrope } from "next/font/google";
import { type Metadata, type Viewport } from "next";
import { CookieConsent } from "@/components/CookieConsent";

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
    { rel: "apple-touch-icon", url: "/favicon.ico" },
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
      </head>
      <body className="font-sans antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}