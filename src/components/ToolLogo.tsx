import type { Tool } from "@/data/types";

type LogoTool = Pick<Tool, "name">;

interface ToolLogoProps {
  tool: LogoTool;
  size?: number;
  className?: string;
}

const ToolLogo = ({ tool, size = 32, className = "" }: ToolLogoProps) => {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-hidden="true"
    >
      {(tool.name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
};

export default ToolLogo;
