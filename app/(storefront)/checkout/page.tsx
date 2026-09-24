"use client";

/* Checkout — three-step delivery form (coordinates, address, payment) with a
   live order summary, validation, and an inline confirmation screen. */

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDT, GOVERNORATES, imageOr } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";
import { placeOrder } from "@/lib/orders";
import { pixel } from "@/lib/track";
import Button from "@/components/Button";
import { ArrowLeftIcon, LockIcon, CheckBigIcon } from "@/components/Icons";

interface Confirmation {
  firstName: string;
  num: string;
  addr: string;
  phone: string;
  pay: string;
  itemsCount: number;
  total: number;
}

const REQUIRED = ["firstName", "lastName", "phone", "address", "city", "gov", "zip"] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, qty, total, clearCart, cartId } = useCart();
  const { toast } = useToast();

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const checkoutSent = useRef(false);

  useEffect(() => {
    if (!ready || !items.length || checkoutSent.current) return;
    checkoutSent.current = true;
    pixel("InitiateCheckout", {
      content_ids: items.map((i) => i.productId),
      content_type: "product",
      contents: items.map((i) => ({ id: i.productId, quantity: i.qty, item_price: i.price })),
      num_items: qty,
      value: total,
      currency: "TND",
    });
  }, [ready, items, qty, total]);

  // Empty cart → back to cart (unless we just confirmed an order).
  useEffect(() => {
    if (ready && items.length === 0 && !confirmation) router.replace("/cart");
  }, [ready, items.length, confirmation, router]);

  const err = (id: string): CSSProperties | undefined =>
    errors[id] ? { borderColor: "var(--clay)" } : undefined;
  const clearError = (id: string) => setErrors((e) => (e[id] ? { ...e, [id]: false } : e));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (id: string) =>
      (form.elements.namedItem(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
        .value;

    const next: Record<string, boolean> = {};
    let firstBad: string | null = null;
    REQUIRED.forEach((id) => {
      const bad = !get(id).trim();
      next[id] = bad;
      if (bad && !firstBad) firstBad = id;
    });

    const phoneDigits = get("phone").replace(/\D/g, "");
    if (phoneDigits.length < 8) {
      next.phone = true;
      if (!firstBad) firstBad = "phone";
    }
    if (!/^\d{4}$/.test(get("zip").trim())) {
      next.zip = true;
      if (!firstBad) firstBad = "zip";
    }
    const email = get("email").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = true;
      if (!firstBad) firstBad = "email";
    }

    setErrors(next);
    if (firstBad) {
      const el = form.elements.namedItem(firstBad) as HTMLElement;
      el.focus({ preventScroll: true });
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
      toast("Merci de compléter les champs obligatoires");
      return;
    }

    const data = {
      firstName: get("firstName").trim(),
      lastName: get("lastName").trim(),
      phone: get("phone").trim(),
      email,
      address: get("address").trim(),
      address2: get("address2").trim(),
      city: get("city").trim(),
      gov: get("gov"),
      zip: get("zip").trim(),
      landmark: get("landmark").trim(),
      notes: get("notes").trim(),
    };

    if (!cartId || busy) return;
    setBusy(true);
    let order;
    try {
      order = await placeOrder(cartId, data);
    } catch {
      toast("Une erreur est survenue lors de l'envoi. Merci de réessayer.");
      setBusy(false);
      return;
    }

    setConfirmation({
      firstName: data.firstName,
      num: order.ref,
      addr:
        data.address +
        (data.address2 ? ", " + data.address2 : "") +
        " — " +
        data.city +
        ", " +
        data.gov +
        " " +
        data.zip,
      phone: "+216 " + data.phone,
      pay: "À la livraison (espèces)",
      itemsCount: qty,
      total: order.total,
    });
    clearCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (confirmation) {
    return (
      <div className="wrap max-w-[620px] mx-auto text-center pt-[30px] pb-[90px]">
        <div className="w-[76px] h-[76px] rounded-full bg-green text-white grid place-items-center mx-auto mb-[26px] shadow-[0_10px_30px_-10px_rgba(31,93,76,.5)]">
          <CheckBigIcon size={36} />
        </div>
        <h1 className="text-[clamp(30px,4vw,44px)] mb-3">Merci, {confirmation.firstName} commande est confirmée&nbsp;!</h1>
        <p className="text-[18px] text-ink-soft mx-auto mb-7 max-w-[46ch]">
          Nous vous appelons très vite au numéro indiqué pour convenir d&apos;un créneau de
          livraison à domicile.
        </p>
        <div className="border border-line rounded-card-lg bg-sand px-7 py-[26px] text-left mb-7">
          <div className="flex justify-between py-2 text-[15px]"><span className="text-ink-soft">Numéro de commande</span><span className="font-serif text-6 font-semibold text-green">{confirmation.num}</span></div>
          <hr className="border-0 border-t border-line my-3" />
          <div className="flex justify-between py-2 text-[15px]"><span className="text-ink-soft">Livraison à</span><span className="font-semibold">{confirmation.addr}</span></div>
          <div className="flex justify-between py-2 text-[15px]"><span className="text-ink-soft">Téléphone</span><span className="font-semibold">{confirmation.phone}</span></div>
          <div className="flex justify-between py-2 text-[15px]"><span className="text-ink-soft">Paiement</span><span className="font-semibold">{confirmation.pay}</span></div>
          <div className="flex justify-between py-2 text-[15px]"><span className="text-ink-soft">Articles</span><span className="font-semibold">{confirmation.itemsCount} article{confirmation.itemsCount > 1 ? "s" : ""}</span></div>
          <hr className="border-0 border-t border-line my-3" />
          <div className="flex justify-between py-2 text-[15px]"><span className="text-ink-soft">Total</span><span className="font-semibold">{formatDT(confirmation.total)}</span></div>
        </div>
        <Button href="/" variant="primary" size="lg">Retour à l&apos;accueil</Button>
      </div>
    );
  }

  if (!ready || items.length === 0) {
    return <div className="wrap" style={{ minHeight: 320 }} />;
  }

  return (
    <>
      <div className="wrap pt-10 pb-2">
        <Link className="inline-flex items-center gap-[7px] text-[14px] font-medium text-ink-soft mb-[18px] transition-colors duration-150 hover:text-ink" href="/cart">
          <ArrowLeftIcon size={16} />
          Retour au panier
        </Link>
        <span className="eyebrow mb-3 block">Finaliser ma commande</span>
        <h1 className="text-[clamp(32px,4vw,48px)] leading-[1.04]">Livraison &amp; paiement</h1>
      </div>

      <form className="wrap grid grid-cols-[1.55fr_.95fr] gap-10 items-start pt-5 pb-20 max-[980px]:grid-cols-1" onSubmit={onSubmit} noValidate>
        <div>
          <div className="flex items-center gap-2 text-[13px] bg-green-soft text-green-deep px-4 py-2.5 rounded-full w-fit mb-6 font-semibold">
            <LockIcon size={15} strokeWidth={1.9} />
            Vos informations sont chiffrées et confidentielles
          </div>

          {/* 1. Coordonnées */}
          <section className="bg-white border border-line rounded-card-lg px-8 py-[30px] mb-6">
            <div className="flex items-center gap-[14px] mb-6">
              <span className="w-[34px] h-[34px] flex-none rounded-full bg-green text-white font-bold text-[15px] grid place-items-center">1</span>
              <h2 className="font-serif text-[23px]">Vos coordonnées</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-[18px] gap-y-[16px]">
              <div className="flex flex-col gap-[7px]">
                <label htmlFor="firstName" className="text-[13.5px] font-semibold text-ink">Prénom <span className="text-clay">*</span></label>
                <input id="firstName" name="firstName" type="text" autoComplete="given-name" placeholder="Mohamed" className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay" style={err("firstName")} onChange={() => clearError("firstName")} />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label htmlFor="lastName" className="text-[13.5px] font-semibold text-ink">Nom <span className="text-clay">*</span></label>
                <input id="lastName" name="lastName" type="text" autoComplete="family-name" placeholder="Ben Ali" className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay" style={err("lastName")} onChange={() => clearError("lastName")} />
              </div>
              <div className="flex flex-col gap-[7px] col-span-full">
                <label htmlFor="phone" className="text-[13.5px] font-semibold text-ink">Téléphone <span className="text-clay">*</span></label>
                <div className="flex items-stretch">
                  <span className="inline-flex items-center px-[13px] bg-sand border border-line border-r-0 rounded-l-[11px] text-[14.5px] font-semibold text-ink-soft">🇹🇳 +216</span>
                  <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="20 123 456" className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-l-none rounded-r-[11px] px-[14px] py-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay flex-1" style={err("phone")} onChange={() => clearError("phone")} />
                </div>
                <span className="text-[12.5px] text-ink-faint">Nous vous appelons pour confirmer le créneau de livraison.</span>
              </div>
              <div className="flex flex-col gap-[7px] col-span-full">
                <label htmlFor="email" className="text-[13.5px] font-semibold text-ink">E-mail <span className="text-ink-faint font-medium">(optionnel)</span></label>
                <input id="email" name="email" type="email" autoComplete="email" placeholder="vous@exemple.tn" className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay" style={err("email")} onChange={() => clearError("email")} />
                <span className="text-[12.5px] text-ink-faint">Pour recevoir la confirmation et le suivi de commande.</span>
              </div>
            </div>
          </section>

          {/* 2. Adresse de livraison */}
          <section className="bg-white border border-line rounded-card-lg px-8 py-[30px] mb-6">
            <div className="flex items-center gap-[14px] mb-6">
              <span className="w-[34px] h-[34px] flex-none rounded-full bg-green text-white font-bold text-[15px] grid place-items-center">2</span>
              <h2 className="font-serif text-[23px]">Adresse de livraison</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-[18px] gap-y-[16px]">
              <div className="flex flex-col gap-[7px] col-span-full">
                <label htmlFor="address" className="text-[13.5px] font-semibold text-ink">Adresse <span className="text-clay">*</span></label>
                <input id="address" name="address" type="text" autoComplete="address-line1" placeholder="N° et rue — ex. 12 Avenue Habib Bourguiba" className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay" style={err("address")} onChange={() => clearError("address")} />
              </div>
              <div className="flex flex-col gap-[7px] col-span-full">
                <label htmlFor="address2" className="text-[13.5px] font-semibold text-ink">Complément d&apos;adresse <span className="text-ink-faint font-medium">(optionnel)</span></label>
                <input id="address2" name="address2" type="text" autoComplete="address-line2" placeholder="Appartement, étage, résidence, bloc…" className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay" />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label htmlFor="city" className="text-[13.5px] font-semibold text-ink">Ville / Localité <span className="text-clay">*</span></label>
                <input id="city" name="city" type="text" autoComplete="address-level2" placeholder="Ex. La Marsa" className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay" style={err("city")} onChange={() => clearError("city")} />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label htmlFor="gov" className="text-[13.5px] font-semibold text-ink">Gouvernorat <span className="text-clay">*</span></label>
                <select id="gov" name="gov" defaultValue="" className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)]" style={err("gov")} onChange={() => clearError("gov")}>
                  <option value="" disabled>Choisir…</option>
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-[7px]">
                <label htmlFor="zip" className="text-[13.5px] font-semibold text-ink">Code postal <span className="text-clay">*</span></label>
                <input id="zip" name="zip" type="text" inputMode="numeric" autoComplete="postal-code" placeholder="2078" maxLength={4} className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay" style={err("zip")} onChange={() => clearError("zip")} />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label htmlFor="landmark" className="text-[13.5px] font-semibold text-ink">Point de repère <span className="text-ink-faint font-medium">(optionnel)</span></label>
                <input id="landmark" name="landmark" type="text" placeholder="Près de…" className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay" />
              </div>
              <div className="flex flex-col gap-[7px] col-span-full">
                <label htmlFor="notes" className="text-[13.5px] font-semibold text-ink">Instructions de livraison <span className="text-ink-faint font-medium">(optionnel)</span></label>
                <textarea id="notes" name="notes" placeholder="Horaires de présence, accès, étage sans ascenseur, etc." className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] resize-y min-h-[80px]" />
              </div>
            </div>
          </section>

          {/* 3. Paiement */}
          <section className="bg-white border border-line rounded-card-lg px-8 py-[30px] mb-6">
            <div className="flex items-center gap-[14px] mb-6">
              <span className="w-[34px] h-[34px] flex-none rounded-full bg-green text-white font-bold text-[15px] grid place-items-center">3</span>
              <h2 className="font-serif text-[23px]">Mode de paiement</h2>
            </div>
            <div className="grid gap-3">
              <label className="flex gap-[14px] items-start border border-green bg-green-soft rounded-[13px] px-[18px] py-4 cursor-pointer transition-[border-color,background] duration-150">
                <input type="radio" name="payment" value="cod" defaultChecked className="mt-[3px] accent-green w-[18px] h-[18px]" />
                <div>
                  <div className="font-semibold text-[15.5px]">Paiement à la livraison</div>
                  <div className="text-[13.5px] text-ink-soft mt-0.5">Réglez en espèces au livreur, à réception de votre bureau.</div>
                </div>
              </label>
              <label className="flex gap-[14px] items-start border border-dashed border-line rounded-[13px] px-[18px] py-4 cursor-not-allowed transition-[border-color,background] duration-150 opacity-60 bg-sand">
                <input type="radio" name="payment" value="card" disabled className="mt-[3px] accent-green w-[18px] h-[18px] cursor-not-allowed" />
                <div>
                  <div className="font-semibold text-[15.5px]">Carte bancaire <span className="inline-block text-[11px] font-bold tracking-[.04em] uppercase text-ink-soft bg-sand-deep border border-line rounded-full px-[9px] py-0.5 ml-1.5 align-middle">Bientôt disponible</span></div>
                  <div className="text-[13.5px] text-ink-soft mt-0.5">Visa, Mastercard, e-Dinar. Paiement sécurisé en ligne.</div>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="sticky top-[92px] bg-sand border border-line rounded-card-lg pt-[26px] px-[26px] pb-[28px] max-[980px]:static max-[980px]:order-[-1]">
          <h3 className="font-serif text-6 mb-[18px]">Votre commande</h3>
          <ul className="list-none mb-4 p-0 grid gap-3">
            {items.map((it) => (
              <li key={it.id} className="flex gap-3 items-center text-[14px]">
                <div className="w-[46px] h-[46px] rounded-[9px] overflow-hidden bg-sand-deep flex-none border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageOr(it.image, it.name, 160, 160)} alt={it.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 leading-[1.3]">
                  <div className="font-semibold">
                    {it.name} <span style={{ color: "var(--ink-faint)", fontWeight: 500 }}>×{it.qty}</span>
                  </div>
                  <div className="text-ink-faint text-[12.5px]">{[it.color, it.size].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="font-semibold whitespace-nowrap">{formatDT(it.price * it.qty)}</div>
              </li>
            ))}
          </ul>
          <hr className="border-0 border-t border-line my-3" />
          <div className="flex justify-between items-baseline text-[15px] py-[9px] text-ink-soft"><span>Sous-total</span><span className="text-ink font-semibold">{formatDT(total)}</span></div>
          <div className="flex justify-between items-baseline text-[15px] py-[9px] text-ink-soft">
            <span>Livraison <span style={{ color: "var(--ink-faint)" }}>· Tunisie</span></span>
            <span className="text-green font-bold">Gratuite</span>
          </div>
          <hr className="border-0 border-t border-line my-3" />
          <div className="flex justify-between items-baseline pt-[6px] pb-[18px]"><span className="font-semibold text-[16px]">Total à payer</span><span className="font-serif text-[28px] font-semibold tracking-[-.01em] whitespace-nowrap">{formatDT(total)}</span></div>
          <div className="mt-1">
            <Button variant="primary" size="lg" block type="submit" disabled={busy}>{busy ? "Envoi…" : "Confirmer la commande"}</Button>
            <p className="text-[12.5px] text-ink-faint text-center mt-[14px]">En confirmant, vous acceptez nos conditions générales de vente.</p>
          </div>
        </aside>
      </form>
    </>
  );
}
