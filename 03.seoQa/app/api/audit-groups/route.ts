import { NextResponse } from "next/server";
import { ensureAuditGroupingData } from "@/lib/audit-groups";
import { ensureSchema, pool } from "@/lib/db";
import type { AuditGroupSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    await ensureAuditGroupingData();

    const result = await pool.query<AuditGroupSummary>(`
      SELECT DISTINCT ON (audit_group_key)
        audit_group_key,
        audit_group_url,
        id AS latest_audit_id,
        version_no AS latest_version_no,
        status AS latest_status,
        created_at AS last_run_at,
        COUNT(*) OVER (PARTITION BY audit_group_key)::int AS version_count
      FROM audits
      WHERE audit_group_key IS NOT NULL
      ORDER BY audit_group_key, version_no DESC
    `);

    return NextResponse.json({ groups: result.rows });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}
