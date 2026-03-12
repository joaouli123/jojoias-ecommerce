"use client";

import { useState, useSyncExternalStore } from "react";
import Script from "next/script";
import { getTrackingConsent, setTrackingConsent, type TrackingConsent } from "@/lib/analytics";

type TrackingScriptsProps = {
  ga4Id: string;
  gtmId: string;
  clarityId: string;
};

export function TrackingScripts({ ga4Id, gtmId, clarityId }: TrackingScriptsProps) {
  const [consent, setConsent] = useState<TrackingConsent | null>(() => getTrackingConsent());
  const isHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const shouldLoadTracking = consent === "accepted";
  const shouldLoadDirectGa4 = shouldLoadTracking && Boolean(ga4Id) && !gtmId;
  const shouldLoadGtm = shouldLoadTracking && Boolean(gtmId);
  const shouldLoadClarity = shouldLoadTracking && Boolean(clarityId);

  return (
    <>
      {shouldLoadGtm ? (
        <Script
          id="gtm-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      ) : null}

      {shouldLoadDirectGa4 ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script
            id="ga4-loader"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} window.gtag = gtag; gtag('js', new Date()); gtag('config', '${ga4Id}');`,
            }}
          />
        </>
      ) : null}

      {shouldLoadClarity ? (
        <Script
          id="clarity-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, 'clarity', 'script', '${clarityId}');`,
          }}
        />
      ) : null}

      {isHydrated && consent === null ? (
        <div className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-xl rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.35)]">
          <p className="text-sm font-semibold text-[#1A1A1A]">Privacidade e medição</p>
          <p className="mt-2 text-sm leading-6 text-[#666666]">
            Usamos analytics para medir navegação, checkout e conversão. Os scripts só são carregados se você aceitar.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setTrackingConsent("rejected");
                setConsent("rejected");
              }}
              className="inline-flex h-11 items-center justify-center rounded-[18px] border border-zinc-200 px-4 text-sm font-semibold text-[#666666] transition-colors hover:bg-[#FFFFFF]"
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => {
                setTrackingConsent("accepted");
                setConsent("accepted");
              }}
              className="inline-flex h-11 items-center justify-center rounded-[18px] bg-[#111111] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#111111]/90"
            >
              Aceitar analytics
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}