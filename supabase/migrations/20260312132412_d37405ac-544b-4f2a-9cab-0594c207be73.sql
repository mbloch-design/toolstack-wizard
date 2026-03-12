-- Add new fields to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tjm integer DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS project_phase text DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tech_maturity text DEFAULT NULL;

-- Create selector_results table
CREATE TABLE public.selector_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id bigint REFERENCES public.leads(id) ON DELETE CASCADE,
  persona text NOT NULL,
  stack_health_score integer DEFAULT 0,
  recommended_tools jsonb DEFAULT '[]'::jsonb,
  tools_to_cancel jsonb DEFAULT '[]'::jsonb,
  estimated_savings_monthly integer DEFAULT 0,
  roi_analysis jsonb DEFAULT '[]'::jsonb,
  share_token uuid DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS: anyone can insert results (selector is public)
ALTER TABLE public.selector_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert selector_results" ON public.selector_results
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- RLS: anyone can read results by share_token
CREATE POLICY "Public read selector_results by share_token" ON public.selector_results
  FOR SELECT TO anon, authenticated USING (true);