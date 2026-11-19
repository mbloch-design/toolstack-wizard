import { bubble, face, fine, hide, ink, legs, line, lines, sheet, touch, type Scene } from "./kit";

/** ClickUp, Figma (desktop), Figma, Google Analytics (19/11, « décliner »). ClickUp's « Point de la semaine » reuses
 *  notion-week. */
export const LOT2 = {
  /** ClickUp · Temps passé. */
  "clickup-hours": { box: [51, 36, 176, 106], touch: "mint", gag: "Le chronomètre, à bout de souffle, tend enfin la facture : vos heures sont comptées.", draw: (t) => (
    <>
      <path d="M90 44v-8M82 36h16" {...line} />
      <circle cx="90" cy="70" r="24" {...hide} />
      <path d="M90 52v4M108 70h-4M72 70h4" {...fine} />
      {face(90, 72, "worry", 7)}
      {legs(80, 100, 93, 12)}
      <path d="M113 74C126 70 134 66 142 64" {...line} />
      <path d="M142 40H176V86H142Z" {...touch(t)} />
      {lines(148, 50, 22, 2)}
      <path d="M148 76H170" {...line} />
      <path d="M58 46q-3 6 0 9q3 -3 0 -9M52 62q-2 4 0 6q2 -2 0 -6" {...fine} />
    </>
  ) },
  /** ClickUp · Nouvelle tâche. */
  "clickup-task": { box: [25, 6, 210, 124], touch: "coral", draw: (t) => (
    <>
      {bubble(26, 36, 70, 40)}
      {lines(38, 50, 46, 2)}
      <path d="M84 40Q118 -2 154 50" {...fine} strokeDasharray="2 8" />
      <path d="M104 22H128V40H104Z" {...hide} />
      <path d="M108 28h6v6h-6z" {...fine} />
      <path d="M126 22V6l10 4l-10 4" {...touch(t)} />
      <path d="M110 40l-4 8M122 40l4 8" {...line} />
      <path d="M150 40H210V124H150Z" {...hide} />
      <path d="M150 62H210M150 84H210M150 104H210" {...fine} />
      <path d="M158 48h8v8h-8zM158 70h8v8h-8zM158 90h8v8h-8z" {...fine} />
      <path d="M172 52h28M172 74h22M172 94h26" {...fine} />
    </>
  ), gag: "La tâche saute de la conversation droit dans la liste, drapeau de priorité au vent." },
  /** Figma (desktop) · Maquette en code. */
  "figmad-code": { box: [40, 28, 180, 126], touch: "sky", gag: "La maquette se regarde dans le miroir et se découvre en code.", draw: (t) => (
    <>
      {sheet(40, 40, 46, 58, "wow", undefined, false)}
      <path d="M48 48H78V62H48Z" {...fine} />
      <path d="M50 60l8 -8l6 6l4 -4l8 6" {...fine} />
      <ellipse cx="150" cy="66" rx="30" ry="38" {...touch(t)} />
      <path d="M140 54l-10 12l10 12M160 54l10 12l-10 12M155 50l-10 32" {...line} />
      <path d="M150 104v20M136 126h28" {...line} />
    </>
  ) },
  /** Figma (desktop) · Couleurs et typos. */
  "figmad-colors": { box: [36, 32, 180, 128], touch: "butter", gag: "La pipette, au chômage, lit le journal sur un banc : on lui a pris son travail.", draw: (t) => (
    <>
      <path d="M36 84H156M36 100H156M44 84V128M148 84V128" {...line} />
      <ellipse cx="87" cy="40" rx="10" ry="8" {...ink} />
      <path d="M78 46H96V98H78Z" {...hide} />
      {face(87, 66, "sleep", 4)}
      <path d="M84 98L87 108L90 98" {...line} />
      <path d="M96 70h6" {...line} />
      <path d="M102 54H138V84H102Z" {...hide} />
      {lines(108, 62, 24, 3)}
      <path d="M176 112q7 9 0 14q-7 -5 0 -14" {...touch(t)} />
    </>
  ) },
  /** Figma (desktop) · Atelier FigJam. */
  "figmad-figjam": { box: [26, 26, 194, 124], touch: "mint", gag: "Le schéma tout emmêlé passe au peigne fin et ressort en liste bien rangée.", draw: (t) => (
    <>
      <path d="M48 44C94 28 18 84 70 78C122 72 26 114 54 104" {...fine} />
      <path d="M26 36H46V48H26ZM62 66H82V78H62ZM34 98H54V110H34Z" {...hide} />
      <path d="M102 26V124" {...line} />
      <path d="M102 36h12M102 48h12M102 60h12M102 72h12M102 84h12M102 96h12M102 108h12" {...fine} />
      <path d="M134 30H194V124H134Z" {...touch(t)} />
      <circle cx="144" cy="46" r="3" {...ink} /><circle cx="144" cy="66" r="3" {...ink} /><circle cx="144" cy="86" r="3" {...ink} /><circle cx="144" cy="106" r="3" {...ink} />
      <path d="M152 46h30M152 66h24M152 86h28M152 106h20" {...fine} />
    </>
  ) },
  /** Figma · Fiche de maquette. */
  "figma-spec": { box: [56, 30, 186, 113], touch: "sky", gag: "La maquette passe sous la toise : sa fiche se remplit toute seule.", draw: (t) => (
    <>
      {sheet(56, 40, 44, 60, "worry", undefined, false)}
      <path d="M64 48H92V60H64Z" {...fine} />
      <path d="M108 30H118V112H108Z" {...touch(t)} />
      <path d="M108 40h5M108 50h3M108 60h5M108 70h3M108 80h5M108 90h3M108 100h5" {...fine} />
      <path d="M100 40H122" {...line} />
      <path d="M140 44H186V108H140Z" {...hide} />
      <path d="M152 40H174V48H152Z" {...ink} />
      <path d="M148 62l3 3l6 -6M148 78l3 3l6 -6M148 94l3 3l6 -6" {...fine} />
      <path d="M162 62h16M162 78h12M162 94h14" {...fine} />
    </>
  ) },
  /** Figma · Parcours client. */
  "figma-journey": { box: [16, 6, 224, 136], touch: "butter", gag: "Le chariot fait son parcours client sur une route en lacets, panneaux compris.", draw: (t) => (
    <>
      <path d="M16 124C78 124 58 64 120 68C182 72 160 24 222 26" {...line} />
      <path d="M16 124C78 124 58 64 120 68C182 72 160 24 222 26" {...fine} strokeDasharray="2 10" transform="translate(0 12)" />
      <path d="M58 112V86M48 78H68V88H48Z" {...line} />
      <path d="M176 40V16M166 8H186V18H166Z" {...line} />
      <path d="M126 44h-6l-6 -8" {...line} />
      <path d="M126 44H156L152 60H130Z" {...touch(t)} />
      <circle cx="134" cy="66" r="3.5" {...ink} /><circle cx="150" cy="66" r="3.5" {...ink} />
      <path d="M214 26V6l10 4l-10 4" {...line} />
    </>
  ) },
  /** Figma · Nouvel écran. */
  "figma-screen": { box: [80, 20, 222, 130], touch: "coral", gag: "L'écran se monte bloc par bloc ; une main pose le dernier, le bouton.", draw: (t) => (
    <>
      <rect x="80" y="20" width="60" height="110" rx="10" {...hide} />
      <path d="M90 32H130V44H90ZM90 54H130V66H90ZM90 74H130V86H90Z" {...hide} />
      <path d="M90 98H130V112H90Z" {...fine} strokeDasharray="3 5" />
      <path d="M156 30H190V44H156Z" {...touch(t)} />
      <path d="M222 54C206 52 196 48 190 42M196 34c-6 -2 -10 2 -6 6" {...line} />
      <path d="M172 52v14l-4 -4M172 66l4 -4" {...fine} />
    </>
  ) },
  /** Google Analytics · Bilan du mois. */
  "ga-report": { box: [40, 26, 206, 124], touch: "mint", gag: "Le gros rapport dort sous sa toile d'araignée ; le bilan arrive en une bulle.", draw: (t) => (
    <>
      <path d="M40 60H100V124H40Z" {...hide} />
      <path d="M48 60V124M42 118H98" {...fine} />
      {face(74, 90, "sleep", 7)}
      <path d="M100 60h-14M100 60v14M100 60l-10 10M88 60q3 7 12 9" {...fine} />
      <circle cx="60" cy="50" r="1.5" {...ink} /><circle cx="80" cy="46" r="1.5" {...ink} />
      {bubble(126, 26, 80, 54)}
      <path d="M140 58H148V70H140Z" {...hide} />
      <path d="M156 48H164V70H156Z" {...touch(t)} />
      <path d="M172 40H180V70H172Z" {...hide} />
      <path d="M190 46l4 -6l4 6" {...fine} />
    </>
  ) },
  /** Google Analytics · En direct. */
  "ga-live": { box: [30, 40, 207, 124], touch: "coral", gag: "Le jour du lancement, le site a un pouls, et il s'emballe.", draw: (t) => (
    <>
      <path d="M30 40H190V124H30Z" {...hide} />
      <path d="M30 52H190" {...fine} />
      <circle cx="38" cy="46" r="1.6" {...ink} /><circle cx="44" cy="46" r="1.6" {...ink} />
      <path d="M40 94H78L86 72L96 114L106 60L114 94H150" {...line} />
      <path d="M170 92c-10 -7 -10 -17 -2 -17c3 0 4 3 4 3c0 0 1 -3 4 -3c8 0 8 10 -2 17l-2 2z" {...touch(t)} />
      <path d="M196 70l8 -4M198 84h9M196 98l8 4" {...fine} />
    </>
  ) },
  /** Google Analytics · Pages qui convertissent. */
  "ga-convert": { box: [36, 40, 204, 116], touch: "mint", gag: "La page qui convertit ramène un client au lasso.", draw: (t) => (
    <>
      {sheet(36, 40, 40, 52, "grin", t)}
      <path d="M76 64C110 44 140 44 160 66" {...line} />
      <ellipse cx="178" cy="76" rx="20" ry="7" {...line} />
      <circle cx="178" cy="50" r="9" {...hide} />
      <circle cx="175" cy="49" r="1.6" {...ink} /><circle cx="181" cy="49" r="1.6" {...ink} />
      <path d="M178 59V98M178 98l-8 18M178 98l8 18" {...line} />
      <path d="M198 54q6 2 6 8" {...fine} />
    </>
  ) },
} satisfies Record<string, Scene>;
