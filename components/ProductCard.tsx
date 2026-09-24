/* LeBonBureau — product card. Used by the landing listing and "Vous aimerez
   aussi" related grid. Links through to the product detail page. */

import Link from "next/link";
import { formatDT, imageOr, type Product } from "@/lib/data";
import { ArrowRightIcon } from "./Icons";

interface ProductCardProps {
  product: Product;
  imgWidth?: number;
  imgHeight?: number;
  lazy?: boolean;
}

export default function ProductCard({
  product: p,
  imgWidth = 800,
  imgHeight = 600,
  lazy = true,
}: ProductCardProps) {
  return (
    <Link className="group flex flex-col shadow-sm bg-white rounded-card-lg overflow-hidden transition-all duration-150 ease-[ease] hover:-translate-y-1 hover:shadow-lift" href={`/product/${p.id}`}>
      <div className="relative aspect-4/3 bg-sand-deep overflow-hidden">
        {p.badge && <span className={"absolute top-4 left-4 text-white text-[11.5px] font-bold tracking-[.06em] uppercase px-3 py-1.5 rounded-full " + (p.oldPrice ? "bg-clay" : "bg-ink")}>{p.badge}</span>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="w-full h-full object-cover transition-transform duration-[.4s] ease-[ease]"
          src={imageOr(p.image, p.name, imgWidth, imgHeight)}
          alt={p.name}
          loading={lazy ? "lazy" : undefined}
        />
      </div>
      <div className="px-6 pt-5 pb-6 flex flex-col gap-2.5 flex-1">
        <span className="text-xs tracking-[.12em] uppercase font-semibold text-green">{p.categoryLabel}</span>
        <h3 className="font-serif text-[25px] leading-[1.05]">{p.name}</h3>
        <p className="text-ink-soft text-[14.5px] leading-normal flex-1">{p.blurb}</p>
        <div className="flex items-end justify-between mt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-6 font-bold tracking-[-.01em]">{formatDT(p.price)}</span>
            {p.oldPrice && <span className="text-[15px] text-ink-faint line-through">{formatDT(p.oldPrice)}</span>}
          </div>
          <span className="w-10 h-10 rounded-full border border-line grid place-items-center transition-[background,color,border-color] duration-[.18s] ease-[ease] text-ink group-hover:bg-green group-hover:text-white group-hover:border-green" aria-hidden="true">
            <ArrowRightIcon size={17} />
          </span>
        </div>
      </div>
    </Link>
  );
}
