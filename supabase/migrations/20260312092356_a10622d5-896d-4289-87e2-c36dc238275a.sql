
-- Create leads table
CREATE TABLE public.leads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_type VARCHAR(20),
  job_role VARCHAR(20),
  main_goal VARCHAR(30),
  current_tools TEXT,
  ai_usage_level VARCHAR(20),
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  source VARCHAR(50) NOT NULL DEFAULT 'selector'
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public insert policy (anyone can submit the selector)
CREATE POLICY "Anyone can insert leads"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public read access (admin only via service role or dashboard)
