/* Suivi marketing côté navigateur : événements Meta Pixel + origine du visiteur.
   L'origine (UTM, site référent, clic Facebook) est jointe à la commande,
   pour savoir dans l'admin d'où vient chaque vente. */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const SOURCE_KEY = "lbb_source";
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

type Source = Partial<Record<(typeof UTM)[number] | "referrer" | "landing_page" | "fbclid_at" | "fbclid", string>>;

function readSource(): Source {
  try {
    return JSON.parse(localStorage.getItem(SOURCE_KEY) || "{}") as Source;
  } catch {
    return {};
  }
}

/** À l'arrivée sur le site : garde la dernière source non directe (pub, lien externe…). */
export function captureSource(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(location.search);
  let ref = "";
  try {
    if (document.referrer && new URL(document.referrer).host !== location.host) ref = document.referrer;
  } catch {
    /* référent illisible */
  }
  const hasUtm = UTM.some((k) => params.get(k));
  const fbclid = params.get("fbclid");
  if (!hasUtm && !ref && !fbclid) return;

  const src: Source = { landing_page: location.pathname, referrer: ref || undefined };
  UTM.forEach((k) => {
    const v = params.get(k);
    if (v) src[k] = v;
  });
  if (fbclid) {
    src.fbclid = fbclid;
    src.fbclid_at = String(Date.now());
  }
  try {
    localStorage.setItem(SOURCE_KEY, JSON.stringify(src));
  } catch {
    /* navigation privée : tant pis */
  }
}

function cookie(name: string): string | undefined {
  return document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))?.[1];
}

/** Infos jointes à la commande (metadata) : origine + identifiants Meta pour la Conversions API. */
export function trackingContext(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const { fbclid, fbclid_at, ...src } = readSource();
  const fbc = cookie("_fbc") || (fbclid ? `fb.1.${fbclid_at}.${fbclid}` : undefined);
  const out: Record<string, string | undefined> = {
    ...src,
    fbp: cookie("_fbp"),
    fbc,
    user_agent: navigator.userAgent,
    page_url: location.href,
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v)) as Record<string, string>;
}

/** Événement standard Meta Pixel (sans effet si le pixel n'est pas configuré). */
export function pixel(event: string, params?: Record<string, unknown>): void {
  if (typeof window !== "undefined" && window.fbq) window.fbq("track", event, params);
}

/** Paramètres produit communs à ViewContent / AddToCart / InitiateCheckout. */
export function pixelProduct(handle: string, name: string, price: number, qty = 1) {
  return {
    content_ids: [handle],
    content_name: name,
    content_type: "product",
    contents: [{ id: handle, quantity: qty, item_price: price }],
    value: price * qty,
    currency: "TND",
  };
}
