/**
 * Optional privacy-conscious analytics.
 * Set VITE_ANALYTICS_ENDPOINT to a first-party collector URL.
 * Never send names, emails, phones, or message contents.
 */
export function track(event, props = {}) {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  if (!endpoint || typeof event !== "string") return;
  const payload = {
    event,
    props: {
      ...props,
      path: typeof window !== "undefined" ? window.location.pathname : "",
    },
    ts: Date.now(),
  };
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
      return;
    }
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics must never break the page.
  }
}
