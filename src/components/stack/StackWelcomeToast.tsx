import ToolLogo from "@/components/ToolLogo";
import WelcomeToast from "@/ds/Toast/Toast";
import type { ToolSummary } from "@/hooks/useSupabaseData";

/** The welcome after the onboarding (23/10/2026): the person's logos drop into place, then two short lines. */
export default function StackWelcomeToast({ title, detail, tools }: { title: string; detail: string; tools: ToolSummary[] }) {
  return <WelcomeToast title={title} detail={detail} logos={tools.slice(0, 4).map((tool) => <ToolLogo key={tool.id} tool={tool} size={26} />)} />;
}
