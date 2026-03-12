
-- Allow anon to insert categories and tools (for seeding from frontend)
CREATE POLICY "Anyone can insert categories"
  ON public.categories FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can insert tools"
  ON public.tools FOR INSERT TO anon, authenticated
  WITH CHECK (true);
