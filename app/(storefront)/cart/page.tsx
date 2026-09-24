"use client";

/* Cart page — line items with live quantity/remove, sticky order summary,
   and an empty state. */

import Link from "next/link";
import { formatDT, imageOr } from "@/lib/data";
import { useCart, type CartItem } from "@/lib/cart";
import { useToast } from "@/lib/toast";
import Button from "@/components/Button";
import { ArrowLeftIcon, PlusIcon, TrashIcon, CartIcon, LockIcon } from "@/components/Icons";

export default function CartPage() {
  const { items, ready, qty, total, setItemQty, removeItem, clearCart } = useCart();
  const { toast } = useToast();

  const heading = qty > 0 ? `Mon panier · ${qty} article${qty > 1 ? "s" : ""}` : "Mon panier";

  // En cas d'échec (réseau, stock), on prévient au lieu de laisser le panier figé.
  const safely = (action: Promise<void>, done?: string) =>
    action.then(() => done && toast(done)).catch(() => toast("Action impossible. Merci de réessayer."));

  function CartRow({ it }: { it: CartItem }) {
    const cat = it.categoryLabel || "Bureau";
    return (
      <div className="grid grid-cols-[104px_1fr_auto] gap-5 items-center py-6 border-b border-line first:pt-1 max-[560px]:grid-cols-[80px_1fr] max-[560px]:gap-[14px] max-[560px]:[grid-template-areas:'thumb_info'_'right_right']">
        <div className="w-[104px] h-[84px] rounded-[12px] overflow-hidden bg-sand-deep border border-line max-[560px]:w-20 max-[560px]:h-[70px] max-[560px]:[grid-area:thumb]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageOr(it.image, it.name, 320, 240)} alt={it.name} className="w-full h-full object-cover" />
        </div>
        <div className="max-[560px]:[grid-area:info]">
          <div className="text-[11.5px] tracking-[.12em] uppercase font-semibold text-green">{cat}</div>
          <div className="font-serif text-6 leading-[1.1] mt-[3px] mb-[6px]">{it.name}</div>
          <div className="text-[13.5px] text-ink-soft flex flex-wrap gap-x-[14px] gap-y-[6px]">
            {it.color && <span>Finition&nbsp;: <b className="text-ink font-semibold">{it.color}</b></span>}
            {it.size && <span>Dimensions&nbsp;: <b className="text-ink font-semibold">{it.size}</b></span>}
          </div>
          <div className="text-[13px] text-ink-faint mt-2">{formatDT(it.price)} / l&apos;unité</div>
        </div>
        <div className="flex flex-col items-end gap-3 max-[560px]:[grid-area:right] max-[560px]:flex-row max-[560px]:items-center max-[560px]:justify-between max-[560px]:w-full">
          <div className="text-[20px] font-bold tracking-[-.01em] whitespace-nowrap">{formatDT(it.price * it.qty)}</div>
          <div className="flex items-center gap-[14px]">
            <div className="border border-line rounded-full inline-flex items-center overflow-hidden">
              <button type="button" aria-label="Diminuer" className="w-[36px] h-10 border-0 bg-white text-[18px] text-ink hover:bg-sand" onClick={() => safely(setItemQty(it.id, it.qty - 1))}>–</button>
              <span className="min-w-[30px] text-center font-semibold text-[15px]">{it.qty}</span>
              <button type="button" aria-label="Augmenter" className="w-[36px] h-10 border-0 bg-white text-[18px] text-ink hover:bg-sand" onClick={() => safely(setItemQty(it.id, it.qty + 1))}>+</button>
            </div>
            <button
              className="inline-flex items-center gap-1.5 border-0 bg-transparent text-ink-faint text-[13px] font-medium p-1.5 transition-colors duration-150 hover:text-clay"
              onClick={() => safely(removeItem(it.id), `${it.name} retiré du panier`)}
            >
              <TrashIcon size={15} />
              Retirer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wrap pt-10 pb-2">
        <Link className="inline-flex items-center gap-[7px] text-[14px] font-medium text-ink-soft mb-[18px] transition-colors duration-150 hover:text-ink" href="/#catalogue">
          <ArrowLeftIcon size={16} />
          Continuer mes achats
        </Link>
        <span className="eyebrow mb-3 block">Votre panier</span>
        <h1 className="text-[clamp(32px,4vw,48px)] leading-[1.04]">{heading}</h1>
      </div>

      {!ready ? (
        <main className="wrap" style={{ minHeight: 240 }} />
      ) : items.length === 0 ? (
        <main className="wrap" style={{ paddingBottom: 80 }}>
          <div className="text-center pt-[70px] px-6 pb-20 border border-dashed border-line rounded-card-lg bg-sand">
            <div className="w-16 h-16 rounded-full bg-white border border-line grid place-items-center mx-auto mb-6 text-ink-faint"><CartIcon size={28} strokeWidth={1.6} /></div>
            <h2 className="font-serif text-[28px] mb-2.5">Votre panier est vide</h2>
            <p className="text-ink-soft mx-auto mb-[26px] max-w-[38ch]">
              Parcourez notre sélection de bureaux ergonomiques et trouvez celui qui tiendra la
              distance.
            </p>
            <Button href="/#catalogue" variant="primary" size="lg">Voir le catalogue</Button>
          </div>
        </main>
      ) : (
        <main className="wrap grid grid-cols-[1.6fr_.9fr] gap-10 items-start pt-7 pb-20 max-[980px]:grid-cols-1">
          <div>
            <div className="flex flex-col gap-0">
              {items.map((it) => (
                <CartRow key={it.id} it={it} />
              ))}
            </div>
            <div className="flex justify-between items-center mt-6 flex-wrap gap-[14px]">
              <Link className="inline-flex items-center gap-[7px] text-[14px] font-medium text-ink-soft mb-[18px] transition-colors duration-150 hover:text-ink" href="/#catalogue" style={{ margin: 0 }}>
                <PlusIcon size={16} />
                Ajouter un autre bureau
              </Link>
              <button
                className="inline-flex items-center gap-1.5 border-0 bg-transparent text-ink-faint text-[13px] font-medium p-1.5 transition-colors duration-150 hover:text-clay"
                style={{ fontSize: 13.5 }}
                onClick={() => {
                  clearCart();
                  toast("Panier vidé");
                }}
              >
                Vider le panier
              </button>
            </div>
          </div>

          <aside className="sticky top-[92px] bg-sand border border-line rounded-card-lg pt-[26px] px-[26px] pb-[28px] max-[980px]:static">
            <h3 className="font-serif text-6 mb-[18px]">Récapitulatif</h3>
            <div className="flex justify-between items-baseline text-[15px] py-[9px] text-ink-soft">
              <span>Sous-total</span>
              <span className="text-ink font-semibold">{formatDT(total)}</span>
            </div>
            <div className="flex justify-between items-baseline text-[15px] py-[9px] text-ink-soft">
              <span>Livraison <span style={{ color: "var(--ink-faint)" }}>· Tunisie</span></span>
              <span className="text-green font-bold">Gratuite</span>
            </div>
            <hr className="border-0 border-t border-line my-3" />
            <div className="flex justify-between items-baseline pt-[6px] pb-[18px]">
              <span className="font-semibold text-[16px]">Total</span>
              <span className="font-serif text-[28px] font-semibold tracking-[-.01em] whitespace-nowrap">{formatDT(total)}</span>
            </div>
            <Button href="/checkout" variant="primary" size="lg" block>Passer la commande</Button>
            <p className="text-[12.5px] text-ink-faint mt-[14px] flex gap-2 items-start">
              <LockIcon size={15} className="flex-none text-green mt-px" />
              Paiement à la livraison. Vos données restent confidentielles.
            </p>
          </aside>
        </main>
      )}
    </>
  );
}
