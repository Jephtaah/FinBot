import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinBot - AI-Powered Personal Finance Management",
  description: "Take control of your finances with FinBot's intelligent expense tracking, AI receipt scanning, and personalized financial insights. Start managing your money smarter today.",
  keywords: ["personal finance", "expense tracking", "AI", "receipt scanning", "financial insights", "budgeting", "money management"],
  authors: [{ name: "FinBot Team" }],
  openGraph: {
    title: "FinBot - AI-Powered Personal Finance Management",
    description: "Track expenses, upload receipts, and get AI-powered insights to manage your money smarter.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinBot - AI-Powered Personal Finance Management",
    description: "Track expenses, upload receipts, and get AI-powered insights to manage your money smarter.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
