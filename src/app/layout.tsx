import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThirdPartyScripts } from "@/components/integrations/third-party-scripts";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { getIntegrationSettings } from "@/lib/integrations";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jojoias.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JoJoias | Semijoias Premium",
    template: "%s | JoJoias",
  },
  description: "Semijoias premium com entrega rápida, compra segura e atendimento especializado.",
  applicationName: "JoJoias",
  keywords: [
    "semijoias",
    "joias femininas",
    "acessórios",
    "joias premium",
    "jojoias",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "JoJoias",
    title: "JoJoias | Semijoias Premium",
    description: "Semijoias premium com entrega rápida, compra segura e atendimento especializado.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JoJoias | Semijoias Premium",
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
      <body suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThirdPartyScripts />
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}

