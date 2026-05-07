import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Props {
  lang: "fr" | "en";
}

const guides = {
  fr: [
    {
      label: "Dev / Tech",
      slug: "meilleurs-outils-developpeur-freelance",
      desc: "Cursor, Vercel, Supabase, ChatGPT Pro",
      // Ville la nuit depuis une fenêtre haute — le dev construit quand les autres dorment, énergie nocturne
      photo: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=900&q=85",
      wide: true,
    },
    {
      label: "Designer",
      slug: "meilleurs-outils-designer-freelance",
      desc: "Figma, Adobe CC, Midjourney",
      // Peinture qui déborde, couleur et matière physique — le designer pense avec ses mains avant ses outils
      photo: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=900&q=85",
      wide: false,
    },
    {
      label: "Consultant",
      slug: "meilleurs-outils-consultant-freelance",
      desc: "Notion, Pipedrive, Calendly, Zoom",
      // Aile d'avion au coucher du soleil — toujours en déplacement, la perspective depuis le haut
      photo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=85",
      wide: false,
    },
    {
      label: "Content",
      slug: "meilleurs-outils-createur-contenu-freelance",
      desc: "Beehiiv, Canva, Buffer, Descript",
      // Concert live, lumières et foule — le créateur construit une relation avec son audience, pas juste du contenu
      photo: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=85",
      wide: false,
    },
    {
      label: "Ops / PMO",
      slug: "meilleurs-outils-ops-manager-freelance",
      desc: "Asana, Qonto, Make, Pipedrive",
      // Échangeur autoroutier vu du ciel de nuit — flux, coordination invisible, tout circule sans friction
      photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=85",
      wide: true,
    },
  ],
  en: [
    {
      label: "Dev / Tech",
      slug: "best-tools-freelance-developer",
      desc: "Cursor, Vercel, Supabase, ChatGPT Pro",
      photo: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=900&q=85",
      wide: true,
    },
    {
      label: "Designer",
      slug: "best-tools-freelance-designer",
      desc: "Figma, Adobe CC, Midjourney",
      photo: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=900&q=85",
      wide: false,
    },
    {
      label: "Consultant",
      slug: "best-tools-freelance-consultant",
      desc: "Notion, Pipedrive, Calendly, Zoom",
      photo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=85",
      wide: false,
    },
    {
      label: "Content",
      slug: "best-tools-freelance-content-creator",
      desc: "Beehiiv, Canva, Buffer, Descript",
      photo: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=85",
      wide: false,
    },
    {
      label: "Ops / PMO",
      slug: "best-tools-freelance-ops-manager",
      desc: "Asana, Qonto, Make, Pipedrive",
      photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=85",
      wide: true,
    },
  ],
};

export default function PersonaGuidesSection({ lang }: Props) {
  const items = guides[lang];

  return (
    <section className="border-t border-border py-20">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-3">
            {lang === "fr" ? "Par profil" : "By profile"}
          </p>
          <h2
            className="font-display text-foreground"
            style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1 }}
          >
            {lang === "fr" ? (
              <>Guides par <em className="text-primary not-italic">profil freelance</em></>
            ) : (
              <>Guides by <em className="text-primary not-italic">freelance profile</em></>
            )}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {lang === "fr"
              ? "Les outils qui font vraiment la différence, par métier."
              : "The tools that actually matter, by role."}
          </p>
        </div>

        {/* Bento grid — row 1: wide + narrow, row 2: narrow + narrow + wide */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

          {/* Row 1 */}
          {/* Dev/Tech — wide (lg: span 2) */}
          <PersonaCard item={items[0]} lang={lang} className="lg:col-span-2" tall />

          {/* Designer */}
          <PersonaCard item={items[1]} lang={lang} tall />

          {/* Row 2 */}
          {/* Consultant */}
          <PersonaCard item={items[2]} lang={lang} />

          {/* Content */}
          <PersonaCard item={items[3]} lang={lang} />

          {/* Ops — wide (lg: span 1 in a 3-col grid, but takes the last spot) */}
          <PersonaCard item={items[4]} lang={lang} />

        </div>
      </div>
    </section>
  );
}

function PersonaCard({
  item,
  lang,
  className = "",
  tall = false,
}: {
  item: { label: string; slug: string; desc: string; photo: string };
  lang: "fr" | "en";
  className?: string;
  tall?: boolean;
}) {
  return (
    <Link
      to={`/${lang}/guide/${item.slug}`}
      className={`group relative block overflow-hidden rounded-xl ${tall ? "min-h-72" : "min-h-56"} ${className}`}
    >
      {/* Photo */}
      <img
        src={item.photo}
        alt={item.label}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        loading="lazy"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />

      {/* Subtle color tint on hover */}
      <div className="absolute inset-0 bg-primary/0 transition-colors duration-300 group-hover:bg-primary/10" />

      {/* Content — pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p
          className="font-display text-white"
          style={{ fontSize: "clamp(1.125rem, 2vw, 1.375rem)", fontWeight: 600, letterSpacing: "-0.02em" }}
        >
          {item.label}
        </p>
        <p className="mt-1 text-sm text-white/65 leading-snug">
          {item.desc}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-white/50 transition-colors group-hover:text-white/80">
          {lang === "fr" ? "Voir le guide" : "See guide"}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
