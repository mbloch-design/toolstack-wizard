ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS prescription_quality text DEFAULT 'silence';
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS prescription_output jsonb;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS prescription_block_reasons jsonb DEFAULT '[]';
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS prescription_context_questions jsonb DEFAULT '[]';
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS substitution_cluster_v2 text;