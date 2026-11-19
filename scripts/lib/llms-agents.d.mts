/* eslint-disable @typescript-eslint/no-explicit-any -- the agents catalogue is typed in src/lib/agents.ts; this module only reads it */
export function publishedServers<T extends { slug: string; advice?: unknown }>(catalog: { servers: T[] }, sitemap: string): T[];
export function serverAdvice(server: any): string;
export function assertNoBracket(text: string, where: string): string;
export function agentsAdviceBlock(servers: any[]): string;
export function agentsIndexSection(servers: any[], skillCount: number): string;
