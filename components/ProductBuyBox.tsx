"use client";

/* Product detail — gallery + buy box with conversion levers:
   social proof (gated on real orders), stock urgency, add-to-cart, and the
   inline cash-on-delivery express order. Plus a sticky mobile order bar. */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatDT, imageOr, GOVERNORATES, type Product } from "@/lib/data";
import { useCart, type AddEntry } from "@/lib/cart";
import { useToast } from "@/lib/toast";
import { placeExpressOrder } from "@/lib/orders";
import { pixel, pixelProduct } from "@/lib/track";
import {
  StarIcon,
  CheckTinyIcon,
  CheckBigIcon,
  BoltIcon,
  CartIcon,
  TruckIcon,
  ClockIcon,
  ShieldIcon,
} from "@/components/Icons";
import Button from "@/components/Button";

type ExpressField = "exName" | "exPhone" | "exGov" | "exCity" | "exAddr";

export default function ProductBuyBox({ product: p }: { product: Product }) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const galleryImg = (i: number) =>
    imageOr(p.images.length ? p.images[i % p.images.length] : p.image, p.name, 900, 675);
  const thumbCount = p.images.length || 3;

  const [mainIdx, setMainIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [showExpress, setShowExpress] = useState(false);
  const [done, setDone] = useState<{ firstName: string; ref: string } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<ExpressField, boolean>>>({});

  const expressRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const color = p.colors[colorIdx]?.name ?? "";
  const size = p.sizes[sizeIdx] ?? "";
  const variant = p.variants.find(
    (v) => (!p.colors.length || v.color === color) && (!p.sizes.length || v.size === size)
  );
  const price = variant?.price ?? p.price;
  const oldPrice = variant ? variant.oldPrice : p.oldPrice;
  const available = Boolean(variant) && (variant!.stock === null || variant!.stock > 0);

  useEffect(() => {
    pixel("ViewContent", pixelProduct(p.id, p.name, p.price));
  }, [p.id, p.name, p.price]);

  // Reveal + focus the express form once it opens.
  useEffect(() => {
    if (showExpress) {
      expressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 350);
      return () => clearTimeout(t);
    }
  }, [showExpress]);

  useEffect(() => {
    if (done) doneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [done]);

  const save = oldPrice ? oldPrice - price : 0;
  const warranty = (p.specs.find((s) => /garantie/i.test(s[0])) || ["", "5 ans"])[1];

  function entry(): AddEntry | null {
    if (!variant || !available) return null;
    return { variantId: variant.id, qty, color, size, categoryLabel: p.categoryLabel };
  }

  async function onAddToCart() {
    const e = entry();
    if (!e || busy) return;
    setBusy(true);
    try {
      await addToCart(e);
      pixel("AddToCart", pixelProduct(p.id, p.name, price, qty));
      toast(`${qty}× ${p.name}${color ? ` (${color})` : ""} ajouté au panier`);
    } catch {
      toast("Impossible d'ajouter au panier. Merci de réessayer.");
    } finally {
      setBusy(false);
    }
  }

  function openExpress() {
    if (!entry()) return;
    setDone(null);
    setShowExpress(true);
    pixel("InitiateCheckout", pixelProduct(p.id, p.name, price, qty));
  }

  function clearError(field: ExpressField) {
    setErrors((e) => ({ ...e, [field]: false }));
  }
  const errStyle = (field: ExpressField) =>
    errors[field] ? { borderColor: "var(--clay)" } : undefined;

  async function onSubmitExpress(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const val = (id: ExpressField) =>
      (form.elements.namedItem(id) as HTMLInputElement | HTMLSelectElement).value.trim();

    const name = val("exName");
    const phone = val("exPhone");
    const gov = val("exGov");
    const city = val("exCity");
    const addr = val("exAddr");
    const digits = phone.replace(/\D/g, "");

    const nextErrors: Partial<Record<ExpressField, boolean>> = {
      exName: !name,
      exPhone: digits.length < 8,
      exGov: !gov,
      exCity: !city,
      exAddr: !addr,
    };
    setErrors(nextErrors);
    const firstBad = (Object.keys(nextErrors) as ExpressField[]).find((k) => nextErrors[k]);
    if (firstBad) {
      (form.elements.namedItem(firstBad) as HTMLElement).focus();
      toast("Merci de compléter les champs obligatoires");
      return;
    }

    const item = entry();
    if (!item || busy) return;
    const parts = name.split(/\s+/);
    const first = parts.shift() || name;
    setBusy(true);
    try {
      const order = await placeExpressOrder(item, {
        firstName: first,
        lastName: parts.join(" "),
        phone,
        email: "",
        address: addr,
        address2: "",
        city,
        gov,
        zip: "",
        landmark: "",
        notes: "",
      });
      setShowExpress(false);
      setDone({ firstName: first, ref: order.ref });
      toast(`Commande ${order.ref} enregistrée`);
    } catch {
      toast("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setBusy(false);
    }
  }

  const showRating = p.rating && p.orders > 9;
  const stock = variant?.stock ?? null;
  const stockLow = stock !== null && stock <= 5;

  return (
    <>
      <main className="pt-6 pb-[70px] max-[720px]:pb-[96px]">
        <div className="wrap grid grid-cols-[1.05fr_.95fr] gap-[56px] items-start max-[960px]:grid-cols-1 max-[960px]:gap-[34px]">
          {/* Gallery */}
          <div className="sticky top-[92px] max-[960px]:static">
            <div className="rounded-card-lg overflow-hidden aspect-[4/3] bg-sand-deep border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={galleryImg(mainIdx)} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-[12px] mt-[14px]">
              {Array.from({ length: thumbCount }, (_, i) => (
                <button
                  key={i}
                  className={"rounded-[12px] overflow-hidden aspect-square border-2 bg-sand-deep cursor-pointer p-0 " + (i === mainIdx ? "border-green" : "border-transparent")}
                  onClick={() => setMainIdx(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={galleryImg(i)} alt={`${p.name} vue ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <span className="text-[12px] tracking-[.14em] uppercase font-semibold text-green">{p.categoryLabel}</span>
            <h1 className="text-[clamp(34px,4.4vw,52px)] leading-[1.02] mt-[12px] mb-[8px]">{p.name}</h1>

            {showRating && (
              <div className="flex items-center gap-[10px] mb-[14px]">
                <span className="inline-flex gap-px text-[#e0a106]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <StarIcon key={i} filled={i <= Math.round(p.rating)} />
                  ))}
                </span>
                <span className="font-bold text-[15px]">{p.rating.toFixed(1)}</span>
                <span className="text-[13.5px] text-ink-faint">
                  {p.reviews} avis · {p.orders} commandés
                </span>
              </div>
            )}

            <p className="text-[18px] text-ink-soft mt-0 mb-6">{p.sub}</p>

            <div className="flex items-baseline gap-[12px] mb-[6px]">
              <span className="text-[34px] font-bold tracking-[-.02em]">{formatDT(price)}</span>
              {oldPrice && <span className="text-[19px] text-ink-faint line-through">{formatDT(oldPrice)}</span>}
              {save > 0 && <span className="text-[13px] font-bold text-white bg-clay px-[10px] py-[4px] rounded-full">− {formatDT(save)}</span>}
            </div>
            <p className="text-[13.5px] text-ink-faint mt-0 mb-[26px]">TVA comprise · Livraison offerte partout en Tunisie</p>

            <div className={"inline-flex items-center gap-2 text-[14px] font-semibold mb-6 " + (stockLow || !available ? "text-clay" : "text-green")}>
              <span className={"w-[8px] h-[8px] rounded-full flex-none " + (stockLow || !available ? "bg-clay shadow-[0_0_0_4px_#f6e7e0]" : "bg-green shadow-[0_0_0_4px_var(--color-green-soft)]")} />
              {!available
                ? "Indisponible dans cette version — choisissez une autre finition ou dimension"
                : stockLow
                  ? `Plus que ${stock} en stock — expédié sous 48 h`
                  : "En stock · expédié sous 48 h"}
            </div>

            <p className="text-ink-soft text-[16.5px] leading-[1.6] mt-0 mb-[30px] max-w-[50ch]">{p.desc}</p>

            {p.colors.length > 0 && <div className="mb-[26px]">
              <div className="flex justify-between items-baseline text-[14px] font-semibold mb-[12px]">
                Finition <span className="text-ink-soft font-medium">{color}</span>
              </div>
              <div className="flex gap-[12px]">
                {p.colors.map((c, i) => (
                  <button
                    key={c.name}
                    className={"w-[44px] h-[44px] rounded-full border-2 p-[3px] bg-white cursor-pointer transition-[border-color,transform] duration-150 ease-[ease] hover:-translate-y-[2px] " + (i === colorIdx ? "border-ink" : "border-line")}
                    title={c.name}
                    aria-label={c.name}
                    onClick={() => setColorIdx(i)}
                  >
                    <span style={{ background: c.hex }} className="block w-full h-full rounded-full" />
                  </button>
                ))}
              </div>
            </div>}

            {p.sizes.length > 0 && <div className="mb-[26px]">
              <div className="flex justify-between items-baseline text-[14px] font-semibold mb-[12px]">
                Dimensions <span className="text-ink-soft font-medium">{size}</span>
              </div>
              <div className="flex flex-wrap gap-[10px]">
                {p.sizes.map((s, i) => (
                  <button
                    key={s}
                    className={"border rounded-[10px] px-[18px] py-[11px] text-[14.5px] font-medium transition-all duration-150 ease-[ease] " + (i === sizeIdx ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft hover:border-ink hover:text-ink")}
                    onClick={() => setSizeIdx(i)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>}

            <div className="flex gap-[14px] items-stretch mt-[30px] mb-6 max-[560px]:flex-wrap">
              <div className="flex items-center border border-line rounded-full overflow-hidden">
                <button type="button" aria-label="Moins" className="w-[46px] h-[52px] border-none bg-white text-[20px] text-ink hover:bg-sand" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  –
                </button>
                <span className="min-w-[38px] text-center font-semibold text-[16px]">{qty}</span>
                <button type="button" aria-label="Plus" className="w-[46px] h-[52px] border-none bg-white text-[20px] text-ink hover:bg-sand" onClick={() => setQty((q) => Math.min(9, q + 1))}>
                  +
                </button>
              </div>
              <Button variant="primary" size="lg" style={{ flex: 1 }} onClick={openExpress} disabled={!available} className={available ? "" : "opacity-60 cursor-not-allowed"}>
                Commander maintenant
              </Button>
            </div>
            <Button variant="ghost" size="lg" block style={{ marginBottom: 6 }} onClick={onAddToCart} disabled={!available || busy} className={available ? "" : "opacity-60 cursor-not-allowed"}>
              <CartIcon size={18} strokeWidth={1.9} />
              Ajouter au panier
            </Button>
            <p className="flex items-start gap-2 text-[13.5px] text-ink-soft mt-[4px] mb-6 [&_svg]:text-green [&_svg]:flex-none [&_svg]:mt-[2px] [&_strong]:text-ink">
              <CheckTinyIcon size={15} />
              Paiement <strong>à la livraison</strong> — aucune avance, vous payez à réception.
            </p>

            {/* Inline express order (COD) */}
            {showExpress && (
              <div className="border-[1.5px] border-green bg-[linear-gradient(var(--color-green-soft),#fff_120px)] rounded-card-lg px-6 pt-6 pb-[24px] mt-[4px] mb-6" ref={expressRef}>
                <div className="mb-[16px]">
                  <div className="flex items-center gap-2 font-serif text-[21px] text-green-deep [&_svg]:text-green">
                    <BoltIcon size={18} />
                    Commande express
                  </div>
                  <span className="block text-[13px] text-ink-soft mt-[4px]">Sans compte · 2 minutes · payez à la livraison</span>
                </div>
                <div className="flex items-center gap-[13px] bg-white border border-line rounded-[12px] pt-[10px] pr-[14px] pb-[10px] pl-[10px] mb-[16px]">
                  <div className="w-[52px] h-[44px] rounded-[8px] overflow-hidden bg-sand-deep flex-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={galleryImg(0)} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 leading-[1.3]">
                    <div className="font-bold text-[15px]">{p.name}</div>
                    <div className="text-[12.5px] text-ink-soft">
                      {[color, size].filter(Boolean).join(" · ")} · Qté {qty}
                    </div>
                  </div>
                  <div className="font-serif text-[18px] font-semibold whitespace-nowrap">{formatDT(price * qty)}</div>
                </div>
                <form onSubmit={onSubmitExpress} noValidate>
                  <div className="grid grid-cols-2 gap-x-[16px] gap-y-[14px] mb-[16px] max-[720px]:grid-cols-1">
                    <div className="flex flex-col gap-[7px] col-span-2">
                      <label htmlFor="exName" className="text-[13.5px] font-semibold text-ink">Nom complet <span className="text-clay">*</span></label>
                      <input
                        id="exName" name="exName" ref={nameRef} type="text" autoComplete="name"
                        placeholder="Mohamed Ben Ali" style={errStyle("exName")}
                        onChange={() => clearError("exName")}
                        className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-[12px] transition-[border-color,box-shadow] duration-150 ease-[ease] focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay"
                      />
                    </div>
                    <div className="flex flex-col gap-[7px] col-span-2">
                      <label htmlFor="exPhone" className="text-[13.5px] font-semibold text-ink">Téléphone <span className="text-clay">*</span></label>
                      <div className="flex items-stretch">
                        <span className="inline-flex items-center px-[13px] bg-sand border border-line border-r-0 rounded-l-[11px] text-[14.5px] font-semibold text-ink-soft">🇹🇳 +216</span>
                        <input
                          id="exPhone" name="exPhone" type="tel" inputMode="numeric"
                          autoComplete="tel-national" placeholder="20 123 456"
                          style={errStyle("exPhone")} onChange={() => clearError("exPhone")}
                          className="[font-family:inherit] text-[15px] text-ink bg-white border border-line px-[14px] py-[12px] transition-[border-color,box-shadow] duration-150 ease-[ease] focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay rounded-l-none rounded-r-[11px] flex-1"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-[7px]">
                      <label htmlFor="exGov" className="text-[13.5px] font-semibold text-ink">Gouvernorat <span className="text-clay">*</span></label>
                      <select
                        id="exGov" name="exGov" defaultValue="" style={errStyle("exGov")}
                        onChange={() => clearError("exGov")}
                        className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-[12px] transition-[border-color,box-shadow] duration-150 ease-[ease] focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)]"
                      >
                        <option value="" disabled>Choisir…</option>
                        {GOVERNORATES.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-[7px]">
                      <label htmlFor="exCity" className="text-[13.5px] font-semibold text-ink">Ville <span className="text-clay">*</span></label>
                      <input
                        id="exCity" name="exCity" type="text" autoComplete="address-level2"
                        placeholder="La Marsa" style={errStyle("exCity")}
                        onChange={() => clearError("exCity")}
                        className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-[12px] transition-[border-color,box-shadow] duration-150 ease-[ease] focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay"
                      />
                    </div>
                    <div className="flex flex-col gap-[7px] col-span-2">
                      <label htmlFor="exAddr" className="text-[13.5px] font-semibold text-ink">Adresse de livraison <span className="text-clay">*</span></label>
                      <input
                        id="exAddr" name="exAddr" type="text" autoComplete="street-address"
                        placeholder="N° et rue, résidence, étage…" style={errStyle("exAddr")}
                        onChange={() => clearError("exAddr")}
                        className="[font-family:inherit] text-[15px] text-ink bg-white border border-line rounded-[11px] px-[14px] py-[12px] transition-[border-color,box-shadow] duration-150 ease-[ease] focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-soft)] [&:invalid:not(:placeholder-shown)]:border-clay"
                      />
                    </div>
                  </div>
                  <Button variant="primary" size="lg" block type="submit" style={{ marginTop: 4 }} disabled={busy}>
                    {busy ? "Envoi…" : "Valider ma commande"}
                  </Button>
                  <p className="text-[12.5px] text-ink-faint text-center mt-[14px]" style={{ marginTop: 12 }}>
                    En validant, vous acceptez nos{" "}
                    <a href="/mentions-legales#cgv" style={{ color: "var(--green)", textDecoration: "underline" }}>
                      conditions de vente
                    </a>.
                  </p>
                </form>
              </div>
            )}

            {/* Inline confirmation */}
            {done && (
              <div className="text-center border-[1.5px] border-green bg-green-soft rounded-card-lg pt-[30px] px-[24px] pb-[28px] mt-[4px] mb-6" ref={doneRef}>
                <div className="w-[60px] h-[60px] rounded-full bg-green text-white grid place-items-center mt-0 mx-auto mb-[16px] shadow-[0_10px_26px_-10px_rgba(31,93,76,.5)]"><CheckBigIcon size={30} /></div>
                <h3 className="text-[23px] mb-[8px]">Merci {done.firstName}, commande confirmée !</h3>
                <p className="text-ink-soft text-[14.5px] mt-0 mx-auto mb-[16px] max-w-[38ch]">Merci, nous vous appelons très vite pour convenir d&apos;un créneau de livraison.</p>
                <div className="font-serif text-[20px] font-semibold text-green-deep mb-[20px]">{done.ref}</div>
                <div>
                  <Button href="/#catalogue" variant="dark">Continuer mes achats</Button>
                </div>
              </div>
            )}

            <div className="grid gap-[12px] border-t border-line pt-6 [&_svg]:text-green [&_svg]:flex-none">
              <div className="flex gap-[11px] items-center text-[14.5px] text-ink-soft"><TruckIcon size={19} />Livraison offerte partout en Tunisie, suivi en temps réel</div>
              <div className="flex gap-[11px] items-center text-[14.5px] text-ink-soft"><ClockIcon size={19} />30 jours pour changer d&apos;avis, retour gratuit</div>
              <div className="flex gap-[11px] items-center text-[14.5px] text-ink-soft"><ShieldIcon size={19} /><span>Garantie {warranty.toLowerCase()}</span></div>
            </div>
          </div>
        </div>
      </main>

    </>
  );
}
