import { GA_MEASUREMENT_ID } from "@/lib/constants";

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined") return;

  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", name, params);
}
