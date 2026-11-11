import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "../Button/Button";
import Field, { Checkbox, FormFull, FormGrid, SelectField, TextAreaField } from "./Field";

const meta: Meta = { title: "Molécules/Formulaire", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

/** The planche's complete form (« Soumettre un outil »): help, a live check, an error that says how to fix it, a count, a field filled by the team. */
function SubmitForm({ lang }: { lang: Lang }) {
  const [name, setName] = useState("Notion");
  const [site, setSite] = useState("notion.so");
  const [best, setBest] = useState(t(lang, "Un seul espace pour notes, wikis et bases de données.", "One space for notes, wikis and databases."));
  const [alerts, setAlerts] = useState(true);
  const siteOk = /^https:\/\/\S+\.\S+/.test(site);
  return (
    <form style={{ maxWidth: 640 }} onSubmit={(event) => event.preventDefault()}>
      <FormGrid>
        <Field label={t(lang, "Nom de l'outil", "Tool name")} help={t(lang, "Tel qu'il apparaît sur son site.", "As it appears on its site.")} value={name} valid={name.trim().length > 1} onChange={(event) => setName(event.target.value)} />
        <Field label={t(lang, "Site officiel", "Official site")} type="url" value={site} valid={siteOk} onChange={(event) => setSite(event.target.value)}
          error={siteOk ? undefined : t(lang, "L'adresse doit commencer par https://", "The address must start with https://")} />
        <SelectField label={t(lang, "Catégorie", "Category")} defaultValue="organisation">
          <option value="organisation">{t(lang, "Organisation", "Organisation")}</option>
          <option value="design">Design</option>
          <option value="marketing">Marketing</option>
        </SelectField>
        <Field label={t(lang, "E-mail de contact", "Contact email")} type="email" placeholder="vous@exemple.fr" />
        <FormFull>
          <TextAreaField label={t(lang, "Ce que l'outil fait de mieux", "What the tool does best")} maxLength={160} value={best} count={{ value: best.length, max: 160 }} onChange={(event) => setBest(event.target.value)} />
        </FormFull>
        <Field label={t(lang, "Prix d'entrée", "Entry price")} help={t(lang, "Rempli par notre équipe.", "Filled in by our team.")} value="9,50 €" disabled />
        <FormFull>
          <Checkbox label={t(lang, "Prévenir quand le prix change", "Tell me when the price changes")} note={t(lang, "Un e-mail, seulement quand ça bouge.", "One email, only when it moves.")} checked={alerts} onChange={(event) => setAlerts(event.target.checked)} />
        </FormFull>
        <FormFull>
          <div><Button variant="primary" type="submit" arrow>{t(lang, "Envoyer ma fiche", "Send my listing")}</Button></div>
        </FormFull>
      </FormGrid>
    </form>
  );
}

export const Complete: Story = { name: "Formulaire complet", render: (_a, { globals: { lang } }) => <SubmitForm lang={lang} /> };
