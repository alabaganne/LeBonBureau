/* Landing green feature band — "Nos engagements". One of the few colored
   sections on the white canvas. */

import Button from "@/components/Button";
import { CheckIcon } from "@/components/Icons";
import { imageOr } from "@/lib/data";

const PROMISES = [
  "Hauteur adaptée à votre taille pour une posture neutre.",
  "Plateaux profonds : double écran et repose-poignets.",
  "Gestion des câbles intégrée, sans rallonge qui traîne.",
  "Matériaux durables, garantis plusieurs années.",
];

/** `image` : une photo du catalogue, choisie par la page d'accueil. */
export default function GreenBand({ image }: { image?: string }) {
  return (
    <div className="wrap">
      <section className="bg-green text-white rounded-card-lg my-20 overflow-hidden" id="engagements">
        <div className="grid grid-cols-2 max-[960px]:grid-cols-1">
          <div className="px-14 py-[60px] max-[560px]:px-[30px] max-[560px]:py-10">
            <span className="eyebrow on-green">Nos engagements</span>
            <h2 className="section-title text-white mb-[18px]" style={{ marginTop: 12 }}>
              Pensés pour les longues sessions.
            </h2>
            <p className="text-white/78 text-[17px] max-w-[42ch] mb-7">
              On ne vend que des bureaux qu&apos;on utiliserait nous-mêmes, huit heures par jour.
              Voilà ce que chaque modèle vous garantit.
            </p>
            <ul className="list-none mb-[30px] p-0 grid gap-[14px]">
              {PROMISES.map((text) => (
                <li key={text} className="flex gap-3 items-start text-[15.5px] text-white/90 [&_svg]:flex-none [&_svg]:mt-0.5 [&_svg]:text-white">
                  <CheckIcon size={20} strokeWidth={2} />
                  {text}
                </li>
              ))}
            </ul>
            <Button href="/#catalogue" variant="light">
              Choisir mon bureau
            </Button>
          </div>
          <div className="bg-green-deep relative min-h-[340px] max-[960px]:min-h-[240px] max-[960px]:order-[-1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="absolute inset-0 w-full h-full object-cover opacity-90" src={imageOr(image, "LeBonBureau", 760, 760)} alt="Espace de travail ergonomique" />
          </div>
        </div>
      </section>
    </div>
  );
}
