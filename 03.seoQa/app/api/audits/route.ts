import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, pool } from "@/lib/db";
import { crawlAndAudit, DEFAULT_MAX_PAGES } from "@/lib/seo";
import type { AuditSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const result = await pool.query<AuditSummary>(`
      SELECT *
      FROM audits
      ORDER BY created_at DESC
      LIMIT 50
    `);
    return NextResponse.json({ audits: result.rows });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    const body = await request.json();
    const targetUrl = String(body.targetUrl ?? "").trim();
    const maxPages = Number(body.maxPages ?? DEFAULT_MAX_PAGES);
    const respectRobots = body.respectRobots !== false;
    const authRequired = Boolean(body.authRequired);

    if (!targetUrl) {
      return NextResponse.json({ error: "점검할 URL을 입력하세요." }, { status: 400 });
    }

    const auditId = randomUUID();
    const createdBy = "internal-user";

    await pool.query(
      `
        INSERT INTO audits (id, target_url, normalized_origin, status, max_pages, respect_robots, auth_required, created_by)
        VALUES ($1, $2, $3, 'running', $4, $5, $6, $7)
      `,
      [auditId, targetUrl, targetUrl, Math.max(1, Math.min(100, maxPages || DEFAULT_MAX_PAGES)), respectRobots, authRequired, createdBy]
    );

    try {
      const crawl = await crawlAndAudit({ targetUrl, maxPages, respectRobots, authRequired });
      let totalPassed = 0;
      let totalFailed = 0;
      let errorCount = 0;

      for (const event of crawl.events) {
        await pool.query(
          `INSERT INTO audit_events (id, audit_id, event_type, message) VALUES ($1, $2, $3, $4)`,
          [randomUUID(), auditId, event.type, event.message]
        );
      }

      await pool.query(
        `INSERT INTO audit_events (id, audit_id, event_type, message) VALUES ($1, $2, $3, $4)`,
        [
          randomUUID(),
          auditId,
          "policy",
          `쿼리 제거, robots=${respectRobots ? "준수" : "미준수"}, 요청 간격 ${crawl.policy.requestDelayMs}ms, 동시 실행 ${crawl.policy.concurrency}`
        ]
      );

      for (const page of crawl.pages) {
        const pageId = randomUUID();
        if (page.status === "error" || page.status === "robots_blocked" || page.errorMessage) errorCount += 1;
        totalPassed += page.passedCount;
        totalFailed += page.failedCount;

        await pool.query(
          `
            INSERT INTO page_results (
              id, audit_id, url, status, status_code, score, passed_count, failed_count,
              error_message, title, meta_description, h1, canonical
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `,
          [
            pageId,
            auditId,
            page.url,
            page.status,
            page.statusCode,
            page.score,
            page.passedCount,
            page.failedCount,
            page.errorMessage,
            page.title,
            page.metaDescription,
            page.h1,
            page.canonical
          ]
        );

        for (const check of page.checks) {
          await pool.query(
            `
              INSERT INTO check_results (id, page_result_id, audit_id, check_key, label, passed, score, details)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
            [randomUUID(), pageId, auditId, check.key, check.label, check.passed, check.score, check.details]
          );
        }
      }

      const checkTotal = totalPassed + totalFailed;
      const averageScore = checkTotal > 0 ? Math.round((totalPassed / checkTotal) * 10000) / 100 : 0;

      await pool.query(
        `
          UPDATE audits
          SET normalized_origin = $2,
              status = 'completed',
              average_score = $3,
              passed_count = $4,
              failed_count = $5,
              error_count = $6,
              page_count = $7,
              completed_at = now()
          WHERE id = $1
        `,
        [auditId, crawl.origin, averageScore, totalPassed, totalFailed, errorCount, crawl.pages.length]
      );
    } catch (error) {
      await pool.query(
        `
          UPDATE audits
          SET status = 'failed',
              error_count = 1,
              completed_at = now()
          WHERE id = $1
        `,
        [auditId]
      );
      await pool.query(
        `INSERT INTO audit_events (id, audit_id, event_type, message) VALUES ($1, $2, $3, $4)`,
        [randomUUID(), auditId, "failed", errorMessage(error)]
      );
    }

    return NextResponse.json({ id: auditId });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}

