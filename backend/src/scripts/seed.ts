import { CreateInventoryLevelInput, ExecArgs, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListPricesWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

type Desk = {
  handle: string
  title: string
  subtitle: string
  description: string
  category: string
  photos: number[]
  stock: number
  price: number
  oldPrice: number | null
  colors: { name: string; hex: string }[]
  sizes: string[]
  metadata: Record<string, unknown>
}

const pexels = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=900`

const CATEGORIES = [
  { name: "Assis-debout", handle: "assis-debout" },
  { name: "Programmation", handle: "programmation" },
  { name: "Gaming", handle: "gaming" },
]

const DESKS: Desk[] = [
  {
    handle: "atlas",
    title: "Atlas",
    subtitle: "Bureau assis-debout électrique",
    description:
      "Atlas est notre bureau assis-debout le plus polyvalent. Son moteur double colonne soulève jusqu'à 70 kg en silence, avec mémoire de quatre hauteurs. Idéal pour les longues sessions de code comme pour les marathons de jeu.",
    category: "assis-debout",
    photos: [1957477, 12786598, 8490189],
    stock: 7,
    price: 1529,
    oldPrice: 1799,
    colors: [
      { name: "Chêne clair", hex: "#d8c4a0" },
      { name: "Noir mat", hex: "#26261f" },
      { name: "Blanc", hex: "#f3f1ea" },
    ],
    sizes: ["120 × 80 cm", "140 × 80 cm", "160 × 80 cm"],
    metadata: {
      blurb:
        "Plateau motorisé de 65 à 132 cm. La référence pour alterner posture assise et debout sans quitter son flow.",
      badge: "Best-seller",
      rating: 4.8,
      reviews: 214,
      specs: [
        ["Réglage en hauteur", "65 – 132 cm"],
        ["Charge maximale", "70 kg"],
        ["Vitesse moteur", "38 mm/s"],
        ["Mémoire de positions", "4 hauteurs"],
        ["Niveau sonore", "< 45 dB"],
        ["Garantie", "10 ans cadre"],
      ],
      features: [
        ["Double moteur", "Montée fluide et stable, même à pleine charge."],
        ["Mémoire 4 positions", "Retrouvez votre hauteur d'un seul geste."],
        ["Passe-câbles intégré", "Goulotte aimantée sous le plateau."],
      ],
    },
  },
  {
    handle: "nova",
    title: "Nova",
    subtitle: "Bureau compact pour petits espaces",
    description:
      "Nova fait beaucoup avec peu de place. Son plateau profond accueille deux écrans 27\" et son piètement en acier ne bouge pas d'un millimètre quand vous tapez vite. Le compagnon idéal des développeurs en appartement.",
    category: "programmation",
    photos: [5546811, 8490189, 12786598],
    stock: 12,
    price: 539,
    oldPrice: null,
    colors: [
      { name: "Frêne", hex: "#e0d3b6" },
      { name: "Anthracite", hex: "#33332b" },
    ],
    sizes: ["100 × 56 cm", "120 × 60 cm"],
    metadata: {
      blurb: "100 × 56 cm. Pensé pour un setup deux écrans dans un studio ou un coin de chambre.",
      rating: 4.6,
      reviews: 89,
      specs: [
        ["Dimensions plateau", "100 × 56 cm"],
        ["Hauteur fixe", "74 cm"],
        ["Charge maximale", "50 kg"],
        ["Épaisseur plateau", "22 mm"],
        ["Piètement", "Acier thermolaqué"],
        ["Garantie", "5 ans"],
      ],
      features: [
        ["Empreinte minimale", "S'installe dans moins d'un mètre carré."],
        ["Plateau anti-traces", "Stratifié mat qui ne marque pas."],
        ["Vérins réglables", "Stable même sur parquet ancien."],
      ],
    },
  },
  {
    handle: "vector",
    title: "Vector",
    subtitle: "Bureau d'angle gaming en L",
    description:
      "Vector épouse l'angle de votre pièce pour libérer un maximum de surface. Le plateau enveloppant garde tout à portée de main et le revêtement texturé glisse parfaitement pour la souris. Conçu pour la compétition.",
    category: "gaming",
    photos: [6125337, 30469973, 30469967],
    stock: 5,
    price: 1119,
    oldPrice: 1319,
    colors: [
      { name: "Noir carbone", hex: "#222019" },
      { name: "Gris béton", hex: "#9a978c" },
    ],
    sizes: ["160 × 140 cm", "180 × 160 cm"],
    metadata: {
      blurb: "Format L de 160 × 140 cm. De la place pour trois écrans, le combo clavier-souris et le casque.",
      badge: "Nouveau",
      rating: 4.7,
      reviews: 56,
      specs: [
        ["Dimensions", "160 × 140 cm"],
        ["Hauteur fixe", "75 cm"],
        ["Charge maximale", "60 kg"],
        ["Surface", "Texturée anti-reflets"],
        ["Gestion câbles", "Tunnel arrière + crochets"],
        ["Garantie", "5 ans"],
      ],
      features: [
        ["Format en L", "Trois écrans alignés sans compromis."],
        ["Surface micro-texturée", "Glisse précise sans tapis."],
        ["Crochet casque", "Rangement intégré côté plateau."],
      ],
    },
  },
  {
    handle: "pulse",
    title: "Pulse",
    subtitle: "Bureau assis-debout à manivelle",
    description:
      "Pulse prouve qu'on peut passer debout sans moteur. Sa manivelle repliable ajuste la hauteur en quelques tours et son mécanisme mécanique ne tombe jamais en panne. Le choix sobre et durable.",
    category: "assis-debout",
    photos: [12786598, 1957477, 8490189],
    stock: 10,
    price: 819,
    oldPrice: null,
    colors: [
      { name: "Bouleau", hex: "#e6dcc2" },
      { name: "Noir mat", hex: "#26261f" },
      { name: "Blanc", hex: "#f3f1ea" },
    ],
    sizes: ["120 × 70 cm", "140 × 70 cm"],
    metadata: {
      blurb: "L'assis-debout sans électronique. Manivelle douce, mécanisme garanti à vie.",
      specs: [
        ["Réglage en hauteur", "72 – 118 cm"],
        ["Mécanisme", "Manivelle repliable"],
        ["Charge maximale", "55 kg"],
        ["Tours / cycle complet", "~ 30"],
        ["Entretien", "Aucun"],
        ["Garantie", "À vie (mécanisme)"],
      ],
      features: [
        ["Zéro électronique", "Rien à brancher, rien à réparer."],
        ["Manivelle escamotable", "Disparaît sous le plateau."],
        ["Fabrication durable", "Conçu pour traverser les années."],
      ],
    },
  },
  {
    handle: "quartz",
    title: "Quartz",
    subtitle: "Grand bureau gaming pro",
    description:
      "Quartz mise sur la surface. Son plateau d'un seul bloc de 180 cm encaisse une station complète : écran ultra-large, second moniteur, deck de streaming et plus encore. Le piètement en H assure une stabilité totale.",
    category: "gaming",
    photos: [30469973, 30469967, 6125337],
    stock: 10,
    price: 1289,
    oldPrice: null,
    colors: [
      { name: "Noir mat", hex: "#222019" },
      { name: "Chêne foncé", hex: "#7d6647" },
    ],
    sizes: ["160 × 80 cm", "180 × 80 cm"],
    metadata: {
      blurb: "180 × 80 cm d'un seul tenant. Le plateau XXL pour les setups les plus ambitieux.",
      specs: [
        ["Dimensions", "180 × 80 cm"],
        ["Hauteur fixe", "75 cm"],
        ["Charge maximale", "80 kg"],
        ["Piètement", "Acier en H"],
        ["Épaisseur plateau", "25 mm"],
        ["Garantie", "5 ans"],
      ],
      features: [
        ["Plateau XXL", "Toute la station sur une seule surface."],
        ["Piètement en H", "Aucune flexion, aucun balancement."],
        ["Bords adoucis", "Confort des avant-bras sur la durée."],
      ],
    },
  },
  {
    handle: "line",
    title: "Liné",
    subtitle: "Bureau minimaliste essentiel",
    description:
      "Liné va droit au but : un plateau net, des pieds fins en acier, rien de superflu. C'est le premier bureau idéal pour un poste de travail soigné sans exploser le budget.",
    category: "programmation",
    photos: [8490189, 5546811, 1957477],
    stock: 10,
    price: 439,
    oldPrice: null,
    colors: [
      { name: "Frêne", hex: "#e0d3b6" },
      { name: "Blanc", hex: "#f3f1ea" },
      { name: "Noir mat", hex: "#26261f" },
    ],
    sizes: ["110 × 60 cm", "130 × 65 cm"],
    metadata: {
      blurb: "Quatre pieds, un plateau franc. L'essentiel, bien fait, pour démarrer un setup propre.",
      badge: "Petit prix",
      specs: [
        ["Dimensions", "110 × 60 cm"],
        ["Hauteur fixe", "74 cm"],
        ["Charge maximale", "45 kg"],
        ["Pieds", "Acier Ø 40 mm"],
        ["Montage", "< 15 minutes"],
        ["Garantie", "5 ans"],
      ],
      features: [
        ["Lignes épurées", "Se fond dans tous les intérieurs."],
        ["Montage express", "Assemblé en moins d'un quart d'heure."],
        ["Vérins de niveau", "Stable sur sol irrégulier."],
      ],
    },
  },
]


// Relançable : crée la boutique une fois, puis ajoute seulement ce qui manque (voir SEED.md).
export default async function seedLeBonBureau({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const regionModule = container.resolve(Modules.REGION)

  if ((await regionModule.listRegions({ name: "Tunisie" })).length) {
    logger.info("Boutique déjà en place, on complète le catalogue.")
  } else {
    await setupStore(container)
  }
  await addMissingDesks(container)

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: keys } = await query.graph({
    entity: "api_key",
    fields: ["token"],
    filters: { type: "publishable" },
  })
  logger.info("Terminé.")
  logger.info(`Clé publique à mettre dans NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY : ${keys[0]?.token}`)
}

/** Région Tunisie en DT, paiement à la livraison, entrepôt, livraison offerte, clé publique. */
async function setupStore(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const storeModule = container.resolve(Modules.STORE)

  logger.info("Boutique et canal de vente…")
  const [store] = await storeModule.listStores()
  let [salesChannel] = await salesChannelModule.listSalesChannels({ name: "Default Sales Channel" })
  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "Default Sales Channel" }] },
    })
    salesChannel = result[0]
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "LeBonBureau",
        supported_currencies: [{ currency_code: "tnd", is_default: true }],
        default_sales_channel_id: salesChannel.id,
      },
    },
  })

  logger.info("Région Tunisie (DT, paiement à la livraison)…")
  const { result: regions } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Tunisie",
          currency_code: "tnd",
          countries: ["tn"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  })
  const region = regions[0]

  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: "tn", provider_id: "tp_system" }],
  })

  logger.info("Entrepôt et livraison…")
  const { result: locations } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        { name: "Entrepôt LeBonBureau", address: { city: "Tunis", country_code: "TN", address_1: "" } },
      ],
    },
  })
  const location = locations[0]

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_region_id: region.id, default_location_id: location.id },
    },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  let [shippingProfile] = await fulfillmentModule.listShippingProfiles({ type: "default" })
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Profil par défaut", type: "default" }] },
    })
    shippingProfile = result[0]
  }

  const fulfillmentSet = await fulfillmentModule.createFulfillmentSets({
    name: "Livraison Tunisie",
    type: "shipping",
    service_zones: [{ name: "Tunisie", geo_zones: [{ country_code: "tn", type: "country" }] }],
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Livraison offerte",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Livraison à domicile",
          description: "Partout en Tunisie, sous 48 à 72 h.",
          code: "standard",
        },
        prices: [
          { currency_code: "tnd", amount: 0 },
          { region_id: region.id, amount: 0 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: location.id, add: [salesChannel.id] },
  })

  logger.info("Clé API publique pour la boutique…")
  const { data: keys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token"],
    filters: { type: "publishable" },
  })
  let apiKey: { id: string } | undefined = keys[0]
  if (!apiKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: { api_keys: [{ title: "Boutique", type: "publishable", created_by: "" }] },
    })
    apiKey = result[0]
  }
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: apiKey.id, add: [salesChannel.id] },
  })
}

/** Crée les catégories et bureaux de la liste qui n'existent pas encore, avec leur stock. */
async function addMissingDesks(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const storeModule = container.resolve(Modules.STORE)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const productModule = container.resolve(Modules.PRODUCT)
  const pricingModule = container.resolve(Modules.PRICING)

  const [store] = await storeModule.listStores()
  const salesChannelId = store.default_sales_channel_id!
  const locationId = store.default_location_id!
  const [shippingProfile] = await fulfillmentModule.listShippingProfiles({ type: "default" })

  const categories = await productModule.listProductCategories(
    { handle: CATEGORIES.map((c) => c.handle) },
    { select: ["id", "handle"] }
  )
  const newCategories = CATEGORIES.filter((c) => !categories.some((e) => e.handle === c.handle))
  if (newCategories.length) {
    logger.info(`Catégories ajoutées : ${newCategories.map((c) => c.name).join(", ")}`)
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: newCategories.map((c) => ({ ...c, is_active: true })) },
    })
    categories.push(...result)
  }

  const known = await productModule.listProducts(
    { handle: DESKS.map((d) => d.handle) },
    { withDeleted: true, select: ["handle"] }
  )
  const desks = DESKS.filter((d) => !known.some((p) => p.handle === d.handle))
  if (!desks.length) {
    logger.info("Tous les bureaux sont déjà là.")
    return
  }
  logger.info(`Bureaux ajoutés : ${desks.map((d) => d.title).join(", ")}`)

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      products: desks.map((d) => ({
        title: d.title,
        subtitle: d.subtitle,
        handle: d.handle,
        description: d.description,
        status: ProductStatus.PUBLISHED,
        category_ids: [categories.find((c) => c.handle === d.category)!.id],
        shipping_profile_id: shippingProfile.id,
        thumbnail: pexels(d.photos[0]),
        images: d.photos.map((id) => ({ url: pexels(id) })),
        metadata: {
          ...d.metadata,
          colors: Object.fromEntries(d.colors.map((c) => [c.name, c.hex])),
        },
        options: [
          { title: "Finition", values: d.colors.map((c) => c.name) },
          { title: "Dimensions", values: d.sizes },
        ],
        variants: d.colors.flatMap((c, ci) =>
          d.sizes.map((s, si) => ({
            title: `${c.name} / ${s}`,
            sku: `${d.handle.toUpperCase()}-${ci + 1}${si + 1}`,
            options: { Finition: c.name, Dimensions: s },
            // Le prix de base est le prix barré ; la liste « Soldes » porte le prix réel.
            prices: [{ amount: d.oldPrice ?? d.price, currency_code: "tnd" }],
          }))
        ),
        sales_channels: [{ id: salesChannelId }],
      })),
    },
  })

  const salePrices = desks
    .filter((d) => d.oldPrice)
    .flatMap((d) =>
      products
        .find((p) => p.handle === d.handle)!
        .variants.map((v) => ({ amount: d.price, currency_code: "tnd", variant_id: v.id }))
    )
  if (salePrices.length) {
    const soldes = (await pricingModule.listPriceLists({}, { select: ["id", "title"] })).find(
      (l) => l.title === "Soldes"
    )
    if (soldes) {
      await createPriceListPricesWorkflow(container).run({
        input: { data: [{ id: soldes.id, prices: salePrices }] },
      })
    } else {
      await createPriceListsWorkflow(container).run({
        input: {
          price_lists_data: [
            {
              title: "Soldes",
              description: "Prix réduits affichés avec le prix barré.",
              status: "active",
              prices: salePrices,
            },
          ],
        },
      })
    }
  }

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "product.handle", "inventory_items.inventory_item_id"],
    filters: { product_id: products.map((p) => p.id) },
  })
  const levels: CreateInventoryLevelInput[] = variants.flatMap((v) =>
    (v.inventory_items ?? []).map((ii) => ({
      location_id: locationId,
      inventory_item_id: ii!.inventory_item_id,
      stocked_quantity: desks.find((d) => d.handle === v.product?.handle)?.stock ?? 0,
    }))
  )
  await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: levels } })
}
