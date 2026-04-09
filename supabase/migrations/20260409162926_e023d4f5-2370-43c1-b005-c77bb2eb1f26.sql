
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS short_description_en text,
  ADD COLUMN IF NOT EXISTS long_description_en text,
  ADD COLUMN IF NOT EXISTS pros_en jsonb,
  ADD COLUMN IF NOT EXISTS cons_en jsonb,
  ADD COLUMN IF NOT EXISTS use_cases_en jsonb,
  ADD COLUMN IF NOT EXISTS verdict_en jsonb,
  ADD COLUMN IF NOT EXISTS pricing_en jsonb;
