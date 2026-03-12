
-- Allow delete for seeding (cleanup old data)
CREATE POLICY "Anyone can delete categories"
  ON public.categories FOR DELETE TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete tools"
  ON public.tools FOR DELETE TO anon, authenticated
  USING (true);

-- Add missing columns
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS use_cases JSONB;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS website_url VARCHAR(500) DEFAULT '';
