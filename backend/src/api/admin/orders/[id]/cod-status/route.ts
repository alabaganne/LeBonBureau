import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  cancelOrderWorkflow,
  capturePaymentWorkflow,
  completeOrderWorkflow,
  createOrderFulfillmentWorkflow,
  markOrderFulfillmentAsDeliveredWorkflow,
  updateOrderWorkflow,
} from "@medusajs/medusa/core-flows"
import { metaEnabled, sendPurchaseToMeta } from "../../../../../lib/meta-capi"

const STATUSES = ["nouvelle", "vue", "appelee", "livree", "annulee"] as const
type CodStatus = (typeof STATUSES)[number]

async function loadOrder(container: MedusaContainer, id: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "total",
      "metadata",
      "shipping_address.*",
      "items.id",
      "items.quantity",
      "items.unit_price",
      "items.product_handle",
      "items.detail.fulfilled_quantity",
      "fulfillments.id",
      "fulfillments.canceled_at",
      "fulfillments.delivered_at",
      "payment_collections.payments.id",
      "payment_collections.payments.captured_at",
      "payment_collections.payments.canceled_at",
    ],
    filters: { id },
  })
  if (!data[0]) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Commande introuvable")
  return data[0]
}

// Livrée = colis remis et argent encaissé : on expédie, on marque livré, on encaisse, on clôt.
async function deliver(container: MedusaContainer, orderId: string, userId: string) {
  let order = await loadOrder(container, orderId)

  const toShip = (order.items ?? [])
    .map((i) => ({ id: i!.id, quantity: Number(i!.quantity) - Number(i!.detail?.fulfilled_quantity ?? 0) }))
    .filter((i) => i.quantity > 0)
  if (toShip.length) {
    await createOrderFulfillmentWorkflow(container).run({
      input: { order_id: orderId, items: toShip, created_by: userId },
    })
    order = await loadOrder(container, orderId)
  }

  for (const f of order.fulfillments ?? []) {
    if (f && !f.canceled_at && !f.delivered_at) {
      await markOrderFulfillmentAsDeliveredWorkflow(container).run({
        input: { orderId, fulfillmentId: f.id },
      })
    }
  }

  const payments = (order.payment_collections ?? []).flatMap((pc) => pc?.payments ?? [])
  for (const p of payments) {
    if (p && !p.captured_at && !p.canceled_at) {
      await capturePaymentWorkflow(container).run({ input: { payment_id: p.id, captured_by: userId } })
    }
  }

  await completeOrderWorkflow(container).run({ input: { orderIds: [orderId] } })
}

export async function POST(req: AuthenticatedMedusaRequest<{ status?: string }>, res: MedusaResponse) {
  const status = req.body?.status as CodStatus
  if (!STATUSES.includes(status)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Statut inconnu")
  }
  const userId = req.auth_context.actor_id
  const orderId = req.params.id

  if (status === "annulee") {
    // Une commande annulée ne se modifie plus ; son statut se lit sur order.status.
    await cancelOrderWorkflow(req.scope).run({ input: { order_id: orderId, canceled_by: userId } })
    return res.json({ status })
  }
  if (status === "livree") await deliver(req.scope, orderId, userId)

  const order = await loadOrder(req.scope, orderId)
  const metadata: Record<string, unknown> = { ...(order.metadata ?? {}), cod_status: status }

  // Le client a confirmé au téléphone : c'est l'achat qu'on déclare à Meta, une seule fois.
  let metaError: string | undefined
  if (status === "appelee" && metaEnabled() && !metadata.meta_purchase_sent_at) {
    try {
      await sendPurchaseToMeta(order)
      metadata.meta_purchase_sent_at = new Date().toISOString()
    } catch (e) {
      metaError = (e as Error).message
      req.scope.resolve(ContainerRegistrationKeys.LOGGER).warn(metaError)
    }
  }

  await updateOrderWorkflow(req.scope).run({ input: { id: orderId, user_id: userId, metadata } })
  res.json({ status, meta_error: metaError })
}
