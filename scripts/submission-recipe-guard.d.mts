export function recipeTarget(env: Record<string, string | undefined>): { endpoint: string; token: string; preactivation: boolean };
export function assertEmptyRegistry(length: unknown): void;
export function isolateRecipeCommand(command: (string | number)[], key: string): (string | number)[];
