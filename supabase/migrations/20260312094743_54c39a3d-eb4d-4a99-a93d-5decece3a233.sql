
ALTER TABLE public.tools ALTER COLUMN pricing DROP DEFAULT;
ALTER TABLE public.tools ALTER COLUMN pricing TYPE JSONB USING pricing::jsonb;
