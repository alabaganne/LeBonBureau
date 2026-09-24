/* Client Medusa unique. Toutes les lectures et écritures passent par lui,
   via les helpers de lib/ — jamais directement depuis un composant. */

import Medusa from "@medusajs/js-sdk";

const publicUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
// Côté serveur (Docker), Medusa peut être joint par une adresse interne.
const baseUrl = (typeof window === "undefined" && process.env.MEDUSA_BACKEND_URL) || publicUrl;

export const sdk = new Medusa({
  baseUrl,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
});

let regionId: Promise<string> | null = null;

/** La région Tunisie (DT). La boutique n'en a qu'une. */
export function getRegionId(): Promise<string> {
  regionId ??= sdk.store.region
    .list({ fields: "id" })
    .then(({ regions }) => {
      if (!regions[0]) throw new Error("Aucune région dans Medusa — lancez le seed du backend.");
      return regions[0].id;
    })
    .catch((e) => {
      regionId = null;
      throw e;
    });
  return regionId;
}
