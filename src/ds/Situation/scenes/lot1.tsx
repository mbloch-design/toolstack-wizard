import { bubble, envelope, face, fine, hide, ink, legs, line, lines, sheet, shoe, speed, touch, type Scene } from "./kit";

/** Ahrefs, Airtable, Buffer, Calendly (19/11, « décliner »). Buffer's « Un post, deux réseaux » reuses canva-post. */
export const LOT1 = {
  /** Ahrefs · Bilan client: the best bar of the month stands on tiptoe to look taller still. */
  "ahrefs-report": { box: [38, 28, 206, 128], touch: "mint", gag: "La meilleure barre du mois se met sur la pointe des pieds pour paraître plus grande encore.", draw: (t) => (
    <>
      <path d="M38 128H206M38 128V28" {...line} />
      <path d="M54 128V92H72V128Z" {...hide} />
      <path d="M84 128V70H102V128Z" {...hide} />
      <path d="M114 108V36H134V108Z" {...touch(t)} />
      {face(124, 60, "smug", 5)}
      <path d="M119 108v16M129 108v16" {...line} />
      {shoe(111, 125, true)}{shoe(128, 125)}
      <path d="M106 118l-6 -2M142 118l6 -2" {...fine} />
      <path d="M146 128V102H164V128Z" {...hide} />
      <path d="M184 46l8 -10l8 10M192 36v26" {...fine} />
    </>
  ) },
  /** Ahrefs · Liens des concurrents: two rival sites holding hands, and you, taking notes behind one of them. */
  "ahrefs-links": { box: [36, 30, 208, 137], touch: "sky", gag: "Deux sites concurrents se tiennent par la main ; vous prenez des notes, caché derrière l'un d'eux.", draw: (t) => (
    <>
      <path d="M36 40H100V92H36Z" {...hide} />
      <path d="M36 50H100" {...fine} /><circle cx="43" cy="45" r="1.6" {...ink} /><circle cx="49" cy="45" r="1.6" {...ink} />
      {lines(46, 62, 40, 3)}
      <path d="M144 30H208V82H144Z" {...hide} />
      <path d="M144 40H208" {...fine} /><circle cx="151" cy="35" r="1.6" {...ink} /><circle cx="157" cy="35" r="1.6" {...ink} />
      {lines(154, 52, 40, 3)}
      <rect x="104" y="58" width="22" height="11" rx="5.5" transform="rotate(-14 115 63)" {...line} />
      <rect x="118" y="53" width="22" height="11" rx="5.5" transform="rotate(-14 129 58)" {...line} />
      {sheet(60, 96, 26, 28, "smug", undefined, false)}
      <path d="M88 106h6" {...line} />
      <path d="M94 98H110V118H94Z" {...touch(t)} />
      <path d="M98 104h8M98 110h6" {...fine} />
    </>
  ) },
  /** Ahrefs · Idées d'articles: the bright idea carries the coffee table people search for, legs in the air. */
  "ahrefs-ideas": { box: [76, 12, 175, 111], touch: "butter", gag: "La bonne idée porte la table basse que les gens cherchent, les pieds en l'air.", draw: (t) => (
    <>
      <path d="M76 30H164M86 30V12M154 30V12" {...line} />
      <path d="M100 58C96 48 96 40 100 32M140 58C144 48 144 40 140 32" {...line} />
      <circle cx="120" cy="62" r="22" {...touch(t)} />
      {face(120, 58, "grin", 6)}
      <path d="M110 84H130V96H110Z" {...hide} />
      <path d="M110 90H130" {...fine} />
      {legs(114, 126, 96, 14)}
      <path d="M168 50q3 6 0 8q-3 -2 0 -8M174 64q2 4 0 6q-2 -2 0 -6" {...fine} />
    </>
  ) },
  /** Airtable · Relances clients: the client table, one contact asleep under a cobweb, the bell already ringing. */
  "airtable-followup": { box: [30, 30, 226, 120], touch: "coral", gag: "La table des clients : un contact dort sous une toile d'araignée, la cloche sonne déjà.", draw: (t) => (
    <>
      <path d="M30 30H170V120H30Z" {...hide} />
      <path d="M30 60H170M30 90H170M68 30V120" {...fine} />
      <circle cx="49" cy="45" r="9" {...hide} /><circle cx="46" cy="44" r="1.5" {...ink} /><circle cx="52" cy="44" r="1.5" {...ink} />
      <circle cx="49" cy="75" r="9" {...hide} /><circle cx="46" cy="74" r="1.5" {...ink} /><circle cx="52" cy="74" r="1.5" {...ink} />
      <circle cx="49" cy="105" r="9" {...hide} /><path d="M44 104q2 2 4 0M50 104q2 2 4 0" {...fine} />
      {lines(78, 42, 60, 2)}{lines(78, 72, 54, 2)}{lines(78, 102, 40, 1)}
      <path d="M170 120h-16M170 120v-16M170 120l-12 -12M159 120q1 -7 11 -11" {...fine} />
      <path d="M186 76C186 56 190 46 200 46C210 46 214 56 214 76Z" {...touch(t)} />
      <circle cx="200" cy="80" r="3.2" {...ink} />
      <path d="M200 46v-6M222 50q6 5 3 13M178 50q-6 5 -3 13" {...fine} />
    </>
  ) },
  /** Airtable · Nouveaux prospects: the business cards from the trade fair, thrown straight into the table. */
  "airtable-prospects": { box: [22, 30, 212, 126], touch: "sky", gag: "Les cartes de visite du salon, lancées droit dans la table, comme au basket.", draw: (t) => (
    <>
      <path d="M44 104Q100 6 166 74" {...fine} strokeDasharray="2 9" />
      <path d="M52 64H72V77H52Z" transform="rotate(-20 62 70)" {...hide} />
      <path d="M86 32H106V45H86Z" transform="rotate(12 96 38)" {...hide} />
      <path d="M124 38H144V51H124Z" transform="rotate(30 134 44)" {...touch(t)} />
      <path d="M140 76H212V126H140Z" {...hide} />
      <path d="M140 92H212M140 109H212M164 76V126M188 76V126" {...fine} />
      <path d="M22 124c6 -12 18 -14 24 -4M34 112l4 -10" {...line} />
    </>
  ) },
  /** Airtable · Suivi des factures: ask for a table, get a table, on four legs. */
  "airtable-table": { box: [50, 12, 198, 128], touch: "mint", gag: "On demande une table, on obtient une table, sur quatre pieds.", draw: (t) => (
    <>
      {bubble(86, 12, 64, 28)}
      {lines(98, 22, 40, 2)}
      <path d="M50 56H170V66H50Z" {...touch(t)} />
      <path d="M50 66H170V88H50Z" {...hide} />
      <path d="M90 56V88M130 56V88M50 77H170" {...fine} />
      <path d="M58 88L54 128M162 88L166 128M84 88L82 120M138 88L140 120" {...line} />
      <path d="M182 42l4 -8M190 52l8 -2M182 62l6 4" {...fine} />
    </>
  ) },
  /** Buffer · Post de la semaine: the draft on the diving board, not jumping until you have read it. */
  "buffer-draft": { box: [26, 18, 212, 132], touch: "sky", gag: "Le brouillon au bord du plongeoir : il ne saute pas tant que vous ne l'avez pas relu.", draw: (t) => (
    <>
      <path d="M26 70H124M40 70V132" {...line} />
      {sheet(94, 18, 30, 38, "worry")}
      <path d="M132 24q3 6 0 9q-3 -3 0 -9" {...fine} />
      <path d="M130 108q10 -6 20 0t20 0t20 0t20 0V132H130Z" {...touch(t)} />
      <path d="M128 92V132M212 92V132" {...line} />
    </>
  ) },
  /** Buffer · Bilan du mois: the post that worked, on top of the podium, medal on. */
  "buffer-stats": { box: [48, 28, 172, 132], touch: "butter", gag: "Le post qui a marché, en haut du podium, médaille au cou.", draw: (t) => (
    <>
      <path d="M48 132V104H88V74H132V104H172V132Z" {...hide} />
      <path d="M88 104V132M132 104V132" {...fine} />
      {sheet(98, 28, 24, 32, "grin", undefined, false)}
      <path d="M106 50l4 4l4 -4" {...fine} />
      <circle cx="110" cy="58" r="4" {...touch(t)} />
      {sheet(58, 62, 22, 28, "flat", undefined, false)}
      {sheet(140, 62, 22, 28, "worry", undefined, false)}
    </>
  ) },
  /** Calendly · Proposer des créneaux: the meeting e-mail runs out, three slots on a tray. */
  "calendly-slots": { box: [32, 14, 125, 99], touch: "sky", gag: "Le mail de rendez-vous part en courant, trois créneaux sur un plateau.", draw: (t) => (
    <>
      <path d="M58 28H124" {...line} />
      <path d="M66 14H80V26H66ZM86 14H100V26H86ZM106 14H120V26H106Z" {...touch(t)} />
      <path d="M66 60C56 50 58 38 64 30M118 60C128 50 126 38 118 30" {...line} />
      {envelope(60, 46, 62, 40)}
      {face(91, 74, "grin", 6)}
      {legs(80, 102, 86, 12)}
      {speed(54, 56)}
    </>
  ) },
  /** Calendly · Semaine à venir: the week juggles its appointments, one in the air at all times. */
  "calendly-week": { box: [70, 7, 170, 126], touch: "butter", gag: "La semaine jongle avec ses rendez-vous, toujours un en l'air.", draw: (t) => (
    <>
      <path d="M80 34Q100 0 120 10Q140 0 160 34" {...fine} strokeDasharray="2 8" />
      <circle cx="78" cy="40" r="8" {...hide} /><circle cx="162" cy="40" r="8" {...hide} />
      <circle cx="120" cy="16" r="8" {...touch(t)} />
      <path d="M92 82C80 72 78 58 80 50M148 82C160 72 162 58 160 50" {...line} />
      <path d="M92 58H148V112H92Z" {...hide} />
      <path d="M102 52v10M138 52v10M92 70H148" {...fine} />
      {face(120, 88, "worry", 7)}
      {legs(108, 132, 112, 12)}
    </>
  ) },
  /** Calendly · Bloquer un jour: Friday is gone deep work, so deep only the snorkel shows. */
  "calendly-friday": { box: [30, 18, 195, 118], touch: "sky", gag: "Le vendredi est parti travailler en profondeur, si profond qu'on ne voit que le tuba.", draw: (t) => (
    <>
      <path d="M30 30H190V118H30Z" {...hide} />
      <path d="M30 44H190M62 44V118M94 44V118M126 44V118M158 44V118M44 24v12M176 24v12" {...fine} />
      <path d="M158 60q4 -4 8 0t8 0t8 0t8 0V118H158Z" {...touch(t)} />
      <path d="M176 58V38h7" {...line} />
      <circle cx="188" cy="28" r="2" {...fine} /><circle cx="193" cy="20" r="1.5" {...fine} />
      <path d="M36 52H56V62H36ZM100 70H120V80H100ZM68 88H88V98H68ZM132 52H152V62H132Z" {...hide} />
    </>
  ) },
} satisfies Record<string, Scene>;
