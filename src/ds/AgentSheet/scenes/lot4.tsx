import { bubble, envelope, face, fine, hide, ink, line, lines, sheet, shoe, touch, type Scene } from "./kit";

/** Slack, Tally, Webflow, Zapier (19/11, « décliner »). */
export const LOT4 = {
  /** Slack · Fil client. */
  "slack-catchup": { box: [16, 54, 208, 128], touch: "coral", gag: "Trois jours de fil, au sens propre : on rembobine la pelote, message après message.", draw: (t) => (
    <>
      <path d="M44 70C64 70 70 96 90 90C120 80 140 120 172 104" {...line} />
      <path d="M98 88v6M132 98v8" {...fine} />
      {bubble(86, 94, 24, 14)}
      {bubble(120, 106, 24, 14)}
      <circle cx="190" cy="100" r="18" {...touch(t)} />
      <path d="M176 92q14 -8 28 4M174 104q16 -6 32 4M180 116q10 -6 22 0" {...fine} />
      {sheet(16, 54, 26, 30, "worry", undefined, false)}
      <path d="M42 66l4 4" {...line} />
    </>
  ) },
  /** Slack · Fichier égaré. */
  "slack-file": { box: [36, 28, 184, 124], touch: "coral", gag: "Le devis perdu dans la botte de foin : on sort l'aimant, pas la fourche.", draw: (t) => (
    <>
      <path d="M36 124C48 80 122 70 146 124Z" {...hide} />
      <path d="M58 112l6 -14M78 104l4 -16M122 110l-4 -14M66 122l4 -10" {...fine} />
      <path d="M98 50H120L128 58V84H98Z" transform="rotate(14 113 67)" {...hide} />
      <path d="M120 50V58H128" transform="rotate(14 113 67)" {...fine} />
      <path d="M104 64h14M104 72h10" transform="rotate(14 113 67)" {...fine} />
      <path d="M156 28V48a14 14 0 0 0 28 0V28H174V48a4 4 0 0 1 -8 0V28Z" {...touch(t)} />
      <path d="M156 28h10M174 28h10" {...line} strokeWidth={6} />
      <path d="M138 56l9 -4M140 68l11 -2" {...fine} />
    </>
  ) },
  /** Slack · Réponse délicate. */
  "slack-reply": { box: [28, 30, 208, 120], touch: "sky", gag: "La réponse délicate tire sur sa laisse : elle ne part pas tant que vous ne l'avez pas relue.", draw: (t) => (
    <>
      <path d="M120 52L192 30L150 82L144 64Z" {...touch(t)} />
      <path d="M144 64L192 30" {...fine} />
      <path d="M144 68C122 100 92 80 74 104" {...fine} />
      <path d="M54 104c0 -7 20 -7 20 0v10c0 7 -20 7 -20 0z" {...hide} />
      <path d="M54 110H28" {...line} strokeWidth={8} />
      <path d="M198 44h10M196 56h8" {...fine} />
    </>
  ) },
  /** Tally · Demande de devis. */
  "tally-form": { box: [66, 23, 174, 123], touch: "mint", gag: "Le formulaire se prépare en cabine, rideau tiré : brouillon privé, on ne voit que ses pieds.", draw: (t) => (
    <>
      <path d="M66 24H174" {...line} />
      {[80, 100, 120, 140, 160].map((x) => <circle key={x} cx={x} cy="26" r="3" {...fine} />)}
      <path d="M74 30V110Q84 104 94 110Q104 104 114 110Q124 104 134 110Q144 104 154 110Q164 104 166 110V30Z" {...touch(t)} />
      <path d="M94 34V104M120 34V104M146 34V104" {...fine} />
      <path d="M112 110v12M128 110v12" {...line} />
      {shoe(104, 123, true)}{shoe(127, 123)}
    </>
  ) },
  /** Tally · Retours clients. */
  "tally-feedback": { box: [44, 20, 212, 128], touch: "sky", gag: "Les lunettes lisent pour vous le très long rouleau des réponses, thé à portée de main.", draw: (t) => (
    <>
      <path d="M44 20H100V120H44Z" {...hide} />
      {lines(52, 32, 40, 4, 10)}{lines(52, 74, 40, 4, 10)}
      <path d="M44 120q0 8 8 8h48" {...line} />
      <circle cx="140" cy="66" r="12" {...touch(t)} />
      <circle cx="170" cy="66" r="12" {...touch(t)} />
      <circle cx="140" cy="67" r="2.4" {...ink} /><circle cx="170" cy="67" r="2.4" {...ink} />
      <path d="M152 64q3 -4 6 0M128 64l-14 -8M182 64l10 -6" {...line} />
      <path d="M146 78v24M164 78v24" {...line} />
      {shoe(138, 103, true)}{shoe(163, 103)}
      <path d="M190 108h16v10c0 6 -16 6 -16 0zM206 110q6 0 6 4q0 4 -6 4" {...line} />
      <path d="M196 102q-3 -4 0 -8M202 102q-3 -4 0 -8" {...fine} />
    </>
  ) },
  /** Tally · Inscriptions. */
  "tally-signups": { box: [30, 12, 215, 124], touch: "coral", gag: "La courbe des inscriptions devient une montagne ; un petit grimpeur plante le drapeau au sommet.", draw: (t) => (
    <>
      <path d="M30 124H210" {...line} />
      <path d="M30 124L70 100L100 108L140 60L170 72L200 36" {...line} />
      <path d="M200 36V12" {...line} />
      <path d="M200 12l15 5l-15 5z" {...touch(t)} />
      <circle cx="160" cy="52" r="5" {...hide} />
      <path d="M158 57L154 70M154 70l-4 6M154 70l5 5M156 62l8 -4M156 62l-6 2" {...fine} />
      <path d="M162 60h6v8h-6z" {...ink} />
    </>
  ) },
  /** Webflow · Article de blog. */
  "webflow-draft": { box: [20, 18, 220, 124], touch: "coral", gag: "L'article attend en coulisses, derrière le rideau : en place, pas encore en scène.", draw: (t) => (
    <>
      <path d="M20 124H220" {...line} />
      <path d="M112 18H212" {...line} strokeWidth={7} />
      <path d="M120 22Q130 70 114 124H206V22Z" {...touch(t)} />
      <path d="M150 26Q156 70 144 120M178 26Q182 70 174 120" {...fine} />
      {sheet(62, 54, 34, 46, "worry")}
      <path d="M100 66q3 6 0 9q-3 -3 0 -9" {...fine} />
    </>
  ) },
  /** Webflow · Liens cassés. */
  "webflow-links": { box: [30, 58, 218, 124], touch: "mint", gag: "Les liens morts ont les yeux en croix ; on leur prépare une petite tombe.", draw: (t) => (
    <>
      <path d="M30 124H214" {...line} />
      <path d="M78 98H62a16 16 0 0 1 0 -32H80" {...line} strokeWidth={6} />
      <path d="M100 66H116a16 16 0 0 1 0 32H98" {...line} strokeWidth={6} />
      <path d="M84 58l4 6l-4 4l5 6M94 106l-4 -6l4 -4l-5 -6" {...fine} />
      <path d="M58 76l6 6M64 76l-6 6M112 76l6 6M118 76l-6 6" {...fine} />
      <path d="M144 124q30 -14 60 0z" {...touch(t)} />
      <path d="M160 120V94a14 14 0 0 1 28 0V120Z" {...hide} />
      <path d="M174 98v14M168 104h12" {...fine} />
      <path d="M212 124V88M206 84h12" {...line} />
    </>
  ) },
  /** Webflow · Mise en ligne. */
  "webflow-publish": { box: [80, 46, 190, 126], touch: "butter", gag: "Avant le décollage, la check-list : tout est coché, la fusée peut partir.", draw: (t) => (
    <>
      <path d="M80 126H140" {...line} />
      <path d="M104 120q6 12 12 0z" {...touch(t)} />
      <path d="M100 118V64Q110 38 120 64V118Z" {...hide} />
      <circle cx="110" cy="80" r="5" {...line} />
      <path d="M100 100l-10 18h10M120 100l10 18h-10" {...line} />
      <path d="M150 50H190V112H150Z" {...hide} />
      <path d="M162 46H178V54H162Z" {...ink} />
      <path d="M156 68l3 3l6 -6M156 84l3 3l6 -6M156 100l3 3l6 -6" {...fine} />
      <path d="M170 68h14M170 84h10M170 100h12" {...fine} />
    </>
  ) },
  /** Zapier · Relance client. */
  "zapier-followup": { box: [30, 19, 210, 124], touch: "sky", gag: "La relance s'envole d'elle-même par la fenêtre de l'onglet, sans que vous en changiez.", draw: (t) => (
    <>
      <path d="M30 50H150V124H30Z" {...hide} />
      <path d="M36 50V40H70V50M70 50V40H104V50" {...fine} />
      {lines(42, 66, 70, 4, 12)}
      <path d="M120 46Q132 32 146 30" {...fine} strokeDasharray="2 7" />
      {envelope(152, 22, 36, 24, t)}
      <path d="M152 28q-12 -14 -22 -4M188 28q12 -14 22 -4" {...line} />
    </>
  ) },
  /** Zapier · Tâche à caler. */
  "zapier-task": { box: [60, 10, 222, 126], touch: "coral", gag: "La grue dépose la tâche pile dans la bonne case du tableau.", draw: (t) => (
    <>
      <path d="M222 10H120V34" {...line} />
      <path d="M120 34q0 8 6 8q6 0 6 -6" {...line} />
      <path d="M104 46H136V66H104Z" {...touch(t)} />
      <path d="M110 52h6v6h-6z" {...fine} />
      <path d="M120 66v-2M120 42v4" {...fine} />
      <path d="M60 80H180V126H60Z" {...hide} />
      <path d="M100 80V126M140 80V126" {...fine} />
      <path d="M104 92H136V112H104Z" {...fine} strokeDasharray="3 5" />
      {lines(66, 94, 26, 3, 9)}{lines(146, 94, 26, 3, 9)}
    </>
  ) },
  /** Zapier · Tableur de suivi. */
  "zapier-sheet": { box: [40, 28, 212, 128], touch: "mint", gag: "Les nouveaux contacts glissent sur le toboggan droit dans le tableur.", draw: (t) => (
    <>
      <path d="M40 124V40M56 124V40M40 60h16M40 80h16M40 100h16" {...line} />
      <path d="M56 40C92 40 108 108 150 108" {...line} />
      <path d="M64 30H82V42H64Z" transform="rotate(10 73 36)" {...hide} />
      <path d="M90 50H108V62H90Z" transform="rotate(40 99 56)" {...hide} />
      <path d="M112 78H130V90H112Z" transform="rotate(30 121 84)" {...hide} />
      <path d="M140 104H212V128H140Z" {...touch(t)} />
      <path d="M140 116H212M164 104V128M188 104V128" {...fine} />
      <path d="M150 96l-4 -8M158 94v-9" {...fine} />
      {face(73, 37, "wow", 4)}
    </>
  ) },
} satisfies Record<string, Scene>;
