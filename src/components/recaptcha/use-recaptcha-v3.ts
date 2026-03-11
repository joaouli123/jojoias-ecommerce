"use client";

import { useCallback } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function waitForRecaptcha(timeout = 10000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    if (window.grecaptcha) {
      return window.grecaptcha;
    }

    await sleep(120);
  }

  throw new Error("reCAPTCHA ainda não carregou. Tente novamente em instantes.");
}

export function useRecaptchaV3() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
  const enabled = Boolean(siteKey);

  const execute = useCallback(async (action: string) => {
    if (!enabled) {
      return "";
    }

    const grecaptcha = await waitForRecaptcha();

    return new Promise<string>((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha.execute(siteKey, { action }).then(resolve).catch(() => {
          reject(new Error("Não foi possível validar a proteção do formulário."));
        });
      });
    });
  }, [enabled, siteKey]);

  return {
    enabled,
    execute,
  };
}