import { Link } from "react-router-dom";

interface Props {
  lang: "fr" | "en";
}

const guides = {
  fr: [
    { icon: "💻", label: "Dev / Tech", slug: "meilleurs-outils-developpeur-freelance", desc: "Cursor, Vercel, ChatGPT Pro…" },
    { icon: "🎨", label: "Designer", slug: "meilleurs-outils-designer-freelance", desc: "Figma, Adobe CC, Midjourney…" },
    { icon: "📊", label: "Consultant", slug: "meilleurs-outils-consultant-freelance", desc: "Calendly, HubSpot, Zoom…" },
    { icon: "📝", label: "Content", slug: "meilleurs-outils-createur-contenu-freelance", desc: "Beehiiv, Canva, Buffer…" },
    { icon: "⚡", label: "Ops", slug: "meilleurs-outils-ops-manager-freelance", desc: "Asana, Qonto, Pipedrive…" },
  ],
  en: [
    { icon: "💻", label: "Dev / Tech", slug: "best-tools-freelance-developer", desc: "Cursor, Vercel, ChatGPT Pro…" },
    { icon: "🎨", label: "Designer", slug: "best-tools-freelance-designer", desc: "Figma, Adobe CC, Midjourney…" },
    { icon: "📊", label: "Consultant", slug: "best-tools-freelance-consultant", desc: "Calendly, HubSpot, Zoom…" },
    { icon: "📝", label: "Content", slug: "best-tools-freelance-content-creator", desc: "Beehiiv, Canva, Buffer…" },
    { icon: "⚡", label: "Ops", slug: "best-tools-freelance-ops-manager", desc: "Asana, Qonto, Pipedrive…" },
  ],
};

export default function PersonaGuidesSection({ lang }: Props) {
  const items = guides[lang];
  return (
    <section className="border-t border-border py-20">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary mb-2">
          {lang === "fr" ? "Par profil" : "By profile"}
        </p>
        <h2 className="text-4xl font-extrabold tracking-[-1.5px] md:text-[44px]">
          {lang === "fr" ? "Guides par " : "Guides by "}
          <em className="text-primary italic">
            {lang === "fr" ? "profil freelance" : "freelance profile"}
          </em>
        </h2>
        <p className="mt-2 text-muted-foreground">
          {lang === "fr"
            ? "Trouvez les meilleurs outils pour votre métier."
            : "Find the best tools for your role."}
        </p>

        <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {items.map((g) => (
            <Link
              key={g.slug}
              to={`/${lang}/guide/${g.slug}`}
              className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 transition-all duration-300 hover:bg-card hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="text-2xl mb-3" aria-hidden>
                {g.icon}
              </div>
              <p className="font-semibold tracking-tight group-hover:text-primary transition-colors">
                {g.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{g.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
