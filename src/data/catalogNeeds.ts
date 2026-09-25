/**
 * The catalogue's primary filter: needs, not the 37 raw categories.
 *
 * The first eight mirror the homepage universes. Two more exist only here,
 * because they hold large families the universes leave out: AI (72 tools,
 * assistants and generators alike) and Admin & Finance (invoicing, legal,
 * payroll: essential to a freelancer). Every catalogue category maps to one
 * need, including the tiny legacy ones (1 to 8 tools) that used to show up as
 * their own filter.
 */
export interface CatalogNeed {
  id: string;
  fr: string;
  en: string;
  categoryIds: string[];
}

export const CATALOG_NEEDS: CatalogNeed[] = [
  { id: "productivite", fr: "Productivité", en: "Productivity", categoryIds: ["organization", "project-management", "productivity-tracking", "storage", "formation-education"] },
  { id: "creation", fr: "Création", en: "Content creation", categoryIds: ["creation", "photo", "video", "audio", "publishing"] },
  { id: "design", fr: "Design", en: "Design", categoryIds: ["design-tools", "prototyping", "illustration", "design", "3d", "motion-design", "assets"] },
  { id: "marketing", fr: "Marketing & Ventes", en: "Marketing & Sales", categoryIds: ["email-productivity", "marketing", "crm"] },
  { id: "automatisation", fr: "Automatisation", en: "Automation", categoryIds: ["automation"] },
  { id: "dev", fr: "Dev & No-code", en: "Dev & No-code", categoryIds: ["nocode-web", "website-builders", "developer-tools", "ai-code", "ui-components", "security"] },
  { id: "communication", fr: "Communication", en: "Communication", categoryIds: ["communication", "communication-team"] },
  { id: "donnees", fr: "Données", en: "Data", categoryIds: ["analytics"] },
  { id: "ia", fr: "IA", en: "AI", categoryIds: ["ai-general"] },
  { id: "admin", fr: "Admin & Finance", en: "Admin & Finance", categoryIds: ["finance", "legal-contracts", "hris-payroll", "erp", "budgeting-fpa", "vendor-risk-data"] },
];
