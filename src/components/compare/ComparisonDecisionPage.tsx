import { translateBattleCopy } from '@/data/comparisonBattlesEn';
import { useEffect, useRef, useState } from "react";
import { Link } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import ToolLogo from '@/components/ToolLogo';
import Breadcrumb from '@/components/Breadcrumb';
import { ArrowRight, ChevronDown, Target, RefreshCw, Wallet } from '@/lib/icons';
import type { Tool } from '@/data/types';
import type { CompareEditorialContent } from '@/pages/ComparePage';
import { chatgptClaudeGuides, type ComparisonDecisionGuide } from '@/data/comparisonDecisionGuides';

import ComparisonMedia from './ComparisonMedia';

interface Props { toolA: Tool; toolB: Tool; content: CompareEditorialContent; slugPair: string }

export default function ComparisonDecisionPage({ toolA, toolB, content, slugPair }: Props) {
  const { lang, t, prefix } = useLang();
  const navRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState('comparaison');
  useEffect(() => {
    const ids = ['comparaison', 'decision', 'cout', 'changer', 'essai'];
    let frame = 0;
    const update = () => {
      const boundary = (navRef.current?.getBoundingClientRect().bottom ?? 0) + 28;
      let current = ids[0];
      for (const id of ids) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= boundary) current = id;
      }
      setActiveSection(current);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    // Capture both AppShell's internal scrolling and mobile document scrolling.
    document.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    const target = document.getElementById(window.location.hash.slice(1));
    if (target && ids.includes(target.id)) target.scrollIntoView({ block: 'start' });
    update();
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [slugPair, lang]);
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
    t('Reprenez une tâche récente avec vos propres données.', 'Use a recent task with your own data.'),
    t('Gardez les mêmes données et le même résultat attendu. Notez le plan utilisé.', 'Use the same inputs and expected result. Record the plan used.'),
    t('Mesurez le temps de reprise et les limites rencontrées, pas seulement la première impression.', 'Measure rework and limits encountered, not just first impressions.'),
  ];
  const tools = [toolA, toolB];
  const headings = [
    ['comparaison', t('Comparer', 'Compare')], ['decision', t('Notre avis', 'Our verdict')],
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
        {curated && <p className="cp-guide-scope">{curated.scope}</p>}
      </header>
      <nav ref={navRef} className="cp-guide-nav" aria-label={t('Dans ce comparatif', 'In this comparison')}>
        {headings.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined}>{label}</a>)}
      </nav>
      <section id="comparaison" className="cp-guide-section cp-guide-comparison" aria-labelledby="cp-differences-title">
        <h2 id="cp-differences-title">{t('Comparez selon votre usage', 'Compare by use case')}</h2>
        <div className="cp-duel-list">
          {criteria.map((c, index) => <article className="cp-duel" key={c.title} aria-labelledby={`cp-criterion-${index}`}>
            <h3 id={`cp-criterion-${index}`}>{c.title}</h3>
            <div className="cp-duel-pair">
              <div><h4><ToolLogo tool={toolA} size={24} />{toolA.name}</h4><p>{c.a}</p></div>
              <div><h4><ToolLogo tool={toolB} size={24} />{toolB.name}</h4><p>{c.b}</p></div>
            </div>
            {c.takeaway && <p className="cp-duel-advice"><strong>{t('Pour choisir', 'How to choose')}</strong>{c.takeaway}{c.source && <a href="#sources"> [{c.source}]</a>}</p>}
          </article>)}
        </div>
      </section>
      <section id="decision" className="cp-guide-section" aria-labelledby="cp-decision-title">

        <h2 id="cp-decision-title">{t('Notre avis', 'Our verdict')}</h2>
        <div className="cp-guide-scenarios">
          {scenarios.slice(0, 2).map((s, i) => <article className="cp-guide-scenario" key={s.choice}>
            <ComparisonMedia key={tools[i].id} tool={tools[i]} lang={lang} />
            <div className="cp-guide-scenario-identity"><ToolLogo tool={tools[i]} size={28} aria-hidden="true" /><span>{tools[i].name}</span></div>
            <h3>{s.choice}</h3><p>{s.reason}</p>
            {s.limits.length > 0 && <details className="cp-guide-disclosure"><summary>{t('Les limites', 'Limitations')}<ChevronDown aria-hidden="true" /></summary><ul>{s.limits.map(limit => <li key={limit}>{limit}</li>)}</ul></details>}
          </article>)}
        </div>
        <p className="cp-guide-editorial-verdict">{pick(content.finalRecommendation, content.finalRecommendationEn)}</p>
        <div className="cp-guide-shortcuts">
          <a href="#changer"><span>{t('Vous utilisez déjà l’un des deux ?', 'Already using either tool?')}</span><ArrowRight aria-hidden="true" /></a>
          <a href="#cout" onClick={() => setAudience('team')}><span>{t('Tarifs pour une équipe', 'Team pricing')}</span><ArrowRight aria-hidden="true" /></a>
        </div>
      </section>
      <section id="cout" className="cp-guide-section" aria-labelledby="cp-pricing-title">

        <h2 id="cp-pricing-title"><Wallet className="cp-section-icon" size={28} aria-hidden="true" />{t('Tarifs', 'Pricing')}</h2>

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
              <h3>{t('Paiement annuel', 'Annual billing')}</h3>
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
                : <p>{t('Tarif à consulter sur la fiche détaillée.', 'See the full review for pricing.')}</p>}
            </article>;
          })}</div>}
        <div className="cp-guide-links">{tools.map(tool => <Link key={tool.id} to={`${prefix}/tool/${tool.slug || tool.id}/${lang === 'en' ? 'pricing' : 'prix'}`}>{t('Offres', 'Plans')} {tool.name}<ArrowRight aria-hidden="true" /></Link>)}</div>
      </section>
      <section id="changer" className="cp-guide-section cp-guide-switch-section" aria-labelledby="cp-switch-title">

        <h2 id="cp-switch-title"><RefreshCw className="cp-section-icon" size={28} aria-hidden="true" />{t('Faut-il changer ?', 'Should you switch?')}</h2>
        <div className="cp-guide-switching">
          <div className="cp-decision-diagram" aria-hidden="true"><span><ToolLogo tool={toolA} size={40} />{toolA.name}</span><span className="cp-diagram-link"><ArrowRight size={22} /><span>{t('Changer d’outil', 'Switching tools')}</span></span><span><ToolLogo tool={toolB} size={40} />{toolB.name}</span></div>
          <div><h3>{t('Par défaut', 'Default choice')}</h3><p>{pick(content.tippingPoint.defaultChoice, content.tippingPoint.defaultChoiceEn)}</p></div>
          <div><h3>{t('Quand changer', 'When to switch')}</h3><p>{pick(content.tippingPoint.switchWhen, content.tippingPoint.switchWhenEn)}</p></div>
          {pickList(content.tippingPoint.signals, content.tippingPoint.signalsEn).length > 0 && <div><h3>{t('Cas concrets', 'Examples')}</h3><ul>{pickList(content.tippingPoint.signals, content.tippingPoint.signalsEn).map(signal => <li key={signal}>{signal}</li>)}</ul></div>}
        </div>
      </section>
      {content.profiles.length > 0 && <section className="cp-guide-section" aria-labelledby="cp-profiles-title">
        <h2 id="cp-profiles-title">{t('Par profil', 'By role')}</h2>
        <div className="cp-guide-editorial-grid">{content.profiles.map(profile => <article key={profile.persona}>
          <h3>{pick(profile.persona, profile.personaEn)}</h3><p><strong>{profile.choice}</strong></p><p>{pick(profile.reason, profile.reasonEn)}</p><p className="cp-guide-editorial-limit">{pick(profile.limit, profile.limitEn)}</p>
        </article>)}</div>
      </section>}
      {content.tooltrimRisks.length > 0 && <section className="cp-guide-section" aria-labelledby="cp-risks-title">
        <h2 id="cp-risks-title">{t('Les erreurs à éviter', 'Mistakes to avoid')}</h2>
        <div className="cp-guide-faq">{content.tooltrimRisks.map(risk => <details key={risk.mistake}>
          <summary>{pick(risk.mistake, risk.mistakeEn)}<ChevronDown aria-hidden="true" /></summary><p>{pick(risk.consequence, risk.consequenceEn)}</p><p>{pick(risk.recommendation, risk.recommendationEn)}</p>
        </details>)}</div>
      </section>}
      <section id="essai" className="cp-guide-section" aria-labelledby="cp-test-title">

        <h2 id="cp-test-title"><Target className="cp-section-icon" size={28} aria-hidden="true" />{t('Comment les tester', 'How to test them')}</h2>
        <ol className="cp-guide-trial">{trial.map((step, i) => <li key={step}><div><h3>{[t('Une tâche habituelle', 'A typical task'), t('Les mêmes consignes', 'The same brief'), t('Le temps de correction', 'Editing time')][i]}</h3><p>{step}</p></div></li>)}</ol>
      </section>
      {faq.length > 0 && <section id="doutes" className="cp-guide-section" aria-labelledby="cp-faq-title"><h2 id="cp-faq-title">{t('Questions fréquentes', 'Common questions')}</h2><div className="cp-guide-faq">{faq.map(item => <details key={item.question}><summary>{item.question}<ChevronDown aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></section>}
      <section id="sources" className="cp-guide-section cp-guide-method" aria-label={t('Sources et méthode', 'Sources and methodology')}>
        <details className="cp-guide-disclosure"><summary>{t('Sources, conditions et méthode', 'Sources, terms and methodology')}<ChevronDown aria-hidden="true" /></summary>
          <p>{t('Les recommandations sont des appréciations éditoriales, fondées sur les offres documentées. Aucun benchmark pratique ToolTrim n’est présenté ici.', 'Recommendations are editorial judgements based on documented plans. No hands-on ToolTrim benchmark is presented here.')}</p>
          {curated && <><p>{curated.priceNote}</p><ol className="cp-guide-sources">{curated.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ArrowRight aria-hidden="true" /></a></li>)}</ol></>}
          <Link to={`${prefix}/transparency`}>{t('Lire la méthode ToolTrim', 'Read the ToolTrim methodology')} →</Link>
        </details>
      </section>
      {alternatives.length > 0 && <section id="alternatives" className="cp-guide-section" aria-labelledby="cp-alternatives-title"><h2 id="cp-alternatives-title">{t('Autres options', 'Alternatives')}</h2><div className="cp-guide-alternatives">{alternatives.map(alt => <Link key={alt.slug} to={`${prefix}/tool/${alt.slug}`}><div><h3>{alt.name}</h3><p>{alt.reason}</p></div><ArrowRight aria-hidden="true" /></Link>)}</div></section>}
      <footer className="cp-guide-footer"><span>{t('Fiches détaillées', 'Full reviews')}</span><div className="cp-guide-links">{tools.map(tool => <Link key={tool.id} to={`${prefix}/tool/${tool.slug || tool.id}`}>{tool.name}<ArrowRight aria-hidden="true" /></Link>)}</div></footer>
    </article>
  );
}
