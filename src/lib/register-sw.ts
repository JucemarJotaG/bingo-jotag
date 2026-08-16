const SW_URL = "/sw.js";

function refused(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  if (h === "lovableproject.com" || h.endsWith(".lovableproject.com")) return true;
  if (h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com")) return true;
  if (h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).has("sw")) {
    return new URLSearchParams(window.location.search).get("sw") === "off";
  }
  return false;
}

export async function registerAppServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (refused()) {
    const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
    await Promise.allSettled(
      regs
        .filter((r) => (r.active?.scriptURL ?? "").endsWith(SW_URL))
        .map((r) => r.unregister()),
    );
    return;
  }
  await navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {});
}
