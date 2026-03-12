
-- Remove permissive INSERT/DELETE policies on categories
DROP POLICY IF EXISTS "Anyone can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON public.categories;

-- Remove permissive INSERT/DELETE policies on tools
DROP POLICY IF EXISTS "Anyone can insert tools" ON public.tools;
DROP POLICY IF EXISTS "Anyone can delete tools" ON public.tools;
