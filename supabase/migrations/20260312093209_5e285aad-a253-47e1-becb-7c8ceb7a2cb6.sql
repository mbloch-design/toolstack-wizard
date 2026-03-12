
-- Create categories table
CREATE TABLE public.categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT
);

-- Create tools table
CREATE TABLE public.tools (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(50) REFERENCES public.categories(id) ON DELETE SET NULL,
  short_description TEXT,
  long_description TEXT,
  affiliate_link VARCHAR(500) DEFAULT '',
  website_url VARCHAR(500) DEFAULT '',
  default_monthly_price INTEGER DEFAULT 0,
  pricing VARCHAR(20) DEFAULT 'free',
  logo VARCHAR(10) DEFAULT '',
  solo_relevance VARCHAR(50),
  team_relevance VARCHAR(50),
  verdict JSONB,
  pros JSONB,
  cons JSONB,
  use_cases JSONB,
  covers JSONB,
  relevant_for JSONB,
  alternatives JSONB,
  seo JSONB,
  articles JSONB
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read categories"
  ON public.categories FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public read tools"
  ON public.tools FOR SELECT TO anon, authenticated
  USING (true);
