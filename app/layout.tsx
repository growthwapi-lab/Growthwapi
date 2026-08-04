import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GrowthWapi - WhatsApp API, AI Calling & Website Development",
  description: "WhatsApp API, AI Calling Agents, and Website Development — everything you need to grow, managed for you.",
  keywords: ["WhatsApp API", "AI Calling Agent", "Website Development", "GrowthWapi", "India small business growth"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-white text-slate-800">
        {children}
      </body>
    </html>
  );
}
