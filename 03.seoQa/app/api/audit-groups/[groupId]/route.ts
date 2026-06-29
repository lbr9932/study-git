import { NextRequest, NextResponse } from "next/server";
import { ensureAuditGroupingData } from "@/lib/audit-groups";
import { ensureSchema, pool } from "@/lib/db";
import type { AuditGroupDetail, AuditSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ groupId: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await ensureSchema();
    await ensureAuditGroupingData();
    const { groupId } = await params;
    const groupKey = decodeURIComponent(groupId);

    const versionsResult = await pool.query<AuditSummary>(
      `
        SELECT *
        FROM audits
        WHERE audit_group_key = $1
        ORDER BY version_no DESC, created_at DESC
      `,
      [groupKey]
    );

    if (versionsResult.rows.length === 0) {
      return NextResponse.json({ error: "버전 그룹을 찾을 수 없습니다." }, { status: 404 });
    }

    const latest = versionsResult.rows[0];
    const detail: AuditGroupDetail = {
      audit_group_key: groupKey,
      audit_group_url: latest.audit_group_url,
      latest_audit_id: latest.id,
      versions: versionsResult.rows
    };

    return NextResponse.json({ group: detail });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await ensureSchema();
    await ensureAuditGroupingData();
    const { groupId } = await params;
    const groupKey = decodeURIComponent(groupId);
    await pool.query("DELETE FROM audits WHERE audit_group_key = $1", [groupKey]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}
