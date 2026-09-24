/* Product detail page. Fetched from Medusa per request; the interactive buy
   box is a client island, while crumbs/specs/related render on the server. */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/products";
import type { Product } from "@/lib/data";
import ProductBuyBox from "@/components/ProductBuyBox";
import ProductCard from "@/components/ProductCard";
import { CheckIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) return { title: "Produit introuvable" };
  return {
    title: p.name,
    description: p.blurb,
    alternates: { canonical: `/product/${p.id}` },
    openGraph: { title: p.name, description: p.blurb, images: p.images.slice(0, 1) },
  };
}

/** Données structurées Google (prix, stock) pour les résultats enrichis.
    Pas de note : Google exige de vrais avis clients. */
function productJsonLd(p: Product) {
  const inStock = p.variants.some((v) => v.stock === null || v.stock > 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.desc || p.blurb,
    image: p.images,
    sku: p.id,
    category: p.categoryLabel,
    brand: { "@type": "Brand", name: "LeBonBureau" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "TND",
      lowPrice: Math.min(...p.variants.map((v) => v.price)),
      highPrice: Math.max(...p.variants.map((v) => v.price)),
      offerCount: p.variants.length,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) notFound();

  const related = (await getProducts()).filter((x) => x.id !== p.id).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(p)).replace(/</g, "\\u003c") }}
      />
      <div className="wrap">
        <nav className="pt-[26px] pb-[6px] text-[14px] text-ink-faint flex gap-[8px] items-center">
          <Link href="/" className="hover:text-ink">Accueil</Link>
          <span className="opacity-50">/</span>
          <Link href="/#catalogue" className="hover:text-ink">Catalogue</Link>
          <span className="opacity-50">/</span>
          <span>{p.name}</span>
        </nav>
      </div>

      <ProductBuyBox product={p} />

      {/* SPECS + FEATURES */}
      <section className="bg-sand border-t border-line py-[72px]">
        <div className="wrap grid grid-cols-2 gap-[56px] max-[960px]:grid-cols-1 max-[960px]:gap-[40px]">
          <div>
            <h2 className="text-[30px] leading-[1.06] mb-6">Caractéristiques</h2>
            <table className="w-full border-collapse">
              <tbody>
                {p.specs.map(([k, v]) => (
                  <tr key={k} className="border-b border-line">
                    <td className="py-[15px] text-[15.5px] text-ink-soft">{k}</td>
                    <td className="py-[15px] text-[15.5px] text-right font-semibold">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-[30px] leading-[1.06] mb-6">Points forts</h2>
            <div className="grid gap-[16px]">
              {p.features.map(([title, body]) => (
                <div className="bg-white border border-line rounded-card px-6 py-[20px] flex gap-[16px] items-start" key={title}>
                  <div className="flex-none w-[42px] h-[42px] rounded-[11px] bg-green-soft text-green grid place-items-center"><CheckIcon size={20} strokeWidth={1.9} /></div>
                  <div>
                    <h4 className="font-sans text-[16px] font-bold mt-0 mb-[4px]">{title}</h4>
                    <p className="text-[14.5px] text-ink-soft m-0">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RELATED */}
      <section className="pt-[72px] pb-[30px]">
        <div className="wrap">
          <h2 className="text-[30px] leading-[1.06] mb-[26px]">Vous aimerez aussi</h2>
          <div className="grid grid-cols-3 gap-[26px] max-[960px]:grid-cols-2 max-[560px]:grid-cols-1">
            {related.map((rp) => (
              <ProductCard key={rp.id} product={rp} imgWidth={600} imgHeight={450} lazy={false} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
