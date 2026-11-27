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

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brew & Book | Premium Coffee & Table Reservations",
  description:
    "Reserve your perfect table, pre-order artisanal coffee and cuisine, and enjoy a seamless cafe experience in Dhaka. Powered by Brew & Book.",
  keywords: ["coffee shop", "table booking", "Dhaka cafe", "pre-order", "Brew & Book"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${notoSans.variable} ${notoSansBengali.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
