import { envelope, face, fine, hide, ink, line, lines, sheet, speed, touch, type Scene } from "./kit";

/** HubSpot, Make, Miro, Shopify (19/11, « décliner »). Miro's « Retours du client » reuses canva-feedback. */
export const LOT3 = {
  /** HubSpot · Après un appel. */
  "hubspot-call": { box: [16, 44, 206, 124], touch: "butter", gag: "À peine le téléphone raccroché, le post-it de la relance file vers l'agenda.", draw: (t) => (
    <>
      <path d="M30 104H86V124H30Z" {...hide} />
      <path d="M32 98C40 84 76 84 84 98" {...line} strokeWidth={7} />
      <path d="M24 84l-6 -4M92 84l6 -4M22 96h-6" {...fine} />
      {speed(104, 62)}
      {sheet(106, 56, 28, 28, "grin", t, false)}
      <path d="M156 50H206V106H156Z" {...hide} />
      <path d="M166 44v10M196 44v10M156 62H206" {...fine} />
      <circle cx="182" cy="84" r="7" {...line} />
    </>
  ) },
  /** HubSpot · Transactions en cours. */
  "hubspot-pipeline": { box: [20, 40, 174, 128], touch: "butter", gag: "Le pipeline, au sens propre : les affaires sortent du tuyau une à une.", draw: (t) => (
    <>
      <path d="M20 44H140C164 44 170 50 170 74V84H150V74C150 66 148 64 140 64H20Z" {...hide} />
      <path d="M136 40V68M146 80H174" {...line} />
      <circle cx="160" cy="100" r="7" {...touch(t)} />
      <circle cx="158" cy="120" r="7" {...touch(t)} />
      <path d="M40 104L78 122M78 122l7 -4l4 6l-7 4" {...line} />
      <path d="M58 54h20M92 54h14" {...fine} />
    </>
  ) },
  /** HubSpot · Bilan de campagne. */
  "hubspot-campaign": { box: [30, 30, 210, 112], touch: "sky", gag: "Les e-mails de la campagne volent en V ; celui de tête rapporte la coupe.", draw: (t) => (
    <>
      {[[44, 96], [76, 76], [140, 76], [172, 96]].map(([x, y]) => (
        <g key={`${x}${y}`}>{envelope(x, y, 24, 16)}<path d={`M${x} ${y + 3}q-8 -10 -14 -2M${x + 24} ${y + 3}q8 -10 14 -2`} {...fine} /></g>
      ))}
      {envelope(108, 56, 24, 16, t)}
      <path d="M108 59q-8 -10 -14 -2M132 59q8 -10 14 -2" {...fine} />
      <path d="M114 30h12v6c0 7 -12 7 -12 0z" {...line} />
      <path d="M120 43v6M115 50h10" {...line} />
    </>
  ) },
  /** Make · Facture client. */
  "make-invoice": { box: [40, 5, 198, 130], touch: "mint", gag: "Rideau baissé chez Make, et pourtant la facture glisse sous la porte.", draw: (t) => (
    <>
      <path d="M40 34H160V124H40Z" {...hide} />
      <path d="M40 46H160M40 58H160M40 70H160M40 82H160M40 94H160M40 106H160" {...fine} />
      <circle cx="100" cy="20" r="8" {...line} />
      <path d="M100 8v-3M100 32v3M88 20h-3M112 20h3" {...fine} />
      <path d="M118 12q7 4 4 12" {...fine} />
      <path d="M130 114H178V130H130Z" {...touch(t)} />
      <path d="M136 122h22" {...fine} />
      <path d="M186 122h12M190 114h8" {...fine} />
    </>
  ) },
  /** Make · Vos automatisations. */
  "make-scenarios": { box: [30, 24, 206, 120], touch: "sky", gag: "L'atelier rangé, chaque outil à sa place ; le scénario-engrenage fait coucou.", draw: (t) => (
    <>
      <path d="M30 24H200V120H30Z" {...hide} />
      {[44, 84, 124, 164].map((x) => <circle key={x} cx={x} cy="34" r="1.8" {...ink} />)}
      <path d="M60 44V96M50 44H70V56H50Z" {...line} />
      <path d="M100 52V96M92 44l8 8l8 -8" {...line} />
      <path d="M140 44V64M134 64H146V96H134Z" {...line} />
      <circle cx="176" cy="74" r="15" {...touch(t)} />
      <path d="M176 55v-4M176 93v4M157 74h-4M195 74h4" {...line} />
      {face(176, 72, "grin", 5)}
      <path d="M196 60l8 -12M200 44l6 -2" {...fine} />
    </>
  ) },
  /** Make · Rapport du mois. */
  "make-report": { box: [20, 58, 218, 124], touch: "butter", gag: "Le rapport mensuel arrive à dos d'escargot, mais il arrive.", draw: (t) => (
    <>
      <path d="M20 124H36" {...fine} strokeDasharray="2 6" />
      <path d="M44 122C80 125 140 125 162 118C174 114 174 96 163 95C154 94 150 104 148 112L60 114C50 114 44 117 44 122Z" {...hide} />
      <path d="M158 96l-7 -14M166 97l5 -14" {...line} />
      <circle cx="150" cy="80" r="2.6" {...ink} /><circle cx="172" cy="81" r="2.6" {...ink} />
      <path d="M160 108q4 3 8 0" {...fine} />
      <circle cx="100" cy="98" r="24" {...touch(t)} />
      <path d="M100 98a6 6 0 1 1 6 6a12 12 0 1 1 -12 -12" {...fine} />
      <path d="M88 58H112V76H88Z" {...hide} />
      {lines(92, 64, 16, 2, 5)}
      <path d="M204 124V84l14 6l-14 6" {...line} />
    </>
  ) },
  /** Miro · Compte rendu d'atelier. */
  "miro-recap": { box: [36, 22, 208, 130], touch: "butter", gag: "L'aspirateur avale le mur de post-it et recrache un compte rendu bien propre.", draw: (t) => (
    <>
      <path d="M36 30H52V46H36ZM58 44H74V60H58ZM40 62H56V78H40ZM66 22H82V38H66ZM80 58H96V74H80Z" {...touch(t)} />
      <path d="M100 48L128 66" {...line} strokeWidth={8} />
      <path d="M128 66C148 76 150 96 166 102" {...line} />
      <path d="M160 94H206V122H160Z" {...hide} />
      <circle cx="170" cy="126" r="4" {...ink} /><circle cx="198" cy="126" r="4" {...ink} />
      <path d="M180 40H208V84H180Z" {...hide} />
      {lines(186, 50, 16, 3, 7)}
      <path d="M188 74l3 3l6 -6" {...fine} />
      <path d="M100 36l-6 -4M98 58h-8" {...fine} />
    </>
  ) },
  /** Miro · Lancement de projet. */
  "miro-kickoff": { box: [30, 31, 210, 122], touch: "coral", gag: "Le squelette du projet est posé : trois cadres et un chef de chantier, casque sur la tête.", draw: (t) => (
    <>
      <path d="M30 72H80V122H30ZM95 72H145V122H95ZM160 72H210V122H160Z" {...hide} />
      <path d="M80 97H95M145 97H160" {...line} />
      {lines(38, 84, 30, 3, 9)}{lines(103, 84, 30, 2, 9)}
      <circle cx="120" cy="42" r="7" {...hide} />
      <path d="M111 40a9 9 0 0 1 18 0h3h-24z" {...touch(t)} />
      <path d="M120 49V62M120 62l-6 9M120 62l6 9M120 54l12 -6" {...line} />
      <path d="M132 48l3 -9M129 37h12" {...line} />
    </>
  ) },
  /** Shopify · Ventes de la semaine. */
  "shopify-sales": { box: [45, 40, 179, 119], touch: "mint", gag: "Les sacs de la semaine défilent en fanfare ; le meilleur vendeur porte le drapeau.", draw: (t) => (
    <>
      {[46, 88].map((x) => <path key={x} d={`M${x + 6} 76q6 -12 12 0`} {...line} />)}
      {sheet(46, 76, 24, 30, "smile", undefined, false)}
      {sheet(88, 76, 24, 30, "smile", undefined, false)}
      <path d="M136 76q6 -12 12 0" {...line} />
      {sheet(130, 76, 24, 30, "grin", t, false)}
      <path d="M154 90H162V40l16 6l-16 6" {...line} />
    </>
  ) },
  /** Shopify · Stock bas. */
  "shopify-stock": { box: [30, 42, 190, 120], touch: "butter", gag: "La dernière bougie Vanille transpire, seule sur l'étagère vide.", draw: (t) => (
    <>
      <path d="M56 78H76V110H56ZM144 78H164V110H144Z" {...fine} strokeDasharray="3 5" />
      <path d="M100 70H120V110H100Z" {...hide} />
      <path d="M110 70v-6" {...fine} />
      <path d="M110 62q-8 -10 0 -20q8 10 0 20z" {...touch(t)} />
      {face(110, 88, "worry", 5)}
      <path d="M128 74q3 6 0 8q-3 -2 0 -8M92 78q-2 4 0 6q2 -2 0 -6" {...fine} />
      <path d="M30 110H190M44 110v10M176 110v10" {...line} />
    </>
  ) },
  /** Shopify · Code promo. */
  "shopify-promo": { box: [34, 25, 195, 122], touch: "sky", gag: "L'étiquette de prix s'habille pour l'hiver : bonnet, écharpe, prix en baisse.", draw: (t) => (
    <>
      <path d="M70 52H122L152 82L122 112H70Z" {...hide} />
      <circle cx="132" cy="82" r="4" {...line} />
      <path d="M68 54C70 30 104 30 108 54Z" {...hide} />
      <circle cx="88" cy="30" r="5" {...ink} />
      {face(92, 74, "smile", 7)}
      <path d="M72 94H120L120 102H72Z" {...touch(t)} />
      <path d="M82 102L78 122H90L92 102" {...touch(t)} />
      <path d="M40 34v12M34 40h12M36 36l8 8M44 36l-8 8M184 46v10M179 51h10M190 98v10M185 103h10" {...fine} />
      <path d="M170 74v20l-5 -5M170 94l5 -5" {...fine} />
    </>
  ) },
} satisfies Record<string, Scene>;
