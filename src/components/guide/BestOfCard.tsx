import { Link } from "@/lib/routerLinks";
import ToolLogo from "@/components/ToolLogo";
import bestOfGuides from "@/data/bestOfGuides.json";
import bestOfCovers from "@/data/bestOfCovers.json";

type Lang = "fr" | "en";
type Cover = { count: number; checkedOn: string | null; tools: { slug: string; name: string; logo?: string; websiteUrl?: string }[] };

const COVERS = bestOfCovers as Record<string, Cover>;
export const BEST_OF_CARDS = bestOfGuides.guides;

/**
 * A « best tools » ranking as a compact row: three overlapping logos, the
 * title, the number of tools. Used under « Latest guides » on the guides index
 * and in « More rankings » on each ranking page. Data comes from the light
 * src/data/bestOfCovers.json, not from the 184 KB ranking snapshot.
 */
export default function BestOfCard({ guideId, lang }: { guideId: string; lang: Lang }) {
  const guide = BEST_OF_CARDS.find((item) => item.id === guideId);
  const cover = COVERS[guideId];
  if (!guide || !cover) return null;
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  return (
    <Link to={`/${lang}/guide/${guide.slug[lang]}`} className="gi-rank">
      <span className="gi-rank-logos" aria-hidden="true">
        {cover.tools.slice(0, 3).map((tool) => <ToolLogo key={tool.slug} tool={tool} size={32} alt="" />)}
      </span>
      <span className="gi-rank-copy">
        <span className="gi-rank-title">{guide.h1[lang]}</span>
        <span className="gi-rank-meta">{t(`${cover.count} outils classés`, `${cover.count} tools ranked`)}</span>
      </span>
    </Link>
  );
}
