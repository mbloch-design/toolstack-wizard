
ALTER TABLE tools ADD COLUMN IF NOT EXISTS tool_type text DEFAULT 'satellite';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS substitutable boolean DEFAULT true;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS host_app text;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS bundle_parent text;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS verticals jsonb DEFAULT '[]';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS functional_needs jsonb DEFAULT '[]';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS ia_use_case jsonb;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS better_alternative jsonb;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS migration_guide jsonb;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS downgrade_plan jsonb;

CREATE TABLE IF NOT EXISTS verticals (
  id text PRIMARY KEY,
  family text NOT NULL,
  label text NOT NULL,
  functional_needs jsonb NOT NULL DEFAULT '[]'
);

ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read verticals" ON public.verticals FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE selector_results ADD COLUMN IF NOT EXISTS verticals_composite jsonb;
ALTER TABLE selector_results ADD COLUMN IF NOT EXISTS user_stack jsonb DEFAULT '[]';
