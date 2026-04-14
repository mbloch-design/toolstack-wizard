interface Props {
  currentStep: number;
  totalSteps: number;
  clustersRemaining?: number;
  t: (fr: string, en: string) => string;
}

export default function DiagProgressBar({ currentStep, totalSteps, clustersRemaining, t }: Props) {
  const percent = Math.round((currentStep / Math.max(totalSteps - 1, 1)) * 100);
  const estimatedMinutes = clustersRemaining != null
    ? Math.max(1, Math.ceil(clustersRemaining * 0.5))
    : Math.max(1, Math.ceil((totalSteps - currentStep) * 1.5));

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{percent}%</span>
        <span>
          {t("Estimé", "Estimated")} {estimatedMinutes} min
        </span>
      </div>
    </div>
  );
}
