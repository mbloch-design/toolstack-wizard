import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Compass, Moon, Zap } from "@/lib/icons";
import Drawer from "../Drawer/Drawer";
import Button, { buttonAttrs, linkClass, TextButton } from "../Button/Button";
import Choice, { Choices, IconTile } from "../Choice/Choice";
import Field from "../Field/Field";
import Logo from "../Logo/Logo";
import { Collapse } from "../Motion/Motion";
import Segmented from "../Segmented/Segmented";
import Stepper from "../Stepper/Stepper";
import Switch from "../Switch/Switch";
import Tag from "../Tag/Tag";
import CostEditor, { EditorBlock } from "./CostEditor";
import { CardPanel, CostCard, CostFigure, DisclosureRow, SettingRow, SheetFoot, SheetHead, SheetSection, TagList, ToolRow, ToolRows } from "./ToolSheet";

const meta: Meta = { title: "Ma stack/Fiche outil", tags: ["a-valider"], parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

function Sheet({ lang, editing = false }: { lang: Lang; editing?: boolean }) {
  const [paid, setPaid] = useState(true);
  const [open, setOpen] = useState(editing);
  const [plan, setPlan] = useState<"free" | "pro">("pro");
  const [seats, setSeats] = useState(5);
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP">("USD");
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const tool = { name: "Vercel", slug: "vercel" };
  const row = (name: string, slug: string, note: React.ReactNode) => <ToolRow key={slug} logo={<Logo tool={{ name, slug }} size={32} localOnly />} name={name} note={note}
    renderMain={(className, content) => <a className={className} href={`#${slug}`}>{content}</a>} action={<a {...buttonAttrs()} href={`#compare-${slug}`}>{t(lang, "Comparer", "Compare")}</a>} />;
  return <Drawer open inline onClose={() => {}} closeLabel={t(lang, "Fermer", "Close")}>
    <SheetHead logo={<Logo tool={tool} size={40} localOnly />} eyebrow={t(lang, "Sites et applications", "Sites and apps")} title="Vercel"
      lead={t(lang, "Une plateforme de déploiement basée sur git pour les apps frontend et serverless, avec une offre Hobby gratuite.", "A git-based deployment platform for frontend and serverless apps, with a free Hobby plan.")}
      explore={<a {...buttonAttrs()} href="#explore"><Compass aria-hidden />{t(lang, "Explorer autour de Vercel", "Explore around Vercel")}</a>} />
    <CostCard label={t(lang, "Dans ma stack", "In my stack")}>
      <CostFigure label={t(lang, "Coût mensuel estimé", "Estimated monthly cost")} value={t(lang, "≈ 85,87 €/mois", "≈ €85.87/mo")} source={t(lang, "Pro · 5 utilisateurs", "Pro · 5 users")}
        link={<a href="#pricing" className={linkClass()}>{t(lang, "Tarifs officiels →", "Official pricing →")}</a>} />
      <SettingRow title={t(lang, "Abonnement payant", "Paid subscription")} note={t(lang, "À partir de 20 $/mois", "From $20/mo")} control={<Switch checked={paid} onChange={setPaid} label={t(lang, "Abonnement payant pour Vercel", "Paid subscription for Vercel")} />} />
      <DisclosureRow open={open} onToggle={() => setOpen((v) => !v)} title={t(lang, "Modifier mon abonnement", "Edit my subscription")} note={t(lang, "Offre, utilisateurs, devise ou montant facturé", "Plan, users, invoice currency or billed amount")} />
      <Collapse open={open}><CardPanel>
        <CostEditor
          blocks={<>
            <EditorBlock label={t(lang, "Offre", "Plan")}>
              <Choices radio label={t(lang, "Offre", "Plan")}>
                <Choice role="radio" media={<IconTile><Moon /></IconTile>} name={t(lang, "Version gratuite", "Free version")} note={t(lang, "Aucun abonnement", "No subscription")} amount={t(lang, "0 €/mois", "€0/mo")} state={plan === "free" ? "kept" : undefined} checked={plan === "free"} onClick={() => setPlan("free")} />
                <Choice role="radio" media={<IconTile><Zap /></IconTile>} name="Pro" note={t(lang, "entrée de gamme · par utilisateur", "entry level · per user")} amount={t(lang, "20 $/mois", "$20/mo")} state={plan === "pro" ? "kept" : undefined} checked={plan === "pro"} onClick={() => setPlan("pro")} />
              </Choices>
            </EditorBlock>
            <Collapse open={plan === "pro"}><EditorBlock label={t(lang, "Utilisateurs", "Users")}>
              <Stepper value={seats} onChange={setSeats} label={t(lang, "Utilisateurs", "Users")} lessLabel={t(lang, "Un utilisateur de moins", "One user less")} moreLabel={t(lang, "Un utilisateur de plus", "One user more")} />
            </EditorBlock></Collapse>
            <Field label={t(lang, "Ou le montant facturé", "Or the billed amount")} placeholder="12" inputMode="decimal" value="" onChange={() => {}}
              after={<><Segmented label={t(lang, "Devise de facture", "Invoice currency")} value={currency} onChange={setCurrency} options={[{ value: "EUR", label: "€" }, { value: "USD", label: "$" }, { value: "GBP", label: "£" }]} />
                <Segmented label={t(lang, "Facturation", "Billing")} value={period} onChange={setPeriod} options={[{ value: "monthly", label: t(lang, "Mensuel", "Monthly") }, { value: "annual", label: t(lang, "Annuel", "Yearly") }]} /></>} />
            <TextButton tone="quiet">{t(lang, "Revenir à l’entrée de gamme du catalogue", "Back to the catalogue entry level")}</TextButton>
          </>}
          previewLabel={t(lang, "Nouveau coût mensuel", "New monthly cost")} preview={t(lang, "≈ 85,87 €/mois", "≈ €85.87/mo")}
          previewNote={t(lang, "100,00 USD/mois ≈ 85,87 EUR/mois · Taux de référence du 2026-08-27 (1 USD ≈ 0,8587 EUR).", "100.00 USD/mo ≈ 85.87 EUR/mo · Reference rate of 2026-08-27 (1 USD ≈ 0.8587 EUR).")}
          actions={<><Button variant="quiet">{t(lang, "Annuler", "Cancel")}</Button><Button variant="primary">{t(lang, "Enregistrer", "Save")}</Button></>} />
      </CardPanel></Collapse>
    </CostCard>
    <SheetSection title={t(lang, "Ce qu’il couvre", "What it covers")}><TagList items={[t(lang, "Déploiement", "Deployment"), t(lang, "Hébergement", "Hosting")]} /></SheetSection>
    <SheetSection title={t(lang, "Recoupements dans ma stack", "Overlaps in my stack")}>
      <ToolRows>{row("Netlify", "netlify", <>{t(lang, "En commun : Déploiement", "Shared: Deployment")} · <Tag tone="overlap">{t(lang, "≈ 19 €/mois à examiner", "≈ €19/mo to review")}</Tag></>)}</ToolRows>
    </SheetSection>
    <SheetSection title={t(lang, "À envisager", "Worth considering")}>
      <ToolRows>
        {row("Heroku", "heroku", <>{t(lang, "Dès 7 $/mois", "From $7/mo")} <Tag tone="ok">{t(lang, "−80 €/mois", "−€80/mo")}</Tag></>)}
        {row("Railway", "railway", t(lang, "Prix non relevé", "Price not checked"))}
      </ToolRows>
    </SheetSection>
    <SheetFoot actions={<><a {...buttonAttrs("primary", "lg")} href="#open">{t(lang, "Ouvrir Vercel", "Open Vercel")}</a><a {...buttonAttrs("secondary", "lg")} href="#profile">{t(lang, "Fiche complète", "Full profile")}</a></>}
      remove={<TextButton tone="danger">{t(lang, "Retirer de ma stack", "Remove from my stack")}</TextButton>} />
  </Drawer>;
}

/** The sheet as it opens, cost card folded. */
export const Closed: Story = { render: (_a, { globals: { lang } }) => <Sheet lang={lang} /> };
/** « Modifier mon abonnement » open: plans, users, billed amount, preview and save. */
export const Editing: Story = { render: (_a, { globals: { lang } }) => <Sheet lang={lang} editing /> };
