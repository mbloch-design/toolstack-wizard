import ToolLogo from "@/components/ToolLogo";
import type { ToolSummary } from "@/hooks/useSupabaseData";

/** The welcome after the onboarding (23/10/2026): the person's logos drop into place, then two short lines. */
export default function StackWelcomeToast({ title, detail, tools }: { title: string; detail: string; tools: ToolSummary[] }) {
  return <div className="ms-welcome-toast" role="status">
    <span className="ms-welcome-toast-logos" aria-hidden="true">{tools.slice(0, 4).map((tool, at) => <span key={tool.id} style={{ animationDelay: `${120 + at * 90}ms` }}><ToolLogo tool={tool} size={26} /></span>)}</span>
    <span className="ms-welcome-toast-text"><b>{title}</b><small>{detail}</small></span>
    <span className="ms-welcome-toast-spark" aria-hidden="true">{Array.from({ length: 6 }, (_, at) => <i key={at} style={{ ["--a" as string]: `${at * 60}deg` }} />)}</span>
  </div>;
}
