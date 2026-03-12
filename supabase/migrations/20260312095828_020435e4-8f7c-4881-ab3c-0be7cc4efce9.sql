
CREATE TABLE public.posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug VARCHAR NOT NULL,
  lang VARCHAR NOT NULL DEFAULT 'fr',
  title VARCHAR NOT NULL,
  excerpt TEXT,
  date DATE,
  category VARCHAR,
  tool_id VARCHAR,
  content TEXT,
  tags JSONB,
  read_time VARCHAR,
  seo JSONB,
  UNIQUE (slug, lang)
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read posts" ON public.posts
  FOR SELECT TO anon, authenticated
  USING (true);
