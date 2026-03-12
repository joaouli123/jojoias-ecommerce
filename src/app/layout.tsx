import type { Metadata } from "next";
import { Montserrat, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThirdPartyScripts } from "@/components/integrations/third-party-scripts";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { RecaptchaScript } from "@/components/recaptcha/recaptcha-script";      
import { getIntegrationSettings } from "@/lib/integrations";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Luxijóias | Semijoias Premium",
    template: "%s | Luxijóias",
  },
  description: "Semijoias premium com entrega rápida, compra segura e atendimento especializado.",
  applicationName: "Luxijóias",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.png"],
  },
  keywords: [
    "semijoias",
    "joias femininas",
    "acessórios",
    "joias premium",
    "luxijoias",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Luxijóias",
    title: "Luxijóias | Semijoias Premium",
    description: "Semijoias premium com entrega rápida, compra segura e atendimento especializado.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxijóias | Semijoias Premium",
    description: "Semijoias premium com entrega rápida, compra segura e atendimento especializado.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

function readVerificationToken(value: string | null | undefined, fallback?: unknown) {
  if (value && value.trim()) return value.trim();
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
  return "";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [googleSearchConsole, bingWebmaster] = await Promise.all([
    getIntegrationSettings("google_search_console"),
    getIntegrationSettings("bing_webmaster"),
  ]);

  const googleVerification = googleSearchConsole?.isEnabled
    ? readVerificationToken(googleSearchConsole.publicKey, googleSearchConsole.extraConfig.verificationToken)
    : "";
  const bingVerification = bingWebmaster?.isEnabled
    ? readVerificationToken(bingWebmaster.publicKey, bingWebmaster.extraConfig.verificationToken)
    : "";

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {googleVerification ? <meta name="google-site-verification" content={googleVerification} /> : null}
        {bingVerification ? <meta name="msvalidate.01" content={bingVerification} /> : null}
      </head>
      <body suppressHydrationWarning className={`${montserrat.variable} ${cormorantGaramond.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <RecaptchaScript />
        <ThirdPartyScripts />
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}

