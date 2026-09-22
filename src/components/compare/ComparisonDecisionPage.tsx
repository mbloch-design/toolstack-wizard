import { translateBattleCopy } from '@/data/comparisonBattlesEn';
import { useState } from "react";
import { Link } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import ToolLogo from '@/components/ToolLogo';
import Breadcrumb from '@/components/Breadcrumb';
import { ArrowRight, ChevronDown } from '@/lib/icons';
import type { Tool } from '@/data/types';
import type { CompareEditorialContent } from '@/pages/ComparePage';
import { chatgptClaudeGuides, type ComparisonDecisionGuide } from '@/data/comparisonDecisionGuides';

interface Props { toolA: Tool; toolB: Tool; content: CompareEditorialContent; slugPair: string }

export default function ComparisonDecisionPage({ toolA, toolB, content, slugPair }: Props) {
  const { lang, t, prefix } = useLang();
  const [audience, setAudience] = useState<'solo' | 'team'>('solo');
  const pick = (fr: string, en: string) => lang === 'fr' ? fr : en;
  const curated = slugPair === 'chatgpt-vs-claude' ? chatgptClaudeGuides[lang] : undefined;
  const scenarios = toolsForEditorial();
  function toolsForEditorial() {
    return [
      { choice: pick(content.verdictCardTitleA || `Choisir ${toolA.name}`, content.verdictCardTitleAEn || `Choose ${toolA.name}`), reason: pick(content.verdictCardTextA || content.quickVerdictA, content.verdictCardTextAEn || content.quickVerdictAEn), limits: content.limitsA.length ? pickList(content.limitsA, content.limitsAEn) : content.avoidAIfList.map(value => lang === 'fr' ? value : translateBattleCopy(value)) },
      { choice: pick(content.verdictCardTitleB || `Choisir ${toolB.name}`, content.verdictCardTitleBEn || `Choose ${toolB.name}`), reason: pick(content.verdictCardTextB || content.quickVerdictB, content.verdictCardTextBEn || content.quickVerdictBEn), limits: content.limitsB.length ? pickList(content.limitsB, content.limitsBEn) : content.avoidBIfList.map(value => lang === 'fr' ? value : translateBattleCopy(value)) },
    ];
  }
  function pickList(fr: string[], en: string[]) { return lang === 'fr' ? fr : en; }
  const criteria: ComparisonDecisionGuide['criteria'] = content.decisiveCriteria.length
    ? content.decisiveCriteria.map(c => ({ title: pick(c.title, c.titleEn), a: pick(c.toolA, c.toolAEn), b: pick(c.toolB, c.toolBEn), takeaway: pick(c.decision, c.decisionEn) }))
    : content.tableRows.filter(c => !/prix|price|coût|cost/i.test(c.criterion)).map(c => ({ title: pick(c.criterion, c.criterionEn), a: pick(c.toolA, c.toolAEn), b: pick(c.toolB, c.toolBEn), takeaway: pick(c.verdictLabel, c.verdictLabelEn) }));
  const faq = content.faq.map(f => ({ question: pick(f.q, f.qEn), answer: pick(f.a, f.aEn) }));
  const alternatives = curated?.alternatives ?? content.alternatives.map(a => ({ ...a, reason: pick(a.reason, a.reasonEn) }));
  const trial = curated?.trial ?? [
    t('Choisissez trois tâches récentes représentatives de votre travail, avec les mêmes données et le même résultat attendu.', 'Choose three recent tasks that represent your work, with the same input and expected result.'),
    t('Réalisez-les dans les deux outils. Notez le plan utilisé, le temps nécessaire, les limites et les étapes manuelles.', 'Complete them in both tools. Record the plan used, time needed, limits and manual steps.'),
    t('Comparez le résultat utilisable et le coût total, y compris la migration. Gardez votre outil actuel si le gain ne justifie pas le changement.', 'Compare the usable result and total cost, including migration. Keep your current tool if the gain does not justify switching.'),
  ];
  const tools = [toolA, toolB];
  const headings = [
    ['decision', t('Choisir', 'Choose')], ['comparaison', t('Différences', 'Differences')],
    ['cout', t('Prix', 'Pricing')], ['changer', t('Changer ?', 'Switch?')], ['essai', t('Tester', 'Test')],
  ];
  const date = content.checkedAt;
  return (
    <article className="cp-guide">
      <header className="cp-guide-hero">
        <Breadcrumb items={[{ label: t('Comparatifs', 'Comparisons'), href: `${prefix}/comparatifs` }, { label: `${toolA.name} vs ${toolB.name}` }]} includeSchema={false} />
        <div className="cp-guide-meta">
          <span>{t('Comparatif', 'Comparison')}</span>
          {date && <time dateTime={date}>{t('Revue éditoriale', 'Editorial review')} · {new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</time>}
        </div>
        <h1><span><ToolLogo tool={toolA} size={40} aria-hidden="true" />{toolA.name}</span><span className="cp-guide-vs">vs</span><span><ToolLogo tool={toolB} size={40} aria-hidden="true" />{toolB.name}</span></h1>
        <p className="cp-guide-intro">{pick(content.framing, content.framingEn)}</p>
        <p className="cp-guide-scope">{curated?.scope ?? t('Choix, budget et changement d’outil pour indépendants et petites équipes.', 'Choice, budget and switching tools for freelancers and small teams.')}</p>
      </header>
      <nav className="cp-guide-nav" aria-label={t('Dans ce comparatif', 'In this comparison')}>
        {headings.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>
      <section id="decision" className="cp-guide-section" aria-labelledby="cp-decision-title">

        <h2 id="cp-decision-title">{t('L’essentiel pour choisir.', 'A good place to start.')}</h2>
        <div className="cp-guide-scenarios">
          {scenarios.slice(0, 2).map((s, i) => <article className="cp-guide-scenario" key={s.choice}>
            <div className="cp-guide-scenario-identity"><ToolLogo tool={tools[i]} size={28} aria-hidden="true" /><span>{tools[i].name}</span></div>
            <h3>{s.choice}</h3><p>{s.reason}</p>
            {s.limits.length > 0 && <details className="cp-guide-disclosure"><summary>{t('Ce qui peut changer votre choix', 'What could change your choice')}<ChevronDown aria-hidden="true" /></summary><ul>{s.limits.map(limit => <li key={limit}>{limit}</li>)}</ul></details>}
          </article>)}
        </div>
        <p className="cp-guide-editorial-verdict">{pick(content.finalRecommendation, content.finalRecommendationEn)}</p>
        <div className="cp-guide-shortcuts">
          <a href="#changer"><span>{t('Déjà équipé ?', 'Already using one?')} <strong>{t('Gardez ce qui fonctionne.', 'Keep what works.')}</strong></span><ArrowRight aria-hidden="true" /></a>
          <a href="#cout" onClick={() => setAudience('team')}><span>{t('À plusieurs ?', 'Choosing for a team?')} <strong>{t('Comparez le coût par siège.', 'Compare the cost per seat.')}</strong></span><ArrowRight aria-hidden="true" /></a>
        </div>
      </section>
      <section id="comparaison" className="cp-guide-section" aria-labelledby="cp-differences-title">

        <h2 id="cp-differences-title">{t('Comparez ce qui compte.', 'Compare what matters.')}</h2>
        <p className="cp-guide-section-intro">{pick(content.criteriaIntro || content.verdictShort, content.criteriaIntroEn || content.verdictShortEn)}</p>
        <table className="cp-guide-matrix">
          <caption className="sr-only">{t('Comparaison par usage', 'Comparison by use case')}</caption>
          <thead><tr><th scope="col">{t('Votre besoin', 'Your need')}</th>{tools.map(tool => <th scope="col" key={tool.id}>{tool.name}</th>)}</tr></thead>
          <tbody>{criteria.map(c => <tr key={c.title}>
            <th scope="row"><span>{c.title}</span><details className="cp-guide-disclosure"><summary>{t('Notre conseil', 'Our advice')}<ChevronDown aria-hidden="true" /></summary><p>{c.takeaway}{c.source && <a href="#sources" aria-label={t('Voir les sources', 'View sources')}> [{c.source}]</a>}</p></details></th>
            <td><span className="cp-guide-mobile-label">{toolA.name}</span>{c.a}</td>
            <td><span className="cp-guide-mobile-label">{toolB.name}</span>{c.b}</td>
          </tr>)}</tbody>
        </table>
      </section>
      <section id="cout" className="cp-guide-section" aria-labelledby="cp-pricing-title">

        <h2 id="cp-pricing-title">{t('Le bon plan. Au bon prix.', 'The right plan. The right price.')}</h2>
        <p className="cp-guide-section-intro">{curated ? t('Les offres gratuites suffisent pour commencer. Voici les repères pour un usage régulier.', 'Start with the free plans. These are reference points for regular use.') : t('Comparez le coût du plan adapté à votre travail, ses limites et sa facturation.', 'Compare the cost of the plan that fits your work, its limits and billing terms.')}</p>
        {curated ? <>
          <div className="cp-guide-segmented" role="group" aria-label={t('Comparer les tarifs pour', 'Compare pricing for')}>
            <button type="button" aria-pressed={audience === 'solo'} onClick={() => setAudience('solo')}>{t('En solo', 'Just me')}</button>
            <button type="button" aria-pressed={audience === 'team'} onClick={() => setAudience('team')}>{t('En équipe', 'A team')}</button>
          </div>
          <div className="cp-guide-prices" aria-live="polite" aria-atomic="true">
            {curated.prices.filter(row => row.audience === audience && row.featured).map(row => <div key={row.label}>
              <div className="cp-guide-price-cards">{tools.map((tool, i) => <article key={tool.id}>
                <h3>{tool.name}</h3><p className="cp-guide-plan-name">{i === 0 ? row.planA : row.planB}</p>
                <p className="cp-guide-price-value">{new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(row.monthlyAmount!)}<span>{audience === 'team' ? t('/ siège / mois', '/ seat / month') : t('/ mois', '/ month')}</span></p>
                <p>{t('Facturation mensuelle', 'Billed monthly')}</p>
              </article>)}</div>
              <p className="cp-guide-price-note">{row.note}</p>
            </div>)}
            {curated.prices.filter(row => row.audience === audience && !row.featured).map(row => <div className="cp-guide-annual" key={row.label}>
              <h3>{t('Et en paiement annuel ?', 'What about annual billing?')}</h3>
              <div className="cp-guide-pair"><p><strong>{toolA.name}</strong> {row.a}</p><p><strong>{toolB.name}</strong> {row.b}</p></div>
              <p className="cp-guide-price-note">{row.note}</p>
            </div>)}
          </div>
          <p className="cp-guide-source-note">{t('USD · Taxes et tarifs locaux à vérifier au paiement.', 'USD · Check taxes and local prices at checkout.')} <a href="#sources">{t('Sources et conditions', 'Sources and terms')}</a></p>
        </>
          : <div className="cp-guide-pair cp-guide-catalog-prices">{tools.map(tool => {
            const pricing = (lang === 'en' ? tool.pricing_v5En : undefined) || tool.pricing_v5;
            const plan = pricing?.plans?.find(p => p.isComparePlan && !p.comingSoon);
            const canPrice = plan && plan.nativeAmount != null && plan.nativeCurrency;
            return <article key={tool.id}><h3>{tool.name}</h3>
              {canPrice ? <><p className="cp-guide-price-value">{new Intl.NumberFormat(lang, { style: 'currency', currency: plan.nativeCurrency! }).format(plan.nativeAmount!)}</p><p>{plan.displayName} · {plan.billingPeriod === 'annual' ? t('par an', 'per year') : plan.billingPeriod === 'monthly' ? t('par mois', 'per month') : t('selon les conditions du plan', 'subject to plan terms')}{plan.pricingUnit ? ` · ${plan.pricingUnit}` : ''}</p><p>{plan.billingCommitment === 'annual_prepaid' ? t('Paiement annuel à l’avance.', 'Annual payment up front.') : ''} {t('Vérifiez les taxes, le nombre de sièges et les limites applicables.', 'Check taxes, seat counts and applicable limits.')}</p>{(plan.lastConfirmedOn || plan.observedOn) && <p>{t('Observation du', 'Observed on')} {plan.lastConfirmedOn || plan.observedOn}</p>}</>
                : <p>{t('Consultez les offres détaillées pour connaître le montant, la facturation et les limites du plan adapté à votre usage.', 'See the detailed plans for the price, billing terms and limits of the plan that fits your use.')}</p>}
            </article>;
          })}</div>}
        <div className="cp-guide-links">{tools.map(tool => <Link key={tool.id} to={`${prefix}/tool/${tool.slug || tool.id}/${lang === 'en' ? 'pricing' : 'prix'}`}>{t('Offres', 'Plans')} {tool.name}<ArrowRight aria-hidden="true" /></Link>)}</div>
      </section>
      <section id="changer" className="cp-guide-section cp-guide-switch-section" aria-labelledby="cp-switch-title">

        <h2 id="cp-switch-title">{t('Changer doit vous simplifier la vie.', 'Switching should make work easier.')}</h2>
        <div className="cp-guide-switching">
          <div><h3>{t('Le choix de départ', 'Where to start')}</h3><p>{pick(content.tippingPoint.defaultChoice, content.tippingPoint.defaultChoiceEn)}</p></div>
          <div><h3>{t('Quand changer', 'When to switch')}</h3><p>{pick(content.tippingPoint.switchWhen, content.tippingPoint.switchWhenEn)}</p></div>
          {pickList(content.tippingPoint.signals, content.tippingPoint.signalsEn).length > 0 && <div><h3>{t('Les situations à reconnaître', 'Situations to watch for')}</h3><ul>{pickList(content.tippingPoint.signals, content.tippingPoint.signalsEn).map(signal => <li key={signal}>{signal}</li>)}</ul></div>}
        </div>
      </section>
      {content.profiles.length > 0 && <section className="cp-guide-section" aria-labelledby="cp-profiles-title">
        <h2 id="cp-profiles-title">{t('Selon votre travail.', 'For your workflow.')}</h2>
        <div className="cp-guide-editorial-grid">{content.profiles.map(profile => <article key={profile.persona}>
          <h3>{pick(profile.persona, profile.personaEn)}</h3><p><strong>{profile.choice}</strong></p><p>{pick(profile.reason, profile.reasonEn)}</p><p className="cp-guide-editorial-limit">{pick(profile.limit, profile.limitEn)}</p>
        </article>)}</div>
      </section>}
      {content.tooltrimRisks.length > 0 && <section className="cp-guide-section" aria-labelledby="cp-risks-title">
        <h2 id="cp-risks-title">{t('Les pièges de ce choix.', 'The trade-offs to watch.')}</h2>
        <div className="cp-guide-faq">{content.tooltrimRisks.map(risk => <details key={risk.mistake}>
          <summary>{pick(risk.mistake, risk.mistakeEn)}<ChevronDown aria-hidden="true" /></summary><p>{pick(risk.consequence, risk.consequenceEn)}</p><p>{pick(risk.recommendation, risk.recommendationEn)}</p>
        </details>)}</div>
      </section>}
      <section id="essai" className="cp-guide-section" aria-labelledby="cp-test-title">

        <h2 id="cp-test-title">{t('Un essai vaut mieux qu’un classement.', 'Your work is the best test.')}</h2>
        <ol className="cp-guide-trial">{trial.map((step, i) => <li key={step}><div><h3>{[t('Prenez une vraie tâche.', 'Pick real work.'), t('Comparez à armes égales.', 'Give both the same brief.'), t('Comptez les retouches.', 'Count the corrections.')][i]}</h3><p>{step}</p></div></li>)}</ol>
      </section>
      {faq.length > 0 && <section id="doutes" className="cp-guide-section" aria-labelledby="cp-faq-title"><h2 id="cp-faq-title">{t('Les dernières questions.', 'The remaining questions.')}</h2><div className="cp-guide-faq">{faq.map(item => <details key={item.question}><summary>{item.question}<ChevronDown aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></section>}
      <section id="sources" className="cp-guide-section cp-guide-method" aria-label={t('Sources et méthode', 'Sources and methodology')}>
        <details className="cp-guide-disclosure"><summary>{t('Sources, conditions et méthode', 'Sources, terms and methodology')}<ChevronDown aria-hidden="true" /></summary>
          <p>{t('Les recommandations sont des appréciations éditoriales, fondées sur les offres documentées. Aucun benchmark pratique ToolTrim n’est présenté ici.', 'Recommendations are editorial judgements based on documented plans. No hands-on ToolTrim benchmark is presented here.')}</p>
          {curated && <><p>{curated.priceNote}</p><ol className="cp-guide-sources">{curated.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ArrowRight aria-hidden="true" /></a></li>)}</ol></>}
          <Link to={`${prefix}/transparency`}>{t('Lire la méthode ToolTrim', 'Read the ToolTrim methodology')} →</Link>
        </details>
      </section>
      {alternatives.length > 0 && <section id="alternatives" className="cp-guide-section" aria-labelledby="cp-alternatives-title"><h2 id="cp-alternatives-title">{t('Un autre besoin ?', 'Need something different?')}</h2><div className="cp-guide-alternatives">{alternatives.map(alt => <Link key={alt.slug} to={`${prefix}/tool/${alt.slug}`}><div><h3>{alt.name}</h3><p>{alt.reason}</p></div><ArrowRight aria-hidden="true" /></Link>)}</div></section>}
      <footer className="cp-guide-footer"><span>{t('Approfondir un outil', 'Explore a tool in detail')}</span><div className="cp-guide-links">{tools.map(tool => <Link key={tool.id} to={`${prefix}/tool/${tool.slug || tool.id}`}>{tool.name}<ArrowRight aria-hidden="true" /></Link>)}</div></footer>
    </article>
  );
}
