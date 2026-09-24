import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Container, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { codStatus, orderRef, STATUS, type CodStatus } from "../lib/cod"
import { sdk } from "../lib/sdk"

const OPEN: CodStatus[] = ["nouvelle", "vue", "appelee"]

const OrdersTodoWidget = () => {
  const [tab, setTab] = useState<CodStatus>("nouvelle")
  const { data, isLoading } = useQuery({
    queryKey: ["lbb-orders-todo"],
    queryFn: () =>
      sdk.admin.order.list({
        limit: 200,
        order: "-created_at",
        fields: "id,display_id,created_at,status,total,currency_code,metadata,*shipping_address",
      }),
  })

  const open = (data?.orders ?? []).filter((o) => o.status !== "canceled" && OPEN.includes(codStatus(o)))
  const list = open.filter((o) => codStatus(o) === tab)

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Heading level="h2">Commandes à traiter</Heading>
        <div className="flex gap-2">
          {OPEN.map((s) => (
            <button key={s} type="button" onClick={() => setTab(s)}>
              <Badge color={tab === s ? STATUS[s].color : "grey"}>
                {STATUS[s].label} · {open.filter((o) => codStatus(o) === s).length}
              </Badge>
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <Text className="text-ui-fg-subtle px-6 py-4">Chargement…</Text>
      ) : list.length === 0 ? (
        <Text className="text-ui-fg-subtle px-6 py-4">Rien à traiter ici.</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Commande</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Client</Table.HeaderCell>
              <Table.HeaderCell>Téléphone</Table.HeaderCell>
              <Table.HeaderCell>Ville</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {list.map((o) => {
              const a = o.shipping_address
              return (
                <Table.Row key={o.id}>
                  <Table.Cell>
                    <Link to={`/orders/${o.id}`} className="text-ui-fg-interactive">
                      {orderRef(o.display_id)}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{new Date(o.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</Table.Cell>
                  <Table.Cell>{[a?.first_name, a?.last_name].filter(Boolean).join(" ")}</Table.Cell>
                  <Table.Cell>{a?.phone}</Table.Cell>
                  <Table.Cell>{[a?.city, a?.province].filter(Boolean).join(", ")}</Table.Cell>
                  <Table.Cell className="text-right">
                    {Number(o.total).toLocaleString("fr-FR")} {o.currency_code.toUpperCase()}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default OrdersTodoWidget
