import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

// Tient à jour metadata.orders_count sur chaque bureau (preuve sociale sur la fiche produit).
export default async function productOrderCount({ event, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const step = event.name === "order.canceled" ? -1 : 1

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["items.product_id"],
    filters: { id: event.data.id },
  })
  const ids = [...new Set((orders[0]?.items ?? []).map((i) => i?.product_id).filter(Boolean))] as string[]
  if (!ids.length) return

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "metadata"],
    filters: { id: ids },
  })
  await updateProductsWorkflow(container).run({
    input: {
      products: products.map((p) => ({
        id: p.id,
        metadata: {
          ...(p.metadata ?? {}),
          orders_count: Math.max(0, Number(p.metadata?.orders_count ?? 0) + step),
        },
      })),
    },
  })
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.canceled"],
}
