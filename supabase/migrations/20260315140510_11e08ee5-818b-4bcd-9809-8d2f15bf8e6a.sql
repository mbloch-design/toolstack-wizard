ALTER TABLE tools ADD COLUMN IF NOT EXISTS pricing_v5 jsonb;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS decision_policy_v3 jsonb;