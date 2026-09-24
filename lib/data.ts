/* LeBonBureau — types du catalogue et petits outils (prix, images).
   Les produits eux-mêmes viennent de Medusa (voir lib/products.ts). */

export interface Color {
  name: string;
  hex: string;
}

/** Une déclinaison achetable : une finition × une dimension. */
export interface Variant {
  id: string;
  color: string;
  size: string;
  price: number;
  oldPrice: number | null;
  /** null quand Medusa ne suit pas le stock de cette déclinaison. */
  stock: number | null;
}

export interface Product {
  /** Le handle Medusa, utilisé dans l'URL /product/[id]. */
  id: string;
  name: string;
  sub: string;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  /** Nombre de commandes non annulées (preuve sociale). */
  orders: number;
  category: string;
  categoryLabel: string;
  price: number;
  oldPrice: number | null;
  badge: string | null;
  blurb: string;
  desc: string;
  colors: Color[];
  sizes: string[];
  variants: Variant[];
  specs: [string, string][];
  features: [string, string][];
}

/** Les 24 gouvernorats, pour les formulaires de livraison. */
export const GOVERNORATES = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
  "Kairouan", "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba",
  "Médenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana",
  "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan",
];

/** Photo Pexels (images fixes de la page d'accueil). */
export function img(id: number, w?: number, h?: number): string {
  let u =
    "https://images.pexels.com/photos/" +
    id +
    "/pexels-photo-" +
    id +
    ".jpeg?auto=compress&cs=tinysrgb&fit=crop&w=" +
    (w || 800);
  if (h) u += "&h=" + h;
  return u;
}

interface PlaceholderOpts {
  w?: number;
  h?: number;
  bg?: string;
  stripe?: string;
  ink?: string;
  fs?: number;
}

/** Visuel rayé de secours pour un produit sans photo. */
export function placeholder(label: string, opts: PlaceholderOpts = {}): string {
  const w = opts.w || 800;
  const h = opts.h || 600;
  const bg = opts.bg || "#efece4";
  const stripe = opts.stripe || "#e3dfd4";
  const ink = opts.ink || "#9a978c";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">` +
    `<defs><pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<rect width="16" height="16" fill="${bg}"/>` +
    `<rect width="8" height="16" fill="${stripe}"/></pattern></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#p)"/>` +
    `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ` +
    `font-family="ui-monospace, Menlo, monospace" font-size="${opts.fs || 22}" letter-spacing="1" fill="${ink}">${label}</text>` +
    `</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/** Image d'un produit ou d'une ligne du panier, avec le visuel de secours. */
export function imageOr(url: string | null | undefined, name: string, w?: number, h?: number): string {
  return url || placeholder((name || "BUREAU").toUpperCase(), { w, h });
}

/** Prix en dinars — ex. 1529 → "1 529 DT". */
export function formatDT(n: number): string {
  return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " DT";
}
