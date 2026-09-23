import { translateBattleCopy } from '@/data/comparisonBattlesEn';
import { useState } from "react";
import { Link } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import ToolLogo from '@/components/ToolLogo';
import ToolCardEditorial from '@/components/ToolCardEditorial';
import SectionPillNav from '@/components/SectionPillNav';
import Breadcrumb from '@/components/Breadcrumb';
import { ArrowRight, ChevronDown, Wallet } from '@/lib/icons';
import type { Tool } from '@/data/types';
import type { CompareEditorialContent } from '@/pages/ComparePage';
import { chatgptClaudeGuides, type ComparisonDecisionGuide } from '@/data/comparisonDecisionGuides';
import { useToolSummaries } from '@/hooks/useSupabaseData';

import ComparisonMedia from './ComparisonMedia';

interface Props { toolA: Tool; toolB: Tool; content: CompareEditorialContent; slugPair: string }

export default function ComparisonDecisionPage({ toolA, toolB, content, slugPair }: Props) {
  const { lang, t, prefix } = useLang();
  const [audience, setAudience] = useState<'solo' | 'team'>('solo');
  const { tools: toolSummaries } = useToolSummaries({ refreshRemote: false });
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
  const tools = [toolA, toolB];
  const headings = [
    ['comparaison', t('Comparer', 'Compare')], ['decision', t('Notre avis', 'Our verdict')],
    ['cout', t('Prix', 'Pricing')], ['changer', t('Changer ?', 'Switch?')],
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
        <h1><span><ToolLogo tool={toolA} size={56} aria-hidden="true" />{toolA.name}</span><span className="cp-guide-vs">vs</span><span><ToolLogo tool={toolB} size={56} aria-hidden="true" />{toolB.name}</span></h1>
        <p className="cp-guide-intro">{pick(content.framing, content.framingEn)}</p>
        {curated && <p className="cp-guide-scope">{curated.scope}</p>}
      </header>
      <SectionPillNav sections={headings.map(([id, label]) => ({ id, label }))} logoTo={`${prefix}/comparatifs`} logoAriaLabel={t('Tous les comparatifs', 'All comparisons')} ariaLabel={t('Dans ce comparatif', 'In this comparison')} heroSelector=".cp-guide-hero" />
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
            <div className="cp-guide-scenario-copy">
              <div className="cp-guide-scenario-identity"><ToolLogo tool={tools[i]} size={32} aria-hidden="true" /><span>{tools[i].name}</span></div>
              <h3>{s.choice}</h3><p>{s.reason}</p>
              {s.limits.length > 0 && <div className="cp-guide-limits"><h4>{t('À savoir', 'Before you choose')}</h4><ul>{s.limits.map(limit => <li key={limit}>{limit}</li>)}</ul></div>}
            </div>
          </article>)}
        </div>
        <p className="cp-guide-editorial-verdict">{pick(content.finalRecommendation, content.finalRecommendationEn)}</p>
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
      </section>
      <section id="changer" className="cp-guide-section cp-guide-switch-section" aria-labelledby="cp-switch-title">
        <div className="cp-guide-switch-heading"><span>{t('Décision', 'Decision')}</span><h2 id="cp-switch-title">{t('Faut-il changer ?', 'Should you switch?')}</h2></div>
        <div className="cp-guide-switching">
          <article><span>01</span><h3>{t('Restez sur votre choix actuel si', 'Keep your current tool if')}</h3><p>{pick(content.tippingPoint.defaultChoice, content.tippingPoint.defaultChoiceEn)}</p></article>
          <article><span>02</span><h3>{t('Changez si', 'Switch if')}</h3><p>{pick(content.tippingPoint.switchWhen, content.tippingPoint.switchWhenEn)}</p></article>
          {pickList(content.tippingPoint.signals, content.tippingPoint.signalsEn).length > 0 && <article className="cp-guide-switch-signals"><span>03</span><h3>{t('Les signaux à regarder', 'Signals to watch')}</h3><ul>{pickList(content.tippingPoint.signals, content.tippingPoint.signalsEn).map(signal => <li key={signal}>{signal}</li>)}</ul></article>}
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
      {faq.length > 0 && <section id="doutes" className="cp-guide-section" aria-labelledby="cp-faq-title"><h2 id="cp-faq-title">{t('Questions fréquentes', 'Common questions')}</h2><div className="cp-guide-faq">{faq.map(item => <details key={item.question}><summary>{item.question}<ChevronDown aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></section>}
      <section id="sources" className="cp-guide-section cp-guide-method" aria-label={t('Sources et méthode', 'Sources and methodology')}>
        <details className="cp-guide-disclosure"><summary>{t('Sources, conditions et méthode', 'Sources, terms and methodology')}<ChevronDown aria-hidden="true" /></summary>
          <p>{t('Les recommandations sont des appréciations éditoriales, fondées sur les offres documentées. Aucun benchmark pratique ToolTrim n’est présenté ici.', 'Recommendations are editorial judgements based on documented plans. No hands-on ToolTrim benchmark is presented here.')}</p>
          {curated && <><p>{curated.priceNote}</p><ol className="cp-guide-sources">{curated.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ArrowRight aria-hidden="true" /></a></li>)}</ol></>}
          <Link to={`${prefix}/transparency`}>{t('Lire la méthode ToolTrim', 'Read the ToolTrim methodology')} →</Link>
        </details>
      </section>
      {alternatives.length > 0 && <section id="alternatives" className="cp-guide-section" aria-labelledby="cp-alternatives-title"><h2 id="cp-alternatives-title">{t('Autres options', 'Alternatives')}</h2><div className="cp-guide-alternatives tc-grid">{alternatives.map(alt => {
        const alternativeTool = toolSummaries.find(tool => tool.slug === alt.slug || tool.id === alt.slug);
        return alternativeTool ? <ToolCardEditorial key={alt.slug} tool={alternativeTool} prefix={prefix} t={t} lang={lang} showPin={false} /> : null;
      })}</div></section>}
    </article>
  );
}
