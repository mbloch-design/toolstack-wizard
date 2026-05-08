import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, SEO_BASE } from "@/lib/seo";

export default function ArticleFacturation() {
  useEffect(() => {
    setSeoTags({
      title:
        "Logiciel facturation freelance 2026 : le guide honnête (+ obligation e-invoicing) | tooltrim.com",
      description:
        "Comparatif sans filtre des meilleurs outils de facturation pour freelances et TPE en 2026. Pennylane, Indy, Freebe, Dougs — et tout ce que vous devez savoir sur l'obligation de facturation électronique de septembre 2026.",
      url: `${SEO_BASE}/fr/guide/outils-facturation-freelance-2026`,
      type: "article",
    });
  }, []);

  const breadcrumbItems = [
    { label: "Guides", href: "/fr/guides" },
    { label: "Outils de facturation freelance 2026" },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Quand la facturation électronique devient-elle obligatoire pour les freelances ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "À partir du 1er septembre 2026, toutes les entreprises — y compris les freelances et TPE assujettis à la TVA — doivent être capables de recevoir des factures électroniques. L'obligation d'émission s'applique aux TPE et micro-entrepreneurs à partir du 1er septembre 2027.",
        },
      },
      {
        "@type": "Question",
        name: "Quel est le meilleur logiciel de facturation pour freelance en 2026 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Selon les audits tooltrim.com, le choix dépend du statut juridique. Pour un micro-entrepreneur : Freebe ou Indy (facturation gratuite). Pour une SASU ou EURL : Pennylane ou Dougs. Pour une facturation simple avec néobanque : Qonto intégré. L'essentiel est de choisir un outil certifié ou en cours de certification PDP pour la réforme e-invoicing 2026.",
        },
      },
      {
        "@type": "Question",
        name: "Pennylane ou Indy : lequel choisir en freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Indy est optimisé pour les indépendants sous BNC et les micro-entrepreneurs (facturation gratuite, compta automatisée ~25€/mois). Pennylane est plus adapté aux structures avec un expert-comptable ou une vision trésorerie complexe (à partir de ~37€/mois). Les utiliser en parallèle est un doublon coûteux.",
        },
      },
      {
        "@type": "Question",
        name: "Qu'est-ce qu'une PDP (Plateforme de Dématérialisation Partenaire) ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Une PDP est une plateforme agréée par l'État pour transmettre les factures électroniques dans le cadre de la réforme e-invoicing. À partir de septembre 2026, les factures entre entreprises assujetties à la TVA devront transiter par une PDP certifiée. La question à poser à votre logiciel de facturation : est-il certifié PDP ou partenaire d'une PDP agréée ?",
        },
      },
      {
        "@type": "Question",
        name: "Freebe est-il compatible avec la facturation électronique obligatoire 2026 ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Freebe est en cours d'adaptation à la réforme e-invoicing. Avant de souscrire ou renouveler un abonnement annuel sur n'importe quel outil, vérifiez directement auprès de l'éditeur son calendrier de conformité PDP.",
        },
      },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Outils de compta et facturation électronique : le guide honnête pour freelances et TPE (2026)",
    description:
      "Comparatif sans filtre des meilleurs outils de facturation pour freelances et TPE en 2026, avec tout ce que vous devez savoir sur l'obligation de facturation électronique qui arrive en septembre.",
    datePublished: "2026-05-08",
    dateModified: "2026-05-08",
    author: { "@type": "Organization", name: "tooltrim.com", url: SEO_BASE },
    publisher: { "@type": "Organization", name: "tooltrim.com", url: SEO_BASE },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SEO_BASE}/fr/guide/outils-facturation-freelance-2026`,
    },
  };

  const matrice = [
    { profil: "Micro-entrepreneur / auto-entrepreneur", outil: "Freebe ou Indy", raison: "Pensé pour ce statut, prix cohérent" },
    { profil: "Freelance professions libérales (BNC)", outil: "Indy", raison: "Compta automatisée, TVA incluse" },
    { profil: "Freelance en SASU active", outil: "Pennylane ou Dougs", raison: "Besoin d'un vrai suivi comptable" },
    { profil: "TPE 2–10 salariés", outil: "Pennylane", raison: "Vision trésorerie + expert-comptable" },
    { profil: "TPE qui veut tout déléguer", outil: "Dougs", raison: "Package tout-en-un" },
    { profil: "Déjà sur Qonto, facturation simple", outil: "Module Qonto intégré", raison: "Évite un doublon inutile" },
  ];

  const faqDisplay = [
    {
      q: "Quand la facturation électronique devient-elle obligatoire pour les freelances ?",
      a: "À partir du 1er septembre 2026, toutes les entreprises assujetties à la TVA — y compris les freelances — doivent être capables de recevoir des factures électroniques. L'obligation d'émission s'étend aux TPE et micro-entrepreneurs à partir du 1er septembre 2027.",
    },
    {
      q: "Quel est le meilleur logiciel de facturation pour freelance en 2026 ?",
      a: "Selon les audits tooltrim.com, ça dépend du statut juridique. Micro-entrepreneur : Freebe ou Indy. Freelance BNC : Indy. SASU/EURL : Pennylane ou Dougs. Déjà sur Qonto : module intégré suffit. L'essentiel est de choisir un outil certifié ou en cours de certification PDP.",
    },
    {
      q: "Pennylane ou Indy : lequel choisir ?",
      a: "Indy est optimisé pour les indépendants sous BNC et micro-entrepreneurs (facturation gratuite, compta automatisée ~25€/mois). Pennylane est plus adapté aux structures avec un expert-comptable ou une vision trésorerie complexe (à partir de ~37€/mois). Les utiliser en parallèle est un doublon coûteux.",
    },
    {
      q: "Qu'est-ce qu'une PDP (Plateforme de Dématérialisation Partenaire) ?",
      a: "Une PDP est une plateforme agréée par l'État pour transmettre les factures électroniques dans le cadre de la réforme e-invoicing. La question à poser à votre logiciel de facturation : est-il certifié PDP ou partenaire d'une PDP agréée ?",
    },
  ];

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <article className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* HERO */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          Outils de compta et facturation électronique : le guide honnête pour freelances et TPE (2026)
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Tu as déjà passé deux heures à comparer Pennylane, Indy, Freebe et Dougs sur des sites qui concluent tous que «&nbsp;ça dépend de tes besoins&nbsp;» ? Ce guide n'est pas celui-là. Ici, on parle entre gens qui ont un vrai problème à résoudre — et qui ont une date butoir dans le calendrier.
        </p>

        {/* ALERTE OBLIGATION */}
        <section className="mt-10 rounded-xl border-l-4 border-primary bg-muted/40 p-6">
          <h2 className="text-xl font-bold text-foreground">⚠ Ce qui change en septembre 2026</h2>
          <p className="mt-3 text-foreground font-medium">
            La facturation électronique devient obligatoire. Deux dates à retenir :
          </p>
          <ul className="mt-4 space-y-2 text-foreground">
            <li><strong>1er septembre 2026</strong> — Toutes les entreprises (TPE, freelances assujettis à la TVA) doivent être capables de recevoir des factures électroniques via une plateforme agréée.</li>
            <li><strong>1er septembre 2027</strong> — Obligation d'émettre pour les TPE, PME et micro-entrepreneurs.</li>
          </ul>
          <p className="mt-4 text-muted-foreground">
            Si tu travailles avec des grandes entreprises ou ETI, elles exigeront que tes factures arrivent au bon format dès 2026. Pas de bon format = pas de paiement.
          </p>
        </section>

        {/* COMPARATIF */}
        <h2 className="mt-14 text-2xl md:text-3xl font-extrabold text-foreground">
          Le vrai comparatif : ce que chaque outil vaut (et pour qui)
        </h2>

        {[
          {
            name: "Freebe",
            price: "9–15 €/mois",
            bien: "Pensé exclusivement pour les freelances. Création devis/factures rapide, suivi des paiements clair, automatisation URSSAF pour micro-entrepreneurs. Si tu passes moins de temps sur les factures, c'est souvent grâce à lui.",
            moins: "Vision trésorerie basique. Limites rapides pour les structures en SAS/SASU avec associés. Intégration bancaire moins poussée que les concurrents.",
            pour: "freelance solo, micro-entrepreneur, facturation simple.",
            link: null,
          },
          {
            name: "Indy",
            price: "Facturation gratuite",
            bien: "Le module facturation est totalement gratuit et illimité. La synchronisation bancaire est solide. Compta automatisée pour BNC — déclaration TVA et liasse fiscale sans toucher un tableur.",
            moins: "Optimisé pour professions libérales et micro-entrepreneurs. Si tu es en SAS ou SARL, les fonctionnalités comptables deviennent moins pertinentes.",
            pour: "freelance BNC, indépendant qui veut automatiser sa compta sans payer cher.",
            link: "/fr/tool/indy",
          },
          {
            name: "Pennylane",
            price: "à partir de 37 €/mois",
            bien: "La collaboration expert-comptable en temps réel est vraiment bien faite. Vision trésorerie solide pour les TPE avec plusieurs clients et flux dense. Le plus complet du marché si tu as besoin de tout ça.",
            moins: "Souvent présenté comme LA solution freelance. La réalité : pour un freelance solo qui envoie 10 factures par mois, le rapport qualité/prix est discutable. Tu paies pour des fonctionnalités que tu n'utilises pas.",
            pour: "TPE structurée, entrepreneur qui travaille avec un expert-comptable.",
            link: "/fr/tool/pennylane",
          },
          {
            name: "Dougs",
            price: "à partir de 49 €/mois",
            bien: "Un hybride outil + cabinet comptable. Tu paies pour les deux — et la vraie valeur ajoutée est humaine : un comptable attitré qui suit ton dossier. Pour une SASU en croissance, le coût peut être inférieur à un cabinet traditionnel.",
            moins: "Pour un freelance qui débute, 49-80 €/mois c'est lourd. Ce n'est pas l'outil pour commencer — c'est l'outil pour ne plus penser à la compta.",
            pour: "SASU/SAS en croissance, dirigeant qui veut déléguer sans chercher un cabinet.",
            link: null,
          },
          {
            name: "Qonto (module facturation)",
            price: "Inclus dans l'abonnement",
            bien: "Si tu utilises déjà Qonto comme compte pro, son module facturation intégré est suffisant pour la plupart des freelances qui facturent moins de 15-20 fois par mois. Inutile de s'abonner à un outil dédié en plus — c'est un doublon coûteux.",
            moins: null,
            pour: "déjà client Qonto, facturation simple, volume modéré.",
            link: "/fr/tool/qonto",
          },
        ].map((tool) => (
          <section key={tool.name} className="mt-8 rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-bold text-foreground">{tool.name}</h3>
              <span className="font-mono text-sm text-muted-foreground">{tool.price}</span>
            </div>
            <p className="mt-4 font-semibold text-foreground">✓ Ce qu'il fait bien</p>
            <p className="mt-1 text-muted-foreground">{tool.bien}</p>
            {tool.moins && (
              <>
                <p className="mt-4 font-semibold text-foreground">✗ Ce qu'il fait moins bien</p>
                <p className="mt-1 text-muted-foreground">{tool.moins}</p>
              </>
            )}
            <p className="mt-4 text-foreground"><strong>Pour qui :</strong> {tool.pour}</p>
            {tool.link && (
              <p className="mt-4">
                <Link to={tool.link} className="text-primary font-medium hover:underline">
                  Voir l'analyse {tool.name.split(" ")[0]} sur tooltrim.com →
                </Link>
              </p>
            )}
          </section>
        ))}

        {/* MATRICE */}
        <h2 className="mt-14 text-2xl md:text-3xl font-extrabold text-foreground">
          La matrice honnête : qui choisit quoi
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 font-bold text-foreground">Profil</th>
                <th className="py-3 pr-4 font-bold text-foreground">Outil recommandé</th>
                <th className="py-3 font-bold text-foreground">Pourquoi</th>
              </tr>
            </thead>
            <tbody>
              {matrice.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-3 pr-4 text-foreground">{row.profil}</td>
                  <td className="py-3 pr-4 font-medium text-foreground">{row.outil}</td>
                  <td className="py-3 text-muted-foreground">{row.raison}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3 QUESTIONS */}
        <h2 className="mt-14 text-2xl md:text-3xl font-extrabold text-foreground">
          Les 3 questions à poser avant de signer
        </h2>
        <div className="mt-6 space-y-6">
          {[
            {
              q: "L'outil est-il compatible avec la réforme e-invoicing 2026–2027 ?",
              a: "Demande si l'outil est en cours de certification PDP ou partenaire d'une plateforme agréée. Un «\u00a0on travaille dessus\u00a0» sans engagement chiffré = signal d'alarme.",
            },
            {
              q: "Est-ce que l'outil s'intègre à mon compte bancaire pro ?",
              a: "La saisie manuelle des transactions en 2026, c'est non. Vérifie la liste des banques compatibles avant de t'engager. Tous ne supportent pas toutes les banques.",
            },
            {
              q: "Quel est le coût réel à 12 mois ?",
              a: "Certains outils facturent les relances automatiques en option, l'accès comptable en supplément, ou le stockage des factures archivées. Calcule avec les fonctionnalités dont tu as vraiment besoin.",
            },
          ].map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono font-bold">
                {i + 1}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{item.q}</h3>
                <p className="mt-1 text-muted-foreground">{item.a}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="mt-14 text-2xl md:text-3xl font-extrabold text-foreground">
          Questions fréquentes
        </h2>
        <div className="mt-6 space-y-6">
          {faqDisplay.map((item, i) => (
            <div key={i} className="rounded-lg border border-border p-5">
              <h3 className="font-bold text-foreground">{item.q}</h3>
              <p className="mt-2 text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>

        {/* LIENS INTERNES */}
        <section className="mt-14 rounded-xl bg-muted/40 p-6">
          <h2 className="text-xl font-bold text-foreground">À lire aussi sur tooltrim.com</h2>
          <ul className="mt-4 space-y-2">
            <li>
              <Link to="/fr/guide/meilleurs-outils-ops-manager-freelance" className="text-primary hover:underline">
                → Stack complète pour ops manager freelance : les outils recommandés (Qonto, Indy, Asana…)
              </Link>
            </li>
            <li>
              <Link to="/fr/guide/meilleurs-outils-consultant-freelance" className="text-primary hover:underline">
                → Meilleurs outils pour consultant freelance en 2026 (CRM, facturation, vidéo…)
              </Link>
            </li>
            <li>
              <Link to="/fr/audit-saas-gratuit" className="text-primary hover:underline">
                → Audit SaaS gratuit : détectez les doublons dans votre stack en 5 minutes
              </Link>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-xl border border-primary/30 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-extrabold text-foreground">Votre stack compta est-elle optimisée ?</h2>
          <p className="mt-3 text-muted-foreground">
            Selon les audits tooltrim.com, 30% des freelances paient deux outils qui font la même chose. Vérifiez en 5 minutes.
          </p>
          <Link
            to="/fr/selector"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground hover:opacity-90 transition"
          >
            Lancer mon diagnostic gratuit
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Aucune inscription requise.</p>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          Publié le 8 mai 2026 — Sources : economie.gouv.fr, Cegid, portail-autoentrepreneur.fr
        </p>
      </article>
    </>
  );
}
