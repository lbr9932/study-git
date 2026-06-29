CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY,
  target_url TEXT NOT NULL,
  normalized_origin TEXT NOT NULL,
  audit_group_key TEXT,
  audit_group_url TEXT,
  version_no INTEGER,
  status TEXT NOT NULL,
  max_pages INTEGER NOT NULL,
  respect_robots BOOLEAN NOT NULL DEFAULT TRUE,
  auth_required BOOLEAN NOT NULL DEFAULT FALSE,
  average_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  passed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT 'internal-user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS page_results (
  id UUID PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  status_code INTEGER,
  score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  passed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  canonical TEXT,
  og_title TEXT,
  og_description TEXT,
  og_url TEXT,
  twitter_card TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS check_results (
  id UUID PRIMARY KEY,
  page_result_id UUID NOT NULL REFERENCES page_results(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  check_key TEXT NOT NULL,
  label TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  score INTEGER NOT NULL,
  details TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_group_key ON audits(audit_group_key, version_no DESC);
CREATE INDEX IF NOT EXISTS idx_page_results_audit_id ON page_results(audit_id);
CREATE INDEX IF NOT EXISTS idx_check_results_audit_id ON check_results(audit_id);
