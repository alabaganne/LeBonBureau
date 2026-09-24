import crypto from "node:crypto"

// Envoie l'achat confirmé à Meta (Conversions API) pour que les pubs apprennent des vrais acheteurs.

const GRAPH_VERSION = "v24.0"

export type MetaOrder = {
  id: string
  display_id?: number | string | null
  email?: string | null
  total?: unknown
  metadata?: Record<string, unknown> | null
  shipping_address?: {
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    city?: string | null
  } | null
  items?: ({ product_handle?: string | null; quantity?: unknown; unit_price?: unknown } | null)[] | null
}

const hash = (value?: string | null) => {
  const v = (value ?? "").trim().toLowerCase()
  return v ? [crypto.createHash("sha256").update(v).digest("hex")] : undefined
}

// Meta attend le numéro avec l'indicatif, sans + ni espaces : 21622145980.
const tnPhone = (phone?: string | null) => {
  const digits = (phone ?? "").replace(/\D/g, "")
  if (!digits) return undefined
  return digits.length === 8 ? "216" + digits : digits
}

export function metaEnabled() {
  return Boolean(process.env.META_PIXEL_ID && process.env.META_CAPI_TOKEN)
}

export async function sendPurchaseToMeta(order: MetaOrder): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixelId || !token) return

  const a = order.shipping_address ?? {}
  const m = order.metadata ?? {}
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined)

  const event = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: `purchase_${order.id}`,
    action_source: "website",
    event_source_url: str(m.page_url) ?? process.env.STOREFRONT_URL,
    user_data: {
      ph: hash(tnPhone(a.phone)),
      em: hash(order.email),
      fn: hash(a.first_name),
      ln: hash(a.last_name),
      ct: hash((a.city ?? "").replace(/\s+/g, "")),
      country: hash("tn"),
      external_id: hash(order.id),
      fbp: str(m.fbp),
      fbc: str(m.fbc),
      client_user_agent: str(m.user_agent),
    },
    custom_data: {
      currency: "TND",
      value: Number(order.total ?? 0),
      order_id: String(order.display_id ?? order.id),
      content_type: "product",
      contents: (order.items ?? []).filter(Boolean).map((i) => ({
        id: i!.product_handle,
        quantity: Number(i!.quantity ?? 1),
        item_price: Number(i!.unit_price ?? 0),
      })),
    },
  }

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [event],
      ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
    }),
  })
  if (!res.ok) throw new Error(`Meta a refusé l'événement (${res.status}) : ${await res.text()}`)
}
