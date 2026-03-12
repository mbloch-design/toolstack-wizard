import { useParams } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePostBySlug } from "@/hooks/useSupabaseData";

const GuideDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const { post, loading } = usePostBySlug(slug, lang);

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="mt-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-full rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto max-w-3xl py-12 text-center">
        <h1 className="text-2xl font-bold">{t("Article introuvable", "Article not found")}</h1>
      </div>
    );
  }

  return (
    <div className="py-12">
      <article className="container mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm text-muted-foreground">
            {post.date} · {post.readTime} · {post.category}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div
          className="prose prose-neutral dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-tighter
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed prose-p:text-foreground/90
            prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80
            prose-strong:text-foreground
            prose-table:text-sm
            prose-img:rounded-xl prose-img:shadow-md"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
        />
      </article>
    </div>
  );
};

// Simple markdown to HTML converter
function markdownToHtml(md: string): string {
  let html = md;
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/gm, (_match, header, _sep, body) => {
    const headers = header.split("|").filter((c: string) => c.trim());
    const rows = body.trim().split("\n").map((r: string) => r.split("|").filter((c: string) => c.trim()));
    const ths = headers.map((h: string) => `<th>${h.trim()}</th>`).join("");
    const trs = rows.map((r: string[]) => `<tr>${r.map((c: string) => `<td>${c.trim()}</td>`).join("")}</tr>`).join("");
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
  html = html.replace(/- ☐ (.+)/g, '<li class="list-none">☐ $1</li>');
  html = html.replace(/^---$/gm, "<hr />");
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, "<p>$1</p>");
  html = html.replace(/<p>\s*<\/p>/g, "");
  return html;
}

export default GuideDetailPage;
