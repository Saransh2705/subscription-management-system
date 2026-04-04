import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@/index.css";

export const metadata: Metadata = {
  title: "Sublytics",
  description: "Sublytics AI Studio",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
