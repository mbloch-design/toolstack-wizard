import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import type { Post } from "@/hooks/useSupabaseData";

/* ─────────────────────────────────────────────────────────────────────────────
   GuideCardEditorial — editorial card for article / guide listings
   ec-* base system. No gradient thumbnail. No blue badges.
   Text-forward: title + excerpt + reading time.
───────────────────────────────────────────────────────────────────────────── */

interface GuideCardEditorialProps {
  post: Post;
  prefix: string;
  /** fr → "Lire l'article"  en → "Read article" */
  ctaLabel?: string;
}

export function GuideCardEditorial({ post, prefix, ctaLabel = "Lire →" }: GuideCardEditorialProps) {
  return (
    <Link to={`${prefix}/guide/${post.slug}`} className="ec-card">
      <span className="ec-label">{post.category || "GUIDE"}</span>

      <div
        className="ec-title"
        style={{ fontSize: "clamp(1.0625rem, 1.6vw, 1.3rem)" }}
      >
        {post.title}
      </div>

      <p
        className="ec-text"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {post.excerpt}
      </p>

      <hr className="ec-divider" />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 14,
        }}
      >
        {post.readTime && (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              color: "#6F6F68",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Clock style={{ width: 11, height: 11 }} />
            {post.readTime}
          </span>
        )}
        <span className="ec-cta" style={{ marginTop: 0, marginLeft: "auto" }}>
          {ctaLabel}
          <ArrowRight className="ec-cta-arrow" style={{ width: 13, height: 13 }} />
        </span>
      </div>
    </Link>
  );
}

export default GuideCardEditorial;
