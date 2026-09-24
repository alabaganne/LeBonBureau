/* LeBonBureau — shared storefront footer (server component; catalogue links come from Medusa). */

import Link from "next/link";
import { getCategories } from "@/lib/products";
import { FacebookIcon, InstagramIcon } from "./Icons";

export default async function SiteFooter() {
  // Le pied de page ne doit pas casser la page si Medusa ne répond pas.
  const categories = await getCategories().catch(() => []);
  return (
    <footer className="bg-ink text-[#cfcdc4] mt-2">
      <div className="wrap grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-10 pt-[72px] pb-14 max-[860px]:grid-cols-2 max-[860px]:gap-8 max-[560px]:grid-cols-1">
        <div>
          <div className="inline-flex items-baseline gap-0.5 font-serif text-[26px] font-semibold tracking-[-.02em] text-white">
            Le<span className="text-green" style={{ color: "var(--green)" }}>Bon</span>Bureau
            <span style={{ color: "var(--green)" }}>.</span>
          </div>
          <p className="text-[#8c8a80] text-[15px] max-w-[30ch] mt-4">
            La sélection tunisienne de bureaux ergonomiques pour gamers, développeurs et créatifs
            exigeants.
          </p>
          <div className="flex gap-3 mt-5">
            <a
              className="grid place-items-center w-[38px] h-[38px] border border-[rgba(255,255,255,.16)] rounded-full text-[#cfcdc4] transition-[background-color,color,border-color] duration-150 ease-[ease] hover:bg-white hover:text-ink hover:border-white"
              href="https://facebook.com/lebonbureau"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FacebookIcon />
            </a>
            <a
              className="grid place-items-center w-[38px] h-[38px] border border-[rgba(255,255,255,.16)] rounded-full text-[#cfcdc4] transition-[background-color,color,border-color] duration-150 ease-[ease] hover:bg-white hover:text-ink hover:border-white"
              href="https://instagram.com/lebonbureau"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>
        <div>
          <h4 className="font-sans text-[13px] tracking-[.12em] uppercase text-[#8c8a80] font-semibold mb-[18px]">Catalogue</h4>
          <ul className="list-none m-0 p-0 flex flex-col gap-[11px] text-[15px]">
            {categories.map((c) => (
              <li key={c.handle}>
                <Link className="transition-colors duration-150 ease-[ease] hover:text-white" href={`/?categorie=${c.handle}#catalogue`}>{c.name}</Link>
              </li>
            ))}
            <li><Link className="transition-colors duration-150 ease-[ease] hover:text-white" href="/#catalogue">Tous les bureaux</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-[13px] tracking-[.12em] uppercase text-[#8c8a80] font-semibold mb-[18px]">Aide</h4>
          <ul className="list-none m-0 p-0 flex flex-col gap-[11px] text-[15px]">
            <li><Link className="transition-colors duration-150 ease-[ease] hover:text-white" href="/faq">FAQ</Link></li>
            <li><Link className="transition-colors duration-150 ease-[ease] hover:text-white" href="/livraison-retours">Livraison &amp; retours</Link></li>
            <li><Link className="transition-colors duration-150 ease-[ease] hover:text-white" href="/faq#dimensions">Guide des tailles</Link></li>
            <li><Link className="transition-colors duration-150 ease-[ease] hover:text-white" href="/faq#montage">Montage</Link></li>
            <li><Link className="transition-colors duration-150 ease-[ease] hover:text-white" href="/#contact">Nous contacter</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-[13px] tracking-[.12em] uppercase text-[#8c8a80] font-semibold mb-[18px]">Maison</h4>
          <ul className="list-none m-0 p-0 flex flex-col gap-[11px] text-[15px]">
            <li><Link className="transition-colors duration-150 ease-[ease] hover:text-white" href="/#engagements">Nos engagements</Link></li>
            <li><Link className="transition-colors duration-150 ease-[ease] hover:text-white" href="/#ergonomie">Ergonomie</Link></li>
            <li><Link className="transition-colors duration-150 ease-[ease] hover:text-white" href="/mentions-legales#cgv">CGV</Link></li>
          </ul>
        </div>
      </div>
      <div className="wrap border-t border-[rgba(255,255,255,.1)] pt-6 pb-10 flex justify-between text-[13.5px] text-[#8c8a80]">
        <span>© 2026 LeBonBureau — Tous droits réservés.</span>
        <span>
          Paiement à la livraison ·{" "}
          <a
            className="text-[#cfcdc4] transition-colors duration-150 ease-[ease] hover:text-white"
            href="/admin"
            style={{ textDecoration: "underline" }}
          >
            Espace pro
          </a>
        </span>
      </div>
    </footer>
  );
}
