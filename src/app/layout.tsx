import "@/styles/globals.css";

import { Inter } from "next/font/google";
import { type Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AgroDirect | Από τον παραγωγό στο τραπέζι σας",
  description: "Φρέσκα τοπικά προϊόντα απευθείας από Έλληνες παραγωγούς, χωρίς μεσάζοντες.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="el" className={`${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}