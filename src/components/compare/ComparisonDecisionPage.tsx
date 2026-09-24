import { translateBattleCopy } from '@/data/comparisonBattlesEn';
import { useState } from "react";
import { Link } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import ToolLogo from '@/components/ToolLogo';
import ToolCardEditorial from '@/components/ToolCardEditorial';
import Breadcrumb from '@/components/Breadcrumb';
import { ArrowRight, ChevronDown, Wallet } from '@/lib/icons';
import type { Tool } from '@/data/types';
import type { CompareEditorialContent } from '@/pages/ComparePage';
import { chatgptClaudeGuides, type ComparisonDecisionGuide } from '@/data/comparisonDecisionGuides';
import { useToolSummaries } from '@/hooks/useSupabaseData';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPriceLabel } from '@/lib/toolUtils';
import { resolveMonthlyPrice } from '@/lib/pricing';
import { computeToolTrimScore } from '@/lib/toolTrimScore';
import { localizePlanName } from '@/lib/planNames';


interface Props { toolA: Tool; toolB: Tool; content: CompareEditorialContent; slugPair: string }

export default function ComparisonDecisionPage({ toolA, toolB, content, slugPair }: Props) {
  const { lang, t, prefix } = useLang();
  const [audience, setAudience] = useState<'solo' | 'team'>('solo');
  const { tools: toolSummaries } = useToolSummaries({ refreshRemote: false });
  const { currency } = useCurrency();
  const priceOf = (tool: Tool) => formatPriceLabel(tool, resolveMonthlyPrice(tool), t, currency, lang);
  const toolHref = (tool: Tool) => `${prefix}/tool/${tool.slug || tool.id}`;
  const pricingHref = (tool: Tool) => `${toolHref(tool)}/${lang === 'fr' ? 'prix' : 'pricing'}`;
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
  const date = content.checkedAt;
  return (
    <article className="cp-guide">
      <header className="cp-guide-hero">
        <Breadcrumb items={[{ label: t('Comparatifs', 'Comparisons'), href: `${prefix}/comparatifs` }, { label: `${toolA.name} vs ${toolB.name}` }]} includeSchema={false} />
        <div className="cp-guide-meta">
          <span>{t('Comparatif', 'Comparison')}</span>
          {date && <time dateTime={date}>{t('Revue éditoriale', 'Editorial review')} · {new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</time>}
        </div>
        <h1 className="cp-vs-title">{toolA.name} <span>vs</span> {toolB.name}</h1>
        <p className="cp-guide-intro">{pick(content.framing, content.framingEn)}</p>
        {/* The duel, App Store style: two app cards face to face, each with
            its icon, pitch, price and ToolTrim score, one link per card. */}
        <div className="cp-vs-duel">
          {tools.map((tool) => {
            const score = computeToolTrimScore(tool);
            const pitch = lang === 'en' ? (tool.shortDescriptionEn || tool.shortDescription) : tool.shortDescription;
            return <Link key={tool.id} to={toolHref(tool)} className="cp-vs-card">
              <ToolLogo tool={tool} size={80} className="cp-vs-icon" />
              <span className="cp-vs-name">{tool.name}</span>
              {pitch && <span className="cp-vs-pitch">{pitch}</span>}
              <span className="cp-vs-meta">
                <span className="cp-vs-price">{priceOf(tool)}</span>
                {score && score.score > 0 && <span className="cp-vs-score">★ {score.score.toFixed(1)}</span>}
              </span>
            </Link>;
          })}
          <span className="cp-vs-badge" aria-hidden="true">vs</span>
        </div>
        {curated && <p className="cp-guide-scope">{curated.scope}</p>}
      </header>
      {/* Verdict first: the answer a reader came for, readable at a glance.
          Two compact cards, the reason in one or two sentences, at most two
          watch-outs. The screenshots that used to sit here pushed it below
          the fold. */}
      <section id="decision" className="cp-guide-section cp-glance" aria-labelledby="cp-decision-title">
        <h2 id="cp-decision-title">{t('Notre avis', 'Our verdict')}</h2>
        {(() => {
          // Generated pages build the lead from the same reasons as the cards
          // below; show it only when it adds something.
          const lead = pick(content.finalRecommendation, content.finalRecommendationEn);
          const norm = (x: string) => x.toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, ' ').trim();
          const repeats = scenarios.slice(0, 2).some(sc => { const first = norm(sc.reason.split('.')[0]); return first.length > 12 && norm(lead).includes(first); });
          return lead && !repeats ? <p className="cp-glance-lead">{lead}</p> : null;
        })()}
        <div className="cp-glance-grid">
          {scenarios.slice(0, 2).map((s, i) => <article className="cp-glance-card" key={s.choice}>
            <div className="cp-glance-head"><ToolLogo tool={tools[i]} size={40} className="cp-glance-icon" /><h3>{s.choice}</h3></div>
            <p className="cp-glance-reason">{s.reason}</p>
            {s.limits.length > 0 && <div className="cp-glance-watch"><h4>{t('À savoir', 'Watch out')}</h4><ul>{s.limits.slice(0, 2).map(limit => <li key={limit}>{limit}</li>)}</ul></div>}
          </article>)}
        </div>
      </section>
      {/* Spec sheet, Apple "Compare" style: criteria down the left, the two
          tools in aligned columns, so a row reads in one sweep. */}
      <section id="comparaison" className="cp-guide-section cp-spec" aria-labelledby="cp-differences-title">
        <h2 id="cp-differences-title">{t('Comparez selon votre usage', 'Compare by use case')}</h2>
        <div className="cp-spec-table" role="table" aria-label={t(`${toolA.name} et ${toolB.name} comparés`, `${toolA.name} and ${toolB.name} compared`)}>
          <div className="cp-spec-row cp-spec-row--head" role="row">
            <span role="columnheader" className="cp-spec-label" />
            {tools.map(tool => <span role="columnheader" key={tool.id} className="cp-spec-tool"><ToolLogo tool={tool} size={28} />{tool.name}</span>)}
          </div>
          {criteria.map((c, index) => <div className="cp-spec-row" role="row" key={c.title}>
            <span role="rowheader" className="cp-spec-label" id={`cp-criterion-${index}`}>{c.title}{c.takeaway && <small>{c.takeaway}{c.source && <a href="#sources"> [{c.source}]</a>}</small>}</span>
            <span role="cell">{c.a}</span>
            <span role="cell">{c.b}</span>
          </div>)}
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
                : <>
                  <p className="cp-guide-price-value">{priceOf(tool)}</p>
                  {localizePlanName(tool.pricing_v5?.compare_plan_name, lang) && <p>{t('Plan de comparaison', 'Comparison plan')} · {localizePlanName(tool.pricing_v5?.compare_plan_name, lang)}</p>}
                  <p><Link className="cp-guide-price-link" to={pricingHref(tool)}>{t(`Tous les tarifs de ${tool.name}`, `All ${tool.name} pricing`)} <ArrowRight aria-hidden="true" /></Link></p>
                </>}
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
