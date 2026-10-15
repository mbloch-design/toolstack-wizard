import { getFeatureLabel } from "@/lib/featureLabels";
import { getFeatureIcon } from "@/lib/featureIcons";

interface Props {
  covers: string[];
  functionalNeeds?: string[];
  toolName: string;
  t: (fr: string, en: string) => string;
}

const MAX_FEATURES = 6;

export default function ToolFeaturesBlock({ covers, functionalNeeds = [], toolName, t }: Props) {
  // Merge covers + functional_needs, deduplicate, cap at MAX_FEATURES
  const lang = t("fr", "en") === "fr" ? "fr" : "en";
  const allSlugs = [...new Set([...covers, ...functionalNeeds])];
  if (allSlugs.length === 0) return null;

  const features = allSlugs.slice(0, MAX_FEATURES).map(slug => ({
    slug,
    label: getFeatureLabel(slug, lang as "fr" | "en"),
    Icon: getFeatureIcon(slug),
  }));

  return (
    <div className="td-features-summary">
      {/* Feature grid (parent section already renders the eyebrow + title) */}
      <div className="td-feature-grid">
        {features.map(({ slug, label, Icon }) => (
          <div key={slug} className="td-feature">
            <Icon />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {allSlugs.length > MAX_FEATURES && (
        <p style={{ marginTop: 12, fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--color-muted)" }}>
          {t(
            `+ ${allSlugs.length - MAX_FEATURES} autres fonctionnalités`,
            `+ ${allSlugs.length - MAX_FEATURES} more features`
          )}
        </p>
      )}
    </div>
  );
}
