import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "swagger-ui-react/swagger-ui.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ToastToaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sublytics - Subscription Management System",
  description: "Comprehensive subscription management system",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/faviconvg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
          <ToastToaster />
        </Providers>
      </body>
    </html>
  );
}
