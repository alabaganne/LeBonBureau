"use client";

/* LeBonBureau — panier. Il vit dans Medusa ; le navigateur ne garde que son id
   (localStorage "lbb_cart_id"). useCart() expose le même contrat qu'avant. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { HttpTypes } from "@medusajs/types";
import { getRegionId, sdk } from "./medusa";

export interface CartItem {
  /** Id de la ligne dans le panier Medusa. */
  id: string;
  productId: string;
  name: string;
  color: string;
  size: string;
  price: number;
  qty: number;
  image?: string;
  categoryLabel?: string;
}

export interface AddEntry {
  variantId: string;
  qty: number;
  color: string;
  size: string;
  categoryLabel: string;
}

const CART_KEY = "lbb_cart_id";

function toItem(i: HttpTypes.StoreCartLineItem): CartItem {
  const m = (i.metadata ?? {}) as Record<string, unknown>;
  const [vColor = "", vSize = ""] = (i.variant_title ?? "").split(" / ");
  return {
    id: i.id,
    productId: i.product_handle ?? "",
    name: i.product_title ?? i.title,
    color: typeof m.color === "string" ? m.color : vColor,
    size: typeof m.size === "string" ? m.size : vSize,
    price: Number(i.unit_price),
    qty: i.quantity,
    image: i.thumbnail ?? undefined,
    categoryLabel: typeof m.category === "string" ? m.category : undefined,
  };
}

interface CartContextValue {
  items: CartItem[];
  /** Panier chargé ? Évite un compteur faux au premier rendu. */
  ready: boolean;
  cartId: string | null;
  qty: number;
  total: number;
  addToCart: (entry: AddEntry) => Promise<void>;
  setItemQty: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null);
  const [ready, setReady] = useState(false);
  const cartId = useRef<string | null>(null);

  const clearCart = useCallback(() => {
    cartId.current = null;
    try {
      localStorage.removeItem(CART_KEY);
    } catch {
      /* rien à nettoyer */
    }
    setCart(null);
  }, []);

  const keep = useCallback((c: HttpTypes.StoreCart) => {
    cartId.current = c.id;
    try {
      localStorage.setItem(CART_KEY, c.id);
    } catch {
      /* navigation privée : le panier vivra le temps de l'onglet */
    }
    setCart(c);
  }, []);

  // Recharge le panier enregistré au premier affichage.
  useEffect(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(CART_KEY);
    } catch {
      /* pas de stockage */
    }
    if (!id) {
      setReady(true);
      return;
    }
    sdk.store.cart
      .retrieve(id)
      .then(({ cart: c }) => (c.completed_at ? clearCart() : keep(c)))
      .catch(clearCart)
      .finally(() => setReady(true));
  }, [clearCart, keep]);

  const creating = useRef<Promise<string> | null>(null);
  const ensureCart = useCallback(async () => {
    if (cartId.current) return cartId.current;
    // Deux clics rapides ne doivent pas créer deux paniers.
    creating.current ??= getRegionId()
      .then((region_id) => sdk.store.cart.create({ region_id }))
      .then(({ cart: c }) => {
        keep(c);
        return c.id;
      })
      .finally(() => {
        creating.current = null;
      });
    return creating.current;
  }, [keep]);

  const addToCart = useCallback(
    async (e: AddEntry) => {
      const line = {
        variant_id: e.variantId,
        quantity: e.qty,
        metadata: { color: e.color, size: e.size, category: e.categoryLabel },
      };
      const id = await ensureCart();
      try {
        keep((await sdk.store.cart.createLineItem(id, line)).cart);
      } catch (e) {
        // Panier disparu ou déjà commandé : on en crée un neuf. Toute autre erreur (stock…) remonte.
        const alive = await sdk.store.cart
          .retrieve(id, { fields: "id,completed_at" })
          .then(({ cart: c }) => !c.completed_at)
          .catch(() => false);
        if (alive) throw e;
        clearCart();
        keep((await sdk.store.cart.createLineItem(await ensureCart(), line)).cart);
      }
    },
    [clearCart, ensureCart, keep]
  );

  const setItemQty = useCallback(
    async (itemId: string, qty: number) => {
      if (!cartId.current) return;
      const quantity = Math.max(1, Math.min(9, qty));
      keep((await sdk.store.cart.updateLineItem(cartId.current, itemId, { quantity })).cart);
    },
    [keep]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!cartId.current) return;
      const { parent } = await sdk.store.cart.deleteLineItem(cartId.current, itemId);
      if (parent) keep(parent);
    },
    [keep]
  );

  const items = useMemo(
    () =>
      [...(cart?.items ?? [])]
        .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
        .map(toItem),
    [cart]
  );
  const qty = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const total = useMemo(() => items.reduce((n, i) => n + i.price * i.qty, 0), [items]);

  const value: CartContextValue = {
    items,
    ready,
    cartId: cart?.id ?? null,
    qty,
    total,
    addToCart,
    setItemQty,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
