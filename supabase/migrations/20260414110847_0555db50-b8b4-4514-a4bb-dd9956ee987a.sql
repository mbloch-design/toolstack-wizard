ALTER TABLE public.tools
ADD COLUMN IF NOT EXISTS pertinence_by_persona jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS force_silence boolean DEFAULT false;