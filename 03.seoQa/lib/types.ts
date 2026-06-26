export type AuditSummary = {
  id: string;
  target_url: string;
  normalized_origin: string;
  status: string;
  max_pages: number;
  respect_robots: boolean;
  auth_required: boolean;
  average_score: string;
  passed_count: number;
  failed_count: number;
  error_count: number;
  page_count: number;
  created_by: string;
  created_at: string;
  completed_at: string | null;
};

export type PageResult = {
  id: string;
  audit_id: string;
  url: string;
  status: string;
  status_code: number | null;
  score: string;
  passed_count: number;
  failed_count: number;
  error_message: string | null;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  canonical: string | null;
  checks: CheckResult[];
};

export type CheckResult = {
  id: string;
  page_result_id: string;
  audit_id: string;
  check_key: string;
  label: string;
  passed: boolean;
  score: number;
  details: string;
  recommendation?: string;
};

export type AuditEvent = {
  id: string;
  audit_id: string;
  event_type: string;
  message: string;
  created_at: string;
};

export type AuditDetail = AuditSummary & {
  pages: PageResult[];
  events: AuditEvent[];
};
