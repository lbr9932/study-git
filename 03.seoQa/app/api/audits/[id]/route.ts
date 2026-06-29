import { NextRequest, NextResponse } from "next/server";
import { ensureAuditGroupingData } from "@/lib/audit-groups";
import { ensureSchema, pool } from "@/lib/db";
import type { AuditDetail, AuditEvent, AuditSummary, CheckResult, PageResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await ensureSchema();
    await ensureAuditGroupingData();
    const { id } = await params;
    const auditResult = await pool.query<AuditSummary>("SELECT * FROM audits WHERE id = $1", [id]);
    const audit = auditResult.rows[0];

    if (!audit) {
      return NextResponse.json({ error: "점검 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    const pagesResult = await pool.query<Omit<PageResult, "checks">>(
      "SELECT * FROM page_results WHERE audit_id = $1 ORDER BY created_at ASC",
      [id]
    );
    const checksResult = await pool.query<CheckResult>(
      "SELECT * FROM check_results WHERE audit_id = $1 ORDER BY label ASC",
      [id]
    );
    const eventsResult = await pool.query<AuditEvent>(
      "SELECT * FROM audit_events WHERE audit_id = $1 ORDER BY created_at ASC",
      [id]
    );

    const checksByPage = new Map<string, CheckResult[]>();
    for (const check of checksResult.rows) {
      const checks = checksByPage.get(check.page_result_id) ?? [];
      checks.push(check);
      checksByPage.set(check.page_result_id, checks);
    }

    const detail: AuditDetail = {
      ...audit,
      pages: pagesResult.rows.map((page) => ({
        ...page,
        checks: checksByPage.get(page.id) ?? []
      })),
      events: eventsResult.rows
    };

    return NextResponse.json({ audit: detail });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await ensureSchema();
    await ensureAuditGroupingData();
    const { id } = await params;
    await pool.query("DELETE FROM audits WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}
