import { Tool, Persona } from '../types/diagnostic';

const CATEGORY_WEIGHTS: Record<string, Record<Persona, number>> = {
  "ia-coding":       { THEO: 95, SOFIA: 15, MARC: 10, ALIX: 20, CLAIRE: 10 },
  "llm":             { THEO: 80, SOFIA: 50, MARC: 70, ALIX: 90, CLAIRE: 60 },
  "design-ui":       { THEO: 20, SOFIA: 95, MARC: 15, ALIX: 30, CLAIRE: 15 },
  "crm":             { THEO: 10, SOFIA: 20, MARC: 90, ALIX: 30, CLAIRE: 80 },
  "newsletter":      { THEO: 15, SOFIA: 20, MARC: 30, ALIX: 95, CLAIRE: 25 },
  "compta":          { THEO: 20, SOFIA: 25, MARC: 40, ALIX: 20, CLAIRE: 95 },
  "design-video":    { THEO: 15, SOFIA: 90, MARC: 10, ALIX: 70, CLAIRE: 10 },
  "hosting":         { THEO: 95, SOFIA: 10, MARC: 10, ALIX: 15, CLAIRE: 20 },
  "database":        { THEO: 95, SOFIA: 5,  MARC: 5,  ALIX: 10, CLAIRE: 15 },
  "monitoring":      { THEO: 90, SOFIA: 5,  MARC: 5,  ALIX: 5,  CLAIRE: 10 },
  "social":          { THEO: 10, SOFIA: 40, MARC: 50, ALIX: 95, CLAIRE: 30 },
  "project-mgmt":    { THEO: 60, SOFIA: 50, MARC: 80, ALIX: 40, CLAIRE: 90 },
  "collaboration":   { THEO: 50, SOFIA: 60, MARC: 85, ALIX: 50, CLAIRE: 70 },
  "banking":         { THEO: 30, SOFIA: 30, MARC: 40, ALIX: 25, CLAIRE: 95 },
};

export function computePertinenceFallback(tool: Tool, persona: Persona): number {
  if (tool.pertinence_by_persona?.[persona] !== undefined) {
    return tool.pertinence_by_persona[persona];
  }
  return CATEGORY_WEIGHTS[tool.category]?.[persona] ?? 50;
}
