import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Badge, Button, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { codStatus, setCodStatus, STATUS, STEPS, type CodStatus } from "../lib/cod"

const NEXT: Partial<Record<CodStatus, { to: CodStatus; label: string }>> = {
  nouvelle: { to: "vue", label: "Marquer comme vue" },
  vue: { to: "appelee", label: "Client appelé : commande confirmée" },
  appelee: { to: "livree", label: "Livrée et payée" },
}

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v : null)

function sourceOf(m: Record<string, unknown>) {
  const parts = [text(m.utm_source), text(m.utm_medium), text(m.utm_campaign)].filter(Boolean)
  if (parts.length) return parts.join(" / ")
  const ref = text(m.referrer)
  if (!ref) return "Accès direct"
  try {
    return new URL(ref).hostname
  } catch {
    return ref
  }
}

const OrderCodWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const qc = useQueryClient()
  const prompt = usePrompt()
  const status = codStatus(order)
  const m = (order.metadata ?? {}) as Record<string, unknown>
  const addr = order.shipping_address
  const next = NEXT[status]

  const { mutate, isPending } = useMutation({
    mutationFn: (to: CodStatus) => setCodStatus(order.id, to),
    onSuccess: (res) => {
      qc.invalidateQueries()
      toast.success(`Commande : ${STATUS[res.status].label}`)
      if (res.meta_error) toast.warning("Meta n'a pas reçu l'achat", { description: res.meta_error })
    },
    onError: (e: Error) => toast.error("Action impossible", { description: e.message }),
  })

  async function go(to: CodStatus) {
    if (to === "livree") {
      const ok = await prompt({
        title: "Commande livrée et payée ?",
        description: "Le colis sera marqué livré, le paiement encaissé et la commande clôturée.",
        confirmText: "Oui, livrée",
        cancelText: "Retour",
      })
      if (!ok) return
    }
    if (to === "annulee") {
      const ok = await prompt({
        title: "Annuler la commande ?",
        description: "Le stock réservé sera libéré. Cette action ne peut pas être défaite.",
        variant: "danger",
        confirmText: "Annuler la commande",
        cancelText: "Retour",
      })
      if (!ok) return
    }
    mutate(to)
  }

  const rows: [string, string | null][] = [
    ["Téléphone", text(addr?.phone)],
    ["Point de repère", text(m.landmark)],
    ["Instructions", text(m.notes)],
    ["Source", sourceOf(m)],
  ]

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Paiement à la livraison</Heading>
        <Badge color={STATUS[status].color}>{STATUS[status].label}</Badge>
      </div>

      {status !== "annulee" && (
        <div className="flex gap-1 px-6 py-4">
          {STEPS.map((s) => (
            <div key={s} className="flex-1">
              <div
                className={
                  "h-1 rounded-full " +
                  (STEPS.indexOf(s) <= STEPS.indexOf(status) ? "bg-ui-fg-interactive" : "bg-ui-bg-switch-off")
                }
              />
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                {STATUS[s].label}
              </Text>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 px-6 py-4">
        {rows.map(([label, value]) =>
          value ? (
            <div key={label} className="flex justify-between gap-4">
              <Text size="small" className="text-ui-fg-subtle">
                {label}
              </Text>
              <Text size="small" className="text-right">
                {label === "Téléphone" ? <a href={`tel:${value.replace(/\s/g, "")}`}>{value}</a> : value}
              </Text>
            </div>
          ) : null
        )}
        {m.express === true && (
          <Text size="small" className="text-ui-fg-subtle">
            Commande express depuis la fiche produit.
          </Text>
        )}
        {text(m.meta_purchase_sent_at) && (
          <Text size="small" className="text-ui-fg-subtle">
            Achat envoyé à Meta le {new Date(m.meta_purchase_sent_at as string).toLocaleString("fr-FR")}.
          </Text>
        )}
      </div>

      {next && (
        <div className="flex flex-col gap-2 px-6 py-4">
          <Button size="small" isLoading={isPending} onClick={() => go(next.to)}>
            {next.label}
          </Button>
          <Button size="small" variant="secondary" disabled={isPending} onClick={() => go("annulee")}>
            Annuler la commande
          </Button>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderCodWidget
