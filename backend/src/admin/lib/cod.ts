import { sdk } from "./sdk"

// Suivi des commandes payées à la livraison : nouvelle → vue → appelée → livrée (ou annulée).

export type CodStatus = "nouvelle" | "vue" | "appelee" | "livree" | "annulee"
type BadgeColor = "grey" | "blue" | "orange" | "green" | "red" | "purple"

export const STATUS: Record<CodStatus, { label: string; color: BadgeColor }> = {
  nouvelle: { label: "Nouvelle", color: "orange" },
  vue: { label: "Vue", color: "blue" },
  appelee: { label: "Appelée", color: "purple" },
  livree: { label: "Livrée", color: "green" },
  annulee: { label: "Annulée", color: "grey" },
}

export const STEPS: CodStatus[] = ["nouvelle", "vue", "appelee", "livree"]

type OrderLike = { status?: string; metadata?: Record<string, unknown> | null }

export function codStatus(order: OrderLike): CodStatus {
  if (order.status === "canceled") return "annulee"
  const s = order.metadata?.cod_status
  return typeof s === "string" && s in STATUS ? (s as CodStatus) : "nouvelle"
}

export function orderRef(displayId?: number | null) {
  return "#LBB-" + (displayId ?? "")
}

export function setCodStatus(orderId: string, status: CodStatus) {
  return sdk.client.fetch<{ status: CodStatus; meta_error?: string }>(
    `/admin/orders/${orderId}/cod-status`,
    { method: "POST", body: { status } }
  )
}
