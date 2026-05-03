import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts, type Post, type ToolSummary } from "@/hooks/useSupabaseData";
import { useEffect, useMemo, lazy, Suspense } from "react";
import { ArrowRight, BookOpen, Clock, Clock3, Database, Euro, ShieldCheck, Sparkles } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { useArticleTools, getArticleGradient } from "@/hooks/useArticleTools";

import HeroSection from "@/components/home/HeroSection";
import TickerBar from "@/components/home/TickerBar";
import StatsSection from "@/components/home/StatsSection";
import FaqBlock from "@/components/FaqBlock";

const HowItWorks = lazy(() => import("@/components/home/HowItWorks"));
const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"));
const DiffTable = lazy(() => import("@/components/home/DiffTable"));
const FinalCTA = lazy(() => import("@/components/home/FinalCTA"));

const FAQ_FR = [
  { q: "Comment ToolTrim analyse-t-il ma stack ?", a: "ToolTrim compare vos outils à une base de 314 outils vérifiés. Il détecte les doublons, les outils dormants et les remplacements possibles — avec des prix vérifiés sur les pages officielles." },
  { q: "Les recommandations sont-elles vraiment fiables ?", a: "ToolTrim ne prescrit que lorsque les données sont vérifiées. Chaque prix est issu de la page officielle de l'outil. Les recommandations incertaines sont signalées explicitement." },
  { q: "ToolTrim est-il gratuit ?", a: "Oui, l'analyse de base est entièrement gratuite." },
  { q: "Combien de temps prend l'analyse ?", a: "Moins de 3 minutes. Vous répondez à quelques questions sur votre profil, sélectionnez vos outils, et recevez instantanément vos recommandations personnalisées." },
  { q: "ToolTrim est-il affilié aux outils recommandés ?", a: "Non. ToolTrim est 100% indépendant. Aucun accord d'affiliation ne biaise les recommandations. Les résultats sont basés uniquement sur votre profil et les données objectives." },
];

const FAQ_EN = [
  { q: "How does ToolTrim analyze my stack?", a: "ToolTrim compares your tools against a database of 314 verified tools. It detects duplicates, dormant tools, and possible replacements — with prices verified on official pages." },
  { q: "Are the recommendations really reliable?", a: "ToolTrim only prescribes when data is verified. Each price comes from the tool's official page. Uncertain recommendations are explicitly flagged." },
  { q: "Is ToolTrim free?", a: "Yes, the basic analysis is completely free." },
  { q: "How long does the analysis take?", a: "Less than 3 minutes. You answer a few questions about your profile, select your tools, and instantly receive personalized recommendations." },
  { q: "Is ToolTrim affiliated with recommended tools?", a: "No. ToolTrim is 100% independent. No affiliate deals bias the recommendations. Results are based solely on your profile and objective data." },
];

const HomePage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);

  const stats = useMemo(() => {
    const free = tools.filter(t => t.defaultMonthlyPrice === 0).length;
    const withFree = tools.filter(t => t.pricing?.free).length;
    return { total: tools.length, free, withFree, categories: categories.length };
  }, [tools, categories]);

  const featuredPosts = posts.slice(0, 3);
  const faq = lang === "fr" ? FAQ_FR : FAQ_EN;

  useEffect(() => {
    const title = lang === "fr"
      ? "ToolTrim — Audit de stack SaaS | Prix réels & alternatives vérifiées"
      : "ToolTrim — SaaS Stack Audit | Real Pricing & Verified Alternatives";
    const desc = lang === "fr"
      ? `Tu paies des abonnements que tu n'utilises plus ? ToolTrim analyse ta stack, détecte les doublons et trouve les alternatives moins chères. ${stats.total} outils vérifiés manuellement.`
      : `Paying for tools you don't use? ToolTrim audits your SaaS stack, spots redundant subscriptions, and finds cheaper alternatives. ${stats.total} tools manually verified.`;
    const url = `${SEO_BASE}/${lang}`;
    setSeoTags({ title, description: desc, url, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}`);
    setJsonLd("home-jsonld", { "@context": "https://schema.org", "@type": "WebSite", name: "ToolTrim", url: SEO_BASE, description: desc, potentialAction: { "@type": "SearchAction", target: `${SEO_BASE}/${lang}/tools?q={search_term_string}`, "query-input": "required name=search_term_string" } });
    setJsonLd("home-org-jsonld", { "@context": "https://schema.org", "@type": "Organization", name: "ToolTrim", url: SEO_BASE, logo: `${SEO_BASE}/picto-logo.svg`, sameAs: [] });
    setJsonLd("home-faq-jsonld", { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) });
    return () => cleanupSeo(["home-jsonld", "home-org-jsonld", "home-faq-jsonld"]);
  }, [lang, stats.total]);

  return (
    <div>
      {/* 1. Hero */}
      <HeroSection toolCount={stats.total} />

      {/* 2. Ticker */}
      <TickerBar />

      {/* 3. Stats */}
      <StatsSection toolCount={stats.total} categoryCount={stats.categories} />

      {/* 4. How it works */}
      <Suspense fallback={null}><HowItWorks /></Suspense>

      {/* 5. Differentiator */}
      <Suspense fallback={null}><DiffTable toolCount={stats.total} /></Suspense>

      {/* 6. Testimonials */}
      <Suspense fallback={null}><TestimonialsSection /></Suspense>

      {/* 7. Categories */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label-section mb-3">{t("Catalogue", "Catalog")}</p>
              <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.6rem)", fontWeight: 600, letterSpacing: "-0.02em" }}>
                {t("Catégories ", "Tool ")}<em className="text-primary not-italic">{t("d'outils", "categories")}</em>
              </h2>
              <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t(`${stats.categories} catégories couvrant tous les besoins de votre activité.`, `${stats.categories} categories covering all your business needs.`)}
              </p>
            </div>
            <Link to={`${prefix}/category`} className="hidden md:inline-flex text-sm font-medium text-primary hover:underline">{t("Voir toutes →", "See all →")}</Link>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              const count = tools.filter((tool) => tool.categoryId === cat.id).length;
              return (
                <Link
                  key={cat.id}
                  to={`${prefix}/category/${cat.slug}`}
                  className="group rounded-xl border border-border bg-card p-5 cursor-pointer transition-colors duration-150"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.4)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ""; }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium tracking-tight group-hover:text-primary transition-colors duration-200 truncate text-sm">
                        {t(cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), cat.nameEn?.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "") || cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""))}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{count} {t("outils", "tools")}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-30 transition-all duration-200 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
          <Link to={`${prefix}/category`} className="mt-5 inline-flex md:hidden text-sm font-medium text-primary hover:underline">{t("Voir toutes les catégories →", "See all categories →")}</Link>
        </div>
      </section>

      {/* 8. Guides */}
      {featuredPosts.length > 0 && (
        <section className="border-t border-border bg-secondary/20 py-24">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-primary mb-3">
                  <BookOpen className="h-4 w-4" />
                  <span className="label-section">{t("Ressources", "Resources")}</span>
                </div>
                <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.6rem)", fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {t("Derniers ", "Latest ")}<em className="text-primary not-italic">{t("guides", "guides")}</em>
                </h2>
                <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {t("Comparatifs, tutoriels et conseils pour optimiser votre stack.", "Comparisons, tutorials and tips to optimize your stack.")}
                </p>
              </div>
              <Link to={`${prefix}/guides`} className="text-sm font-medium text-primary hover:underline">{t("Tous les guides", "All guides")} →</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {featuredPosts.map((post) => (
                <GuideCard key={post.slug} post={post} prefix={prefix} tools={tools} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. FAQ */}
      <section id="faq" className="scroll-mt-24 border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-6">
          <FaqBlock
            eyebrow={t("Questions fréquentes", "Frequently asked questions")}
            title={t("Questions fréquentes", "Frequently asked questions")}
            description={t(
              "Une FAQ pensée comme une vraie zone de décision : périmètre, fiabilité, prix, durée et indépendance.",
              "A FAQ designed as a real decision area: scope, reliability, pricing, timing, and independence."
            )}
            stats={[
              { value: `${stats.total}`, label: t("outils vérifiés", "verified tools") },
              { value: "3 min", label: t("en moyenne", "on average") },
            ]}
            items={faq.map((item, index) => ({
              question: item.q,
              answer: item.a,
              icon: [Database, ShieldCheck, Euro, Clock3, Sparkles][index] || Sparkles,
            }))}
            openCount={2}
          />
        </div>
      </section>

      {/* 9. Final CTA */}
      <Suspense fallback={null}><FinalCTA /></Suspense>
    </div>
  );
};

/* ── Guide card (styled like GuidesPage) ── */
function GuideCard({ post, prefix, tools }: { post: Post; prefix: string; tools: ToolSummary[] }) {
  const mentionedTools = useArticleTools(post, tools);
  const gradient = getArticleGradient(post.slug, post.category);

  return (
    <Link
      to={`${prefix}/guide/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-150"
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.4)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ""; }}
    >
      <div className={`relative flex items-center justify-center bg-gradient-to-br ${gradient} px-4 py-6`}>
        {mentionedTools.length > 0 ? (
          <div className="flex items-center gap-2">
            {mentionedTools.slice(0, 4).map((tool) => (
              <div key={tool.id} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${getToolDomain(tool)}&sz=64`}
                  alt={tool.name}
                  className="h-6 w-6 rounded object-contain"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            ))}
            {mentionedTools.length > 4 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-xs font-bold text-muted-foreground">
                +{mentionedTools.length - 4}
              </div>
            )}
          </div>
        ) : (
          <BookOpen className="h-8 w-8 text-primary/25" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {post.category && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">{post.category}</span>
          )}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime || "5 min"}</span>
        </div>
        <h3 className="mt-3 text-base font-bold tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{post.excerpt}</p>
      </div>
    </Link>
  );
}

function getToolDomain(tool: ToolSummary): string {
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

export default HomePage;
