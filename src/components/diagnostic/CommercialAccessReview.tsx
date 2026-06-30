import ToolLogo from "@/components/ToolLogo";
import type {
  AiAllowanceStatus,
  CommercialContract,
  CommercialPayer,
  Tool,
} from "@/types/diagnostic";
import {
  buildCommercialFamilies,
  contractProductNames,
  contractsForFamily,
  productsCoveredByContract,
} from "@/lib/commercialAccess";

interface Props {
  tools: Tool[];
  contracts: CommercialContract[];
  aiAllowanceFamilyIds?: string[];
  onChange: (contracts: CommercialContract[]) => void;
  t: (fr: string, en: string) => string;
}

function defaultPayer(accessMode: CommercialContract["accessMode"]): CommercialPayer {
  if (accessMode === "team_employer") return "employer";
  if (accessMode === "client_paid") return "client";
  if (accessMode === "unknown") return "unknown";
  return "self";
}

function isNoMonthlyCost(accessMode: CommercialContract["accessMode"]) {
  return [
    "team_employer",
    "client_paid",
    "included_elsewhere",
    "free",
    "one_time",
  ].includes(accessMode);
}

function nextContractId(familyId: string, contracts: CommercialContract[]) {
  const count = contracts.filter((contract) => contract.familyId === familyId).length + 1;
  return `contract-${familyId}-${count}`;
}

function contractTitle(
  contract: CommercialContract | null,
  index: number,
  t: (fr: string, en: string) => string
) {
  if (!contract) return t("Nouvel accès", "New access");
  return contract.planLabel || t(`Accès ${index + 1}`, `Access ${index + 1}`);
}

export default function CommercialAccessReview({
  tools,
  contracts,
  aiAllowanceFamilyIds = [],
  onChange,
  t,
}: Props) {
  const families = buildCommercialFamilies(tools);
  const allowanceFamilies = new Set(aiAllowanceFamilyIds);
  const allowanceOptions: Array<{
    value: AiAllowanceStatus;
    fr: string;
    en: string;
  }> = [
    { value: "enough", fr: "L’enveloppe suffit", en: "The allowance is enough" },
    { value: "sometimes_limited", fr: "Je suis parfois limité", en: "I am sometimes limited" },
    { value: "frequently_limited", fr: "Ça me bloque souvent", en: "It often blocks me" },
    { value: "extra_purchases", fr: "Je rachète ou dépasse", en: "I buy extras or overrun" },
    { value: "unknown", fr: "Je ne sais pas", en: "I’m not sure" },
  ];

  const updateContract = (
    familyId: string,
    contractId: string | null,
    scopeTools: Tool[],
    patch: Partial<CommercialContract>
  ) => {
    const family = families.find((candidate) => candidate.id === familyId);
    if (!family) return;
    const current = contractId
      ? contracts.find((contract) => contract.id === contractId)
      : undefined;
    const nextId = current?.id || nextContractId(family.id, contracts);
    const currentContract = current || {
      id: nextId,
      familyId: family.id,
      familyName: family.name,
      accessMode: "unknown" as const,
      payer: "unknown" as const,
      productIds: scopeTools.map((tool) => tool.id),
      confirmed: false,
    };
    const next = { ...currentContract, ...patch };
    onChange([
      ...contracts.filter((contract) => contract.id !== next.id),
      next,
    ]);
  };

  const removeContract = (contractId: string) => {
    onChange(contracts.filter((contract) => contract.id !== contractId));
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {t("Accès et abonnements", "Access and subscriptions")}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t(
            "On regroupe les logiciels par fournisseur, puis on peut déclarer plusieurs accès si la réalité est mixte : suite, app seule, employeur, client ou crédits.",
            "Tools are grouped by provider, then you can declare several access lines if reality is mixed: suite, single app, employer, client or credits."
          )}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {families.map((family) => {
          const productionTools = family.tools.filter((tool) => tool.tool_type !== "ia");
          const aiFeatures = family.tools.filter((tool) => tool.tool_type === "ia");
          const catalogUsesCredits = aiFeatures.some((tool) =>
            ["credits", "usage_based"].includes(tool.pricing_v5?.billing_model || "")
          );
          const needsAllowanceReview =
            allowanceFamilies.has(family.id) || catalogUsesCredits;
          const familyContracts = contractsForFamily(contracts, family);
          const primaryContract = familyContracts[0];
          const selectedPlan = family.plans.find((plan) => plan.id === primaryContract?.planId);
          const coveredProductIds = new Set(
            familyContracts
              .filter((candidate) => candidate.confirmed)
              .flatMap((candidate) => candidate.productIds)
          );
          const scopedProductIds = new Set(
            familyContracts.flatMap((candidate) => candidate.productIds)
          );
          const uncoveredTools = family.tools.filter((tool) => !coveredProductIds.has(tool.id));
          const unscopedTools = family.tools.filter((tool) => !scopedProductIds.has(tool.id));
          const allowanceResolved =
            !needsAllowanceReview ||
            familyContracts.some((contract) =>
              Boolean(contract.aiAllowanceStatus) &&
              contract.aiAllowanceStatus !== "unknown" &&
              (
                contract.aiAllowanceStatus !== "extra_purchases" ||
                contract.variableMonthlyPrice !== undefined
              )
            );
          const familyFullyCovered = uncoveredTools.length === 0 && allowanceResolved;

          return (
            <details
              key={family.id}
              open={family.tools.length > 1 || family.id === "adobe"}
              className="rounded-xl border border-border bg-background p-4"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {family.tools.slice(0, 4).map((tool) => (
                      <ToolLogo
                        key={tool.id}
                        tool={tool}
                        size={30}
                        className="rounded-md border-2 border-background"
                      />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{family.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {(productionTools.length > 0 ? productionTools : family.tools)
                        .map((tool) => tool.name)
                        .join(", ")}
                    </p>
                    {aiFeatures.length > 0 && (
                      <p className="mt-0.5 truncate text-[11px] font-medium text-primary">
                        {t("IA utilisée", "AI in use")}: {aiFeatures.map((tool) => tool.name).join(", ")}
                      </p>
                    )}
                    {familyContracts.length > 1 && (
                      <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                        {t(
                          `${familyContracts.length} accès déclarés`,
                          `${familyContracts.length} access lines declared`
                        )}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    familyFullyCovered
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {familyFullyCovered
                      ? t("clarifié", "clarified")
                      : t("à préciser", "to clarify")}
                  </span>
                </div>
              </summary>

              <div className="mt-4 space-y-3">
                {familyContracts.length > 0 && (
                  <div className="space-y-2">
                    {familyContracts.map((contract, index) => {
                      const scopedTools = family.tools.filter((tool) =>
                        contract.productIds.includes(tool.id)
                      );
                      return (
                        <ContractEditor
                          key={contract.id}
                          family={family}
                          contract={contract}
                          index={index}
                          scopeTools={scopedTools.length > 0 ? scopedTools : family.tools}
                          allowanceOptions={allowanceOptions}
                          needsAllowanceReview={needsAllowanceReview}
                          onUpdate={(patch) =>
                            updateContract(family.id, contract.id, scopedTools.length > 0 ? scopedTools : family.tools, patch)
                          }
                          onRemove={familyContracts.length > 1 ? () => removeContract(contract.id) : undefined}
                          t={t}
                        />
                      );
                    })}
                  </div>
                )}

                {(familyContracts.length === 0 || unscopedTools.length > 0) && (
                  <ContractEditor
                    family={family}
                    contract={null}
                    index={familyContracts.length}
                    scopeTools={unscopedTools.length > 0 ? unscopedTools : family.tools}
                    allowanceOptions={allowanceOptions}
                    needsAllowanceReview={needsAllowanceReview}
                    onUpdate={(patch) =>
                      updateContract(
                        family.id,
                        null,
                        unscopedTools.length > 0 ? unscopedTools : family.tools,
                        patch
                      )
                    }
                    t={t}
                  />
                )}

                {primaryContract?.confirmed && uncoveredTools.length > 0 && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    {t(
                      `Ce plan ne couvre pas encore : ${uncoveredTools.map((tool) => tool.name).join(", ")}.`,
                      `This plan does not yet cover: ${uncoveredTools.map((tool) => tool.name).join(", ")}.`
                    )}
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function ContractEditor({
  family,
  contract,
  index,
  scopeTools,
  allowanceOptions,
  needsAllowanceReview,
  onUpdate,
  onRemove,
  t,
}: {
  family: ReturnType<typeof buildCommercialFamilies>[number];
  contract: CommercialContract | null;
  index: number;
  scopeTools: Tool[];
  allowanceOptions: Array<{
    value: AiAllowanceStatus;
    fr: string;
    en: string;
  }>;
  needsAllowanceReview: boolean;
  onUpdate: (patch: Partial<CommercialContract>) => void;
  onRemove?: () => void;
  t: (fr: string, en: string) => string;
}) {
  const selectedPlan = family.plans.find((plan) => plan.id === contract?.planId);
  const needsAmount = Boolean(
    selectedPlan &&
    !isNoMonthlyCost(selectedPlan.accessMode) &&
    selectedPlan.accessMode !== "unknown"
  );
  const scopedFamily = { ...family, tools: scopeTools };
  const coveredNames = contract
    ? contractProductNames(contract, family.tools)
    : scopeTools.map((tool) => tool.name);

  return (
    <div className="rounded-lg border border-border bg-card/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {contractTitle(contract, index, t)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {coveredNames.join(", ")}
          </p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
          >
            {t("Retirer", "Remove")}
          </button>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold text-foreground">
          {t(
            `Comment as-tu accès à ${family.name} ?`,
            `How do you access ${family.name}?`
          )}
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {family.plans.map((plan) => {
            const active = contract?.planId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  const noCost = isNoMonthlyCost(plan.accessMode);
                  onUpdate({
                    accessMode: plan.accessMode,
                    planId: plan.id,
                    planLabel: t(plan.labelFr, plan.labelEn),
                    payer: defaultPayer(plan.accessMode),
                    productIds: productsCoveredByContract(scopedFamily, plan),
                    monthlyPrice: noCost ? 0 : contract?.monthlyPrice,
                    currency: "EUR",
                    confirmed: noCost || contract?.monthlyPrice !== undefined,
                  });
                }}
                className={`min-h-11 rounded-lg border px-3 py-2 text-left text-xs font-semibold ${
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/35 hover:text-foreground"
                }`}
              >
                {t(plan.labelFr, plan.labelEn)}
              </button>
            );
          })}
        </div>
      </div>

      {needsAmount && (
        <label className="mt-3 block space-y-1 text-xs font-medium text-muted-foreground">
          <span>
            {t(
              "Combien paies-tu environ pour cet accès ?",
              "Roughly how much do you pay for this access?"
            )}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={contract?.monthlyPrice ?? ""}
              onChange={(event) => {
                const rawValue = event.target.value;
                const monthlyPrice = rawValue === "" ? undefined : Math.max(0, Number(rawValue) || 0);
                onUpdate({
                  monthlyPrice,
                  currency: "EUR",
                  confirmed: monthlyPrice !== undefined,
                });
              }}
              placeholder={t("Montant mensuel", "Monthly amount")}
              className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="text-sm font-semibold text-muted-foreground">
              {t("€/mois", "€/mo")}
            </span>
          </div>
        </label>
      )}

      {needsAllowanceReview && contract?.planId && contract.planId !== "unknown" && (
        <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 p-3">
          <p className="text-xs font-semibold text-foreground">
            {t(
              "Pour les fonctions IA, l’enveloppe incluse te suffit-elle ?",
              "For AI features, is the included allowance enough?"
            )}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {t(
              "Pas besoin de connaître le nombre de crédits : indique seulement l’effet réel sur ton travail.",
              "You do not need to know the credit count: only indicate the real effect on your work."
            )}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {allowanceOptions.map((option) => {
              const active = contract.aiAllowanceStatus === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onUpdate({
                      aiAllowanceStatus: option.value,
                      variableMonthlyPrice:
                        option.value === "extra_purchases"
                          ? contract.variableMonthlyPrice
                          : undefined,
                    })
                  }
                  className={`min-h-10 rounded-lg border px-3 py-2 text-left text-xs font-semibold ${
                    active
                      ? "border-primary bg-background text-foreground"
                      : "border-border bg-background/60 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                  }`}
                >
                  {t(option.fr, option.en)}
                </button>
              );
            })}
          </div>

          {contract.aiAllowanceStatus === "extra_purchases" && (
            <label className="mt-3 block space-y-1 text-xs font-medium text-muted-foreground">
              <span>
                {t(
                  "En moyenne, combien cela ajoute-t-il par mois ?",
                  "On average, how much does this add per month?"
                )}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={contract.variableMonthlyPrice ?? ""}
                  onChange={(event) => {
                    const rawValue = event.target.value;
                    onUpdate({
                      variableMonthlyPrice:
                        rawValue === ""
                          ? undefined
                          : Math.max(0, Number(rawValue) || 0),
                    });
                  }}
                  placeholder={t("Moyenne mensuelle", "Monthly average")}
                  className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-sm font-semibold text-muted-foreground">
                  {t("€/mois", "€/mo")}
                </span>
              </div>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
