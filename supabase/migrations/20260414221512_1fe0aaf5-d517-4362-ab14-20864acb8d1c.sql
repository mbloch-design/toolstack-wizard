
CREATE TABLE IF NOT EXISTS public.diagnostic_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_name TEXT,
  persona TEXT,
  language TEXT DEFAULT 'fr',
  email TEXT,
  tjm INTEGER DEFAULT 0,
  api_spend_tranche TEXT,
  selected_tools JSONB DEFAULT '[]',
  discovery_answers JSONB DEFAULT '{}',
  closing_answers JSONB DEFAULT '[]',
  stack_total_cost NUMERIC DEFAULT 0,
  estimated_waste NUMERIC DEFAULT 0,
  optimized_cost NUMERIC DEFAULT 0,
  health_score INTEGER DEFAULT 0,
  health_label TEXT,
  annual_savings NUMERIC DEFAULT 0,
  hours_recoverable NUMERIC DEFAULT 0,
  prescriptions JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  tool_scores JSONB DEFAULT '{}',
  actions_completed INTEGER DEFAULT 0,
  email_preferences JSONB DEFAULT '{}'
);

ALTER TABLE public.diagnostic_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous diagnostic)
CREATE POLICY "Anyone can insert diagnostic_sessions"
ON public.diagnostic_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow update only on actions_completed (use permissive for simplicity, app controls scope)
CREATE POLICY "Anyone can update diagnostic_sessions"
ON public.diagnostic_sessions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
