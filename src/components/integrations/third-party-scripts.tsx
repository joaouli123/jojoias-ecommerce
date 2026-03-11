import { getIntegrationSettings } from "@/lib/integrations";
import { TrackingScripts } from "@/components/integrations/tracking-scripts";

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

  return <TrackingScripts ga4Id={ga4Id} gtmId={gtmId} clarityId={clarityId} />;
}