/**
 * Типобезопасная обёртка аналитики конверсии.
 * Провайдер подключим позже; сейчас события пишутся в console (dev)
 * и складываются в window.__deleEvents для отладки.
 */

export type AnalyticsEvent =
  | { name: "landing_view" }
  | { name: "hero_customer_cta_click" }
  | { name: "hero_profile_assistance_click" }
  | { name: "business_section_view" }
  | { name: "business_registration_click" }
  | { name: "subscription_cta_click"; plan?: string }
  | { name: "emergency_cta_click" }
  | { name: "faq_open"; question: string }
  | { name: "registration_started"; role: "customer" | "contractor" }
  | { name: "registration_completed"; role: "customer" | "contractor" }
  | { name: "profile_created" }
  | { name: "contractor_registration_started" }
  | { name: "contractor_registration_completed" }
  | { name: "request_type_selected"; type: string }
  | { name: "request_drafted"; type: string }
  | { name: "request_published"; type: string }
  | { name: "offer_accepted" }
  | { name: "offer_compare_opened"; count: number };

type EventContext = {
  source?: string;
  section?: string;
  [key: string]: string | number | boolean | undefined;
};

declare global {
  interface Window {
    __deleEvents?: Array<{
      event: AnalyticsEvent;
      context?: EventContext;
      ts: number;
    }>;
  }
}

export function track(event: AnalyticsEvent, context?: EventContext) {
  if (typeof window === "undefined") return;

  (window.__deleEvents ??= []).push({ event, context, ts: Date.now() });

  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event.name, { ...event, ...context });
  }
}

/** Строит URL регистрации с ролью, источником и (опц.) отложенным действием. */
export function registerUrl(opts: {
  role: "customer" | "contractor";
  section?: string;
  next?: string;
}): string {
  const params = new URLSearchParams({ role: opts.role, source: "landing" });
  if (opts.section) params.set("section", opts.section);
  if (opts.next) params.set("next", opts.next);
  return `/register?${params.toString()}`;
}
