/* Shared chrome for every storefront page: sticky nav + footer. */

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

// Le pied de page lit les catégories dans Medusa à chaque visite.
export const dynamic = "force-dynamic";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
