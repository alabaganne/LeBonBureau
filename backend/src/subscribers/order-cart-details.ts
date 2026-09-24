import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Medusa ne recopie pas les infos du panier (repère, instructions, source…) sur la commande : on le fait ici.
export default async function orderCartDetails({ event, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "metadata", "cart.metadata"],
    filters: { id: event.data.id },
  })
  const order = data[0]
  const fromCart = order?.cart?.metadata
  if (!order || !fromCart || !Object.keys(fromCart).length) return

  await container.resolve(Modules.ORDER).updateOrders(order.id, {
    metadata: { ...fromCart, ...(order.metadata ?? {}) },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
