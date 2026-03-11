import Script from "next/script";
import { getIntegrationSettings } from "@/lib/integrations";

function readPrimaryValue(value: string | null | undefined, fallback?: unknown) {
  if (value && value.trim()) return value.trim();
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
  return "";
}

export async function ThirdPartyScripts() {
  const [googleAnalytics, googleTagManager, microsoftClarity] = await Promise.all([
    getIntegrationSettings("google_analytics"),
    getIntegrationSettings("google_tag_manager"),
    getIntegrationSettings("microsoft_clarity"),
  ]);

  const ga4Id = googleAnalytics?.isEnabled
    ? readPrimaryValue(googleAnalytics.publicKey, googleAnalytics.extraConfig.measurementId)
    : "";
  const gtmId = googleTagManager?.isEnabled
    ? readPrimaryValue(googleTagManager.publicKey, googleTagManager.extraConfig.containerId)
    : "";
  const clarityId = microsoftClarity?.isEnabled
    ? readPrimaryValue(microsoftClarity.publicKey, microsoftClarity.extraConfig.projectId)
    : "";

  if (!ga4Id && !gtmId && !clarityId) {
    return null;
  }

  return (
    <>
      {gtmId ? (
        <>
          <Script
            id="gtm-loader"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      ) : null}

      {ga4Id ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script
            id="ga4-loader"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${ga4Id}');`,
            }}
          />
        </>
      ) : null}

      {clarityId ? (
        <Script
          id="clarity-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, 'clarity', 'script', '${clarityId}');`,
          }}
        />
      ) : null}
    </>
  );
}