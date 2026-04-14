
-- Table clusters
CREATE TABLE public.clusters (
  id text PRIMARY KEY,
  persona text NOT NULL,
  "order" integer NOT NULL,
  question text NOT NULL,
  question_en text,
  why text,
  cols integer DEFAULT 2,
  tool_ids jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read clusters" ON public.clusters
  FOR SELECT TO anon, authenticated USING (true);

-- Table doublon_rules
CREATE TABLE public.doublon_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ids jsonb NOT NULL,
  message text NOT NULL,
  savings numeric DEFAULT 0,
  category text
);

ALTER TABLE public.doublon_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read doublon_rules" ON public.doublon_rules
  FOR SELECT TO anon, authenticated USING (true);

-- Table discovery_questions
CREATE TABLE public.discovery_questions (
  id text PRIMARY KEY,
  persona text NOT NULL,
  question text NOT NULL,
  subtitle text,
  options jsonb NOT NULL,
  condition_tool_ids jsonb DEFAULT '[]'::jsonb,
  condition_type text DEFAULT 'any'
);

ALTER TABLE public.discovery_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read discovery_questions" ON public.discovery_questions
  FOR SELECT TO anon, authenticated USING (true);
