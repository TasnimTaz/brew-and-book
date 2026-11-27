import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Bengali, Playfair_Display } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-sans-bengali",
  subsets: ["bengali"],
  display: "swap",
});

const display = Playfair_Display({ variable: "--font-display", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Brew & Book",
  description:
    "Coffee shop table booking, pre-ordering, and payments for Bangladesh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSans.variable} ${notoSansBengali.variable} ${display.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
