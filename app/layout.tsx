import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Montserrat } from "next/font/google";
import "./globals.css";
import { config } from "../lib/config";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display-raw" });
const body = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body-raw" });

const title = `${config.campaign} Flyer Generator · ${config.brandFull}`;
const description =
  "Create your personalised Christophilia’26 flyer with your photo, name and address. Free, instant, and private: nothing leaves your device.";

export const metadata: Metadata = {
  metadataBase: config.siteUrl ? new URL(config.siteUrl) : undefined,
  title,
  description,
  openGraph: { title, description, type: "website", images: ["/og.jpg"] },
  twitter: { card: "summary_large_image", title, description, images: ["/og.jpg"] },
};

export const viewport: Viewport = { themeColor: config.colors.primary, width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
