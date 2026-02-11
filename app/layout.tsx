import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { brand } from "@/lib/brand";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: `${brand.appName} - ${brand.tagline}`,
    template: `%s | ${brand.appName}`,
  },
  description: "A secure platform for real estate networking, training, and performance-based rewards",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  openGraph: {
    title: brand.appName,
    description: brand.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: brand.appName,
    description: brand.tagline,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
