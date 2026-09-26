import { translateBattleCopy } from '@/data/comparisonBattlesEn';
import { useState } from "react";
import { Link } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import ToolLogo from '@/components/ToolLogo';
import ToolCardEditorial from '@/components/ToolCardEditorial';
import Breadcrumb from '@/components/Breadcrumb';
import { ArrowRight, ChevronDown, CheckCircle2, RefreshCw } from '@/lib/icons';
import { relExterne } from '@/lib/externalLink';
import type { Tool } from '@/data/types';
import type { CompareEditorialContent } from '@/pages/ComparePage';
import { activeCampaignKlaviyoGuides, chatgptClaudeGuides, type ComparisonDecisionGuide } from '@/data/comparisonDecisionGuides';
import { useToolSummaries } from '@/hooks/useSupabaseData';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPriceLabel } from '@/lib/toolUtils';
import { resolveMonthlyPrice } from '@/lib/pricing';
import { computeToolTrimScore } from '@/lib/toolTrimScore';
import { localizePlanName } from '@/lib/planNames';
import brandColors from '@/data/brandColors.json';


interface Props { toolA: Tool; toolB: Tool; content: CompareEditorialContent; slugPair: string }

export default function ComparisonDecisionPage({ toolA, toolB, content, slugPair }: Props) {
  const { lang, t, prefix } = useLang();
  const [audience, setAudience] = useState<'solo' | 'team'>('solo');
  const { tools: toolSummaries } = useToolSummaries({ refreshRemote: false });
  const { currency } = useCurrency();
  const priceOf = (tool: Tool) => formatPriceLabel(tool, resolveMonthlyPrice(tool), t, currency, lang);
  // Plan units are stored in French ("par utilisateur"); translate the known ones.
  const unitLabel = (unit?: string | null) => {
    if (!unit) return '';
    const map: Record<string, [string, string]> = {
      'par utilisateur': ['par utilisateur', 'per user'], 'par compte': ['par compte', 'per account'],
      'par collaborateur': ['par collaborateur', 'per seat'], 'par équipe': ['par équipe', 'per team'],
      'par commerce': ['par commerce', 'per store'], 'sur devis': ['sur devis', 'on quote'],
    };
    const hit = map[unit.toLowerCase()];
    return hit ? t(hit[0], hit[1]) : (lang === 'fr' ? unit : '');
  };
  const toolHref = (tool: Tool) => `${prefix}/tool/${tool.slug || tool.id}`;
  const pricingHref = (tool: Tool) => `${toolHref(tool)}/${lang === 'fr' ? 'prix' : 'pricing'}`;
  const pick = (fr: string, en: string) => lang === 'fr' ? fr : en;
  const affiliateComparison = slugPair === 'activecampaign-vs-klaviyo';
  const reviewed = affiliateComparison ? activeCampaignKlaviyoGuides[lang] : undefined;
  const curated = reviewed || (slugPair === 'chatgpt-vs-claude' ? chatgptClaudeGuides[lang] : undefined);
  const scenarios = reviewed ? [reviewed.scenarios[1], reviewed.scenarios[0]].map(s => ({ choice: s.choice, reason: s.reason, limits: [s.limit] })) : toolsForEditorial();
  function toolsForEditorial() {
    return [
      { choice: pick(content.verdictCardTitleA || `Choisir ${toolA.name}`, content.verdictCardTitleAEn || `Choose ${toolA.name}`), reason: pick(content.verdictCardTextA || content.quickVerdictA, content.verdictCardTextAEn || content.quickVerdictAEn), limits: content.limitsA.length ? pickList(content.limitsA, content.limitsAEn) : content.avoidAIfList.map(value => lang === 'fr' ? value : translateBattleCopy(value)) },
      { choice: pick(content.verdictCardTitleB || `Choisir ${toolB.name}`, content.verdictCardTitleBEn || `Choose ${toolB.name}`), reason: pick(content.verdictCardTextB || content.quickVerdictB, content.verdictCardTextBEn || content.quickVerdictBEn), limits: content.limitsB.length ? pickList(content.limitsB, content.limitsBEn) : content.avoidBIfList.map(value => lang === 'fr' ? value : translateBattleCopy(value)) },
    ];
  }
  function pickList(fr: string[], en: string[]) { return lang === 'fr' ? fr : en; }
  const criteria: ComparisonDecisionGuide['criteria'] = reviewed?.criteria ?? (content.decisiveCriteria.length
    ? content.decisiveCriteria.map(c => ({ title: pick(c.title, c.titleEn), a: pick(c.toolA, c.toolAEn), b: pick(c.toolB, c.toolBEn), takeaway: pick(c.decision, c.decisionEn) }))
    : content.tableRows.filter(c => !/prix|price|coût|cost/i.test(c.criterion)).map(c => ({ title: pick(c.criterion, c.criterionEn), a: pick(c.toolA, c.toolAEn), b: pick(c.toolB, c.toolBEn), takeaway: pick(c.verdictLabel, c.verdictLabelEn) })));
  const faq = reviewed?.faq ?? content.faq.map(f => ({ question: pick(f.q, f.qEn), answer: pick(f.a, f.aEn) }));
  const alternatives = curated?.alternatives ?? content.alternatives.map(a => ({ ...a, reason: pick(a.reason, a.reasonEn) }));
  const tools = [toolA, toolB];
  const date = reviewed?.checkedAt || content.checkedAt;
  return (
    <article className="cp-guide">
      <header className="cp-guide-hero">
        <Breadcrumb items={[{ label: t('Comparatifs', 'Comparisons'), href: `${prefix}/comparatifs` }, { label: `${toolA.name} vs ${toolB.name}` }]} includeSchema={false} />
        <div className="cp-guide-meta">
          <span>{t('Comparatif', 'Comparison')}</span>
          {date && <time dateTime={date}>{t('Revue éditoriale', 'Editorial review')} · {new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</time>}
        </div>
        <h1 className="cp-vs-title">{toolA.name} <span>vs</span> {toolB.name}</h1>
        <p className="cp-guide-intro">{reviewed?.intro || pick(content.framing, content.framingEn)}</p>
        {/* The duel, App Store style: two app cards face to face, each with
            its icon, pitch, price and ToolTrim score, one link per card. */}
        <div className="cp-vs-duel">
          {tools.map((tool) => {
            const score = computeToolTrimScore(tool);
            const pitch = lang === 'en' ? (tool.shortDescriptionEn || tool.shortDescription) : tool.shortDescription;
            // Dominant logo colour, extracted once for the tools in published
            // comparisons (src/data/brandColors.json); monochrome logos have
            // none and keep the neutral surface.
            const brand = (brandColors as Record<string, string>)[tool.slug || tool.id];
            return <Link key={tool.id} to={toolHref(tool)} className={`cp-vs-card${brand ? ' cp-vs-card--brand' : ''}`} style={brand ? { ['--brand' as string]: brand } : undefined}>
              <ToolLogo tool={tool} size={128} className="cp-vs-icon" />
              <span className="cp-vs-name">{tool.name}</span>
              {pitch && <span className="cp-vs-pitch">{pitch}</span>}
              <span className="cp-vs-meta">
                <span className="cp-vs-price">{reviewed ? (tool.id === 'activecampaign' ? t('Essai de 14 jours', '14-day trial') : t('Forfait gratuit disponible', 'Free plan available')) : priceOf(tool)}</span>
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
          const lead = reviewed ? '' : pick(content.finalRecommendation, content.finalRecommendationEn);
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
      {affiliateComparison && <aside className="cp-guide-outbound" aria-label={t('Accéder aux offres', 'Explore the plans')}>
        <h2>{t('Essayez sur vos propres campagnes.', 'Try it with your own campaigns.')}</h2>
        <div className="cp-guide-outbound-grid">
          <div className="cp-guide-outbound-item">
            <a className="cp-guide-outbound-button" href="https://try.activecampaign.com/twe5oenri4zv-b9q17i" target="_blank" rel={relExterne('affilie')}>{t('Essayer ActiveCampaign pendant 14 jours', 'Try ActiveCampaign for 14 days')}<ArrowRight aria-hidden="true" /></a>
            <p>{t('Lien affilié : ToolTrim peut percevoir une commission si vous souscrivez, sans coût supplémentaire pour vous.', 'Affiliate link: ToolTrim may earn a commission if you subscribe, at no extra cost to you.')}</p>
          </div>
          <div className="cp-guide-outbound-item">
            <a className="cp-guide-outbound-button" href="https://www.klaviyo.com/pricing/" target="_blank" rel={relExterne('source')}>{t('Voir les offres Klaviyo', 'View Klaviyo plans')}<ArrowRight aria-hidden="true" /></a>
            <p>{t('Lien direct vers Klaviyo, sans affiliation ToolTrim.', 'Direct link to Klaviyo, not an affiliate link.')}</p>
          </div>
        </div>
      </aside>}
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

        <h2 id="cp-pricing-title">{t('Tarifs', 'Pricing')}</h2>

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
              <h3>{row.label}</h3>
              <div className="cp-guide-pair"><p><strong>{toolA.name}</strong> {row.a}</p><p><strong>{toolB.name}</strong> {row.b}</p></div>
              <p className="cp-guide-price-note">{row.note}</p>
            </div>)}
          </div>
          <p className="cp-guide-source-note">{t('USD · Taxes et tarifs locaux à vérifier au paiement.', 'USD · Check taxes and local prices at checkout.')} <a href="#sources">{t('Sources et conditions', 'Sources and terms')}</a></p>
        </>
          : <>
            {/* Two price cards in one format: logo and name, a big amount with
                a small period, the plan and unit, one link. Taxes, seats and
                observation dates go once in the footnote below. */}
            <div className="cp-price-cards">{tools.map(tool => {
              const pricing = (lang === 'en' ? tool.pricing_v5En : undefined) || tool.pricing_v5;
              const plan = pricing?.plans?.find(p => p.isComparePlan && !p.comingSoon);
              const hasNative = Boolean(plan && plan.nativeAmount != null && plan.nativeCurrency);
              const amount = hasNative
                ? new Intl.NumberFormat(lang, { style: 'currency', currency: plan!.nativeCurrency!, maximumFractionDigits: plan!.nativeAmount! % 1 ? 2 : 0 }).format(plan!.nativeAmount!)
                : priceOf(tool).replace(/\/(mo|mois)$/, '');
              const isNumeric = /\d/.test(amount);
              const period = hasNative ? (plan!.billingPeriod === 'annual' ? t('/an', '/yr') : t('/mois', '/mo')) : (isNumeric ? t('/mois', '/mo') : '');
              const planName = hasNative ? plan!.displayName : localizePlanName(tool.pricing_v5?.compare_plan_name, lang);
              const unit = hasNative ? unitLabel(plan!.pricingUnit) : '';
              const commitment = hasNative && plan!.billingCommitment === 'annual_prepaid' ? t('facturé à l’année', 'billed yearly') : '';
              return <article key={tool.id} className="cp-price-card">
                <div className="cp-price-head"><ToolLogo tool={tool} size={32} className="cp-price-logo" /><h3>{tool.name}</h3></div>
                <p className="cp-price-amount">{amount}{period && <span>{period}</span>}</p>
                {(planName || unit || commitment) && <p className="cp-price-plan">{[planName, unit, commitment].filter(Boolean).join(' · ')}</p>}
                <Link className="cp-guide-price-link" to={pricingHref(tool)}>{t(`Tous les tarifs de ${tool.name}`, `All ${tool.name} pricing`)} <ArrowRight aria-hidden="true" /></Link>
              </article>;
            })}</div>
            {(() => {
              const observed = tools.map(tool => { const pr = (lang === 'en' ? tool.pricing_v5En : undefined) || tool.pricing_v5; const pl = pr?.plans?.find(p => p.isComparePlan && !p.comingSoon); return pl?.lastConfirmedOn || pl?.observedOn || pr?.verified_on; }).filter(Boolean).sort().pop();
              return <p className="cp-price-note">{t('Prix d’entrée des plans payants. Taxes, nombre de sièges et limites à vérifier chez l’éditeur.', 'Entry prices of the paid plans. Check taxes, seat counts and limits with the vendor.')}{observed ? ` ${t('Relevé le', 'Checked on')} ${observed}.` : ''}</p>;
            })()}
          </>}
      </section>
      {(() => {
        const stay = reviewed?.switching[0].text || pick(content.tippingPoint.defaultChoice, content.tippingPoint.defaultChoiceEn);
        const go = reviewed?.switching[1].text || pick(content.tippingPoint.switchWhen, content.tippingPoint.switchWhenEn);
        const signals = reviewed ? [] : pickList(content.tippingPoint.signals, content.tippingPoint.signalsEn);
        // Which tool each card is about: the one named first in its sentence.
        const firstNamed = (text: string) => [...tools].sort((x, y) => {
          const ix = text.indexOf(x.name), iy = text.indexOf(y.name);
          return (ix < 0 ? 1e9 : ix) - (iy < 0 ? 1e9 : iy);
        })[0];
        const stayTool = firstNamed(stay);
        const goTool = firstNamed(go) === stayTool ? tools.find(tool => tool !== stayTool)! : firstNamed(go);
        return <section id="changer" className="cp-guide-section cp-switch" aria-labelledby="cp-switch-title">
          <h2 id="cp-switch-title">{t('Faut-il changer ?', 'Should you switch?')}</h2>
          <div className="cp-switch-grid">
            <article className="cp-switch-card">
              <div className="cp-switch-head"><CheckCircle2 aria-hidden="true" /><h3>{t('Restez si', 'Stay if')}</h3><ToolLogo tool={stayTool} size={28} className="cp-switch-logo" /></div>
              <p>{stay}</p>
            </article>
            <article className="cp-switch-card">
              <div className="cp-switch-head"><RefreshCw aria-hidden="true" /><h3>{t('Changez si', 'Switch if')}</h3><ToolLogo tool={goTool} size={28} className="cp-switch-logo" /></div>
              <p>{go}</p>
            </article>
          </div>
          {signals.length > 0 && <div className="cp-switch-signals">
            <h3>{t('Les signaux à surveiller', 'Signals to watch')}</h3>
            <ul>{signals.map(signal => <li key={signal}>{signal}</li>)}</ul>
          </div>}
        </section>;
      })()}
      {reviewed && <section className="cp-guide-section" aria-labelledby="cp-trial-title">
        <h2 id="cp-trial-title">{t('Comment les tester', 'How to test them')}</h2>
        <ol>{reviewed.trial.map(step => <li key={step}>{step}</li>)}</ol>
      </section>}
      {!reviewed && content.profiles.length > 0 && <section className="cp-guide-section" aria-labelledby="cp-profiles-title">
        <h2 id="cp-profiles-title">{t('Par profil', 'By role')}</h2>
        <div className="cp-guide-editorial-grid">{content.profiles.map(profile => <article key={profile.persona}>
          <h3>{pick(profile.persona, profile.personaEn)}</h3><p><strong>{profile.choice}</strong></p><p>{pick(profile.reason, profile.reasonEn)}</p><p className="cp-guide-editorial-limit">{pick(profile.limit, profile.limitEn)}</p>
        </article>)}</div>
      </section>}
      {!reviewed && content.tooltrimRisks.length > 0 && <section className="cp-guide-section" aria-labelledby="cp-risks-title">
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
