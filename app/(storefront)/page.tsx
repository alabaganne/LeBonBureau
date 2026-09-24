/* Landing page — hero, trust strip, catalogue listing, green band,
   "bien choisir" steps, and the contact section. The catalogue is fetched from
   Medusa, so this renders dynamically. */

import Hero from "@/components/sections/Hero";
import TrustBar from "@/components/sections/TrustBar";
import Listing from "@/components/sections/Listing";
import GreenBand from "@/components/sections/GreenBand";
import ErgoSteps from "@/components/sections/ErgoSteps";
import ContactSection from "@/components/sections/ContactSection";
import { featuredProduct, getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const products = await getProducts();
  const featured = featuredProduct(products);
  // Le bandeau vert montre le bureau « Nouveau », sinon un autre que celui du haut.
  const band = products.find((p) => p.badge === "Nouveau") ?? products.find((p) => p !== featured);
  return (
    <>
      <Hero featured={featured} count={products.length} />
      <TrustBar />
      <Listing key={categorie} products={products} initialFilter={categorie} />
      <GreenBand image={band?.images.at(-1)} />
      <ErgoSteps />
      <ContactSection />
    </>
  );
}
