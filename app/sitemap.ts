import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/faq", "/livraison-retours", "/mentions-legales"].map((path) => ({
    url: SITE_URL + path,
    changeFrequency: "weekly" as const,
    priority: path ? 0.4 : 1,
  }));
  const products = await getProducts().catch(() => []);
  return [
    ...pages,
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.id}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
