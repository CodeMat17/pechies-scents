import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Providers } from "@/components/Providers";
import { SITE_NAME, SITE_URL, TAGLINE } from "@/lib/store";
import { KEYWORDS } from "@/lib/seo";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const description =
  "Premium oud perfumes, oil perfumes, body mists and body sprays with nationwide delivery across Nigeria — Lagos, Abuja, Port Harcourt, Ibadan, Enugu and every state. Order easily on WhatsApp.";

const homeTitle = "Pe’chies Scents — Oud & Oil Perfumes, Body Mists & Sprays in Nigeria";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: homeTitle, template: `%s | Pe’chies Scents` },
  description,
  keywords: KEYWORDS,
  applicationName: SITE_NAME,
  category: "shopping",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${TAGLINE}`,
    description,
    url: SITE_URL,
    locale: "en_NG",
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description },
  appleWebApp: { capable: true, title: "Pe’chies", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${cormorant.variable} antialiased`}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
