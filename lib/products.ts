/* Catalogue, lu depuis l'API Store de Medusa. Les pages l'appellent côté serveur.
   Les champs propres à la boutique (accroche, badge, caractéristiques…) sont
   dans product.metadata et se modifient dans l'admin (« Fiche produit »). */

import type { HttpTypes } from "@medusajs/types";
import { getRegionId, sdk } from "./medusa";
import type { Product, Variant } from "./data";

const FIELDS = [
  "id",
  "handle",
  "title",
  "subtitle",
  "description",
  "thumbnail",
  "metadata",
  "created_at",
  "*images",
  "*categories",
  "*options",
  "*options.values",
  "*variants",
  "*variants.options",
  "*variants.calculated_price",
  "+variants.inventory_quantity",
].join(",");

const COLOR_OPTIONS = ["finition", "couleur", "color"];
const SIZE_OPTIONS = ["dimensions", "taille", "size"];

const text = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function pairs(v: unknown): [string, string][] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is unknown[] => Array.isArray(p) && p.length >= 2)
    .map((p) => [String(p[0]), String(p[1])]);
}

/** Valeurs d'une option, triées (rang puis ordre naturel : 100 avant 120). */
function optionValues(p: HttpTypes.StoreProduct, names: string[]) {
  const option = p.options?.find((o) => names.includes(o.title.toLowerCase()));
  if (!option) return { id: null, values: [] as string[] };
  const values = [...(option.values ?? [])]
    .sort(
      (a, b) =>
        num((a as { rank?: number }).rank ?? 1e9) - num((b as { rank?: number }).rank ?? 1e9) ||
        a.value.localeCompare(b.value, "fr", { numeric: true })
    )
    .map((v) => v.value);
  return { id: option.id, values };
}

function toProduct(p: HttpTypes.StoreProduct): Product {
  const m = (p.metadata ?? {}) as Record<string, unknown>;
  const color = optionValues(p, COLOR_OPTIONS);
  const size = optionValues(p, SIZE_OPTIONS);
  const hex = (m.colors ?? {}) as Record<string, string>;

  const variants: Variant[] = (p.variants ?? []).map((v) => {
    const value = (optionId: string | null) =>
      v.options?.find((o) => o.option_id === optionId)?.value ?? "";
    const cp = v.calculated_price;
    const price = num(cp?.calculated_amount);
    const original = num(cp?.original_amount);
    return {
      id: v.id,
      color: value(color.id),
      size: value(size.id),
      price,
      oldPrice: original > price ? original : null,
      stock: v.manage_inventory === false ? null : num(v.inventory_quantity),
    };
  });

  const cheapest = variants.reduce<Variant | null>((a, v) => (!a || v.price < a.price ? v : a), null);
  const images = (p.images ?? []).map((i) => i.url);
  const category = p.categories?.[0];

  return {
    id: p.handle,
    name: p.title,
    sub: p.subtitle ?? "",
    image: p.thumbnail || images[0] || "",
    images: images.length ? images : p.thumbnail ? [p.thumbnail] : [],
    rating: num(m.rating),
    reviews: num(m.reviews),
    orders: num(m.orders_count),
    category: category?.handle ?? "",
    categoryLabel: category?.name ?? "Bureau",
    price: cheapest?.price ?? 0,
    oldPrice: cheapest?.oldPrice ?? null,
    badge: text(m.badge) || null,
    blurb: text(m.blurb) || p.subtitle || "",
    desc: p.description ?? "",
    colors: color.values.map((name) => ({ name, hex: hex[name] || "#cfcdc4" })),
    sizes: size.values,
    variants,
    specs: pairs(m.specs),
    features: pairs(m.features),
  };
}

/** Tout le catalogue publié, du plus ancien au plus récent (puis par nom). */
export async function getProducts(): Promise<Product[]> {
  const { products } = await sdk.store.product.list({
    region_id: await getRegionId(),
    fields: FIELDS,
    limit: 100,
  });
  return products
    .sort(
      (a, b) =>
        String(a.created_at).localeCompare(String(b.created_at)) || a.title.localeCompare(b.title, "fr")
    )
    .map(toProduct);
}

/** Un produit par son handle, ou null s'il n'existe pas. */
export async function getProduct(handle: string): Promise<Product | null> {
  const { products } = await sdk.store.product.list({
    region_id: await getRegionId(),
    fields: FIELDS,
    handle,
    limit: 1,
  });
  return products[0] ? toProduct(products[0]) : null;
}

export interface Category {
  handle: string;
  name: string;
}

/** Catégories actives, dans l'ordre choisi dans l'admin. */
export async function getCategories(): Promise<Category[]> {
  const { product_categories } = await sdk.store.category.list({ fields: "handle,name,rank", limit: 100 });
  return product_categories
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((c) => ({ handle: c.handle, name: c.name }));
}

/** Le bureau mis en avant : celui marqué « Best-seller », sinon le premier. */
export function featuredProduct(products: Product[]): Product | undefined {
  return products.find((p) => p.badge === "Best-seller") ?? products[0];
}
