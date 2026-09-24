import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Input, Label, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/sdk"

type Pair = [string, string]

const pairs = (v: unknown): Pair[] =>
  Array.isArray(v) ? v.filter((p) => Array.isArray(p)).map((p) => [String(p[0] ?? ""), String(p[1] ?? "")]) : []

function PairList({
  title,
  hint,
  labels,
  rows,
  onChange,
}: {
  title: string
  hint: string
  labels: Pair
  rows: Pair[]
  onChange: (rows: Pair[]) => void
}) {
  const set = (i: number, j: 0 | 1, value: string) =>
    onChange(rows.map((r, k) => (k === i ? ((j === 0 ? [value, r[1]] : [r[0], value]) as Pair) : r)))
  return (
    <div className="flex flex-col gap-2">
      <Label weight="plus">{title}</Label>
      <Text size="small" className="text-ui-fg-subtle">
        {hint}
      </Text>
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <Input placeholder={labels[0]} value={r[0]} onChange={(e) => set(i, 0, e.target.value)} />
          <Input placeholder={labels[1]} value={r[1]} onChange={(e) => set(i, 1, e.target.value)} />
          <Button variant="transparent" size="small" onClick={() => onChange(rows.filter((_, k) => k !== i))}>
            Retirer
          </Button>
        </div>
      ))}
      <div>
        <Button variant="secondary" size="small" onClick={() => onChange([...rows, ["", ""]])}>
          Ajouter une ligne
        </Button>
      </div>
    </div>
  )
}

const ProductSheetWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const qc = useQueryClient()
  const m = (product.metadata ?? {}) as Record<string, unknown>
  const colorOption = product.options?.find((o) => o.title === "Finition")
  const initialColors = (m.colors ?? {}) as Record<string, string>

  const [blurb, setBlurb] = useState(String(m.blurb ?? ""))
  const [badge, setBadge] = useState(String(m.badge ?? ""))
  const [rating, setRating] = useState(String(m.rating ?? ""))
  const [reviews, setReviews] = useState(String(m.reviews ?? ""))
  const [colors, setColors] = useState<Record<string, string>>(initialColors)
  const [specs, setSpecs] = useState<Pair[]>(pairs(m.specs))
  const [features, setFeatures] = useState<Pair[]>(pairs(m.features))

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      sdk.admin.product.update(product.id, {
        metadata: {
          ...m,
          blurb: blurb.trim(),
          badge: badge.trim(),
          rating: rating ? Number(rating.replace(",", ".")) : "",
          reviews: reviews ? Number(reviews) : "",
          colors,
          specs: specs.filter(([k, v]) => k.trim() && v.trim()),
          features: features.filter(([k, v]) => k.trim() && v.trim()),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries()
      toast.success("Fiche produit enregistrée")
    },
    onError: (e: Error) => toast.error("Enregistrement impossible", { description: e.message }),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Fiche produit (boutique)</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Textes et détails affichés sur la page du bureau.
          </Text>
        </div>
        <Button size="small" isLoading={isPending} onClick={() => mutate()}>
          Enregistrer
        </Button>
      </div>

      <div className="grid gap-4 px-6 py-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label weight="plus">Accroche (carte du catalogue)</Label>
          <Textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label weight="plus">Badge</Label>
          <Input placeholder="Best-seller, Nouveau…" value={badge} onChange={(e) => setBadge(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <Label weight="plus">Note /5</Label>
            <Input value={rating} onChange={(e) => setRating(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label weight="plus">Nombre d'avis</Label>
            <Input value={reviews} onChange={(e) => setReviews(e.target.value)} />
          </div>
        </div>
      </div>

      {colorOption && (
        <div className="flex flex-col gap-2 px-6 py-4">
          <Label weight="plus">Couleur des finitions</Label>
          <Text size="small" className="text-ui-fg-subtle">
            La pastille affichée pour chaque valeur de l'option « Finition ».
          </Text>
          <div className="flex flex-wrap gap-4">
            {(colorOption.values ?? []).map((v) => (
              <label key={v.id} className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[v.value] ?? "#cccccc"}
                  onChange={(e) => setColors({ ...colors, [v.value]: e.target.value })}
                />
                <Text size="small">{v.value}</Text>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-4">
        <PairList
          title="Caractéristiques"
          hint="Le tableau technique (ex. Charge maximale → 70 kg)."
          labels={["Caractéristique", "Valeur"]}
          rows={specs}
          onChange={setSpecs}
        />
      </div>
      <div className="px-6 py-4">
        <PairList
          title="Points forts"
          hint="Les cartes « Points forts » (titre + phrase courte)."
          labels={["Titre", "Texte"]}
          rows={features}
          onChange={setFeatures}
        />
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductSheetWidget
