/* Passage de commande via Medusa : adresse → livraison offerte → paiement à la
   livraison → commande. Le suivi (vue, appelée, livrée) se fait dans l'admin Medusa. */

import { getRegionId, sdk } from "./medusa";
import { trackingContext } from "./track";
import type { AddEntry } from "./cart";

export interface Delivery {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  address2: string;
  city: string;
  gov: string;
  zip: string;
  landmark: string;
  notes: string;
}

export interface PlacedOrder {
  id: string;
  ref: string;
  total: number;
}

/** Fournisseur « manuel » de Medusa : aucun paiement en ligne, on encaisse à la livraison. */
const COD_PROVIDER = "pp_system_default";

export function orderRef(displayId: number | string): string {
  return "#LBB-" + displayId;
}

/** Transforme le panier en commande payée à la livraison. */
export async function placeOrder(
  cartId: string,
  d: Delivery,
  opts: { express?: boolean } = {}
): Promise<PlacedOrder> {
  const address = {
    first_name: d.firstName,
    last_name: d.lastName,
    phone: "+216 " + d.phone.trim(),
    address_1: d.address,
    address_2: d.address2,
    city: d.city,
    province: d.gov,
    postal_code: d.zip,
    country_code: "tn",
  };
  const extra = { landmark: d.landmark, notes: d.notes, express: opts.express ? true : undefined };
  const metadata = Object.fromEntries(
    Object.entries({ ...trackingContext(), ...extra }).filter(([, v]) => v !== "" && v !== undefined)
  );

  await sdk.store.cart.update(cartId, {
    ...(d.email ? { email: d.email } : {}),
    shipping_address: address,
    billing_address: address,
    metadata,
  });

  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: cartId });
  if (!shipping_options[0]) throw new Error("Aucune option de livraison configurée dans Medusa.");
  const { cart } = await sdk.store.cart.addShippingMethod(cartId, { option_id: shipping_options[0].id });

  await sdk.store.payment.initiatePaymentSession(cart, { provider_id: COD_PROVIDER });

  const res = await sdk.store.cart.complete(cartId);
  if (res.type !== "order") throw new Error(res.error?.message || "La commande n'a pas pu être validée.");
  return { id: res.order.id, ref: orderRef(res.order.display_id ?? ""), total: Number(res.order.total) };
}

/** Commande express depuis la fiche produit : un panier à part, qui ne touche pas au panier en cours. */
export async function placeExpressOrder(entry: AddEntry, d: Delivery): Promise<PlacedOrder> {
  const { cart } = await sdk.store.cart.create({ region_id: await getRegionId() });
  await sdk.store.cart.createLineItem(cart.id, {
    variant_id: entry.variantId,
    quantity: entry.qty,
    metadata: { color: entry.color, size: entry.size, category: entry.categoryLabel },
  });
  return placeOrder(cart.id, d, { express: true });
}
