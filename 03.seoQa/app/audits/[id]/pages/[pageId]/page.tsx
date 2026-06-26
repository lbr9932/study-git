"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getRecommendation } from "@/lib/recommendations";
import type { AuditDetail, PageResult } from "@/lib/types";

type LoadState = "idle" | "loading" | "error";

export default function AuditPageDetail() {
  const params = useParams<{ id: string; pageId: string }>();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (params.id) void loadAudit(params.id);
  }, [params.id]);

  const page = useMemo(
    () => audit?.pages.find((item) => item.id === params.pageId) ?? null,
    [audit, params.pageId]
  );

  async function loadAudit(id: string) {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch(`/api/audits/${id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "페이지 상세를 불러오지 못했습니다.");
      setAudit(data.audit);
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <p className="overline">Page Detail</p>
          <h1>페이지 점검 상세</h1>
        </div>
        <div className="topbar-actions">
          <Link className="ghost-button link-button" href={`/audits/${params.id}`}>점검 결과</Link>
          <Link className="ghost-button link-button" href="/">목록</Link>
        </div>
      </header>

      {message ? <div className={state === "error" ? "alert error" : "alert"}>{message}</div> : null}
      {state === "loading" && !page ? <div className="alert">페이지 결과를 불러오는 중입니다.</div> : null}
      {state === "idle" && !page ? <div className="alert error">페이지 결과를 찾을 수 없습니다.</div> : null}

      {page ? <PageDetailCard auditId={params.id} page={page} /> : null}
    </main>
  );
}

function PageDetailCard({ auditId, page }: { auditId: string; page: PageResult }) {
  const failedChecks = page.checks.filter((check) => !check.passed);

  return (
    <section className="results">
      <div className="summary-grid">
        <Metric label="페이지 점수" value={`${Number(page.score).toFixed(2)}%`} />
        <Metric label="통과" value={page.passed_count} />
        <Metric label="미통과" value={page.failed_count} />
        <Metric label="HTTP" value={page.status_code ?? "-"} />
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="overline">URL</p>
            <h2>{page.url}</h2>
          </div>
          <span className={statusClass(page.status)}>{page.status}</span>
        </div>
        <div className="meta-strip">
          <span>audit {auditId.slice(0, 8)}</span>
          <span>{page.status_code ?? "no status"}</span>
          <span>{failedChecks.length} failed</span>
        </div>
        {page.error_message ? <div className="alert error">{page.error_message}</div> : null}
      </section>

      <section className="panel detail-grid-panel">
        <div className="panel-heading">
          <div>
            <p className="overline">Extracted SEO</p>
            <h2>소스 기준 추출값</h2>
          </div>
        </div>
        <dl className="page-detail page-detail-large">
          <dt>Title</dt>
          <dd>{page.title || "-"}</dd>
          <dt>Meta Description</dt>
          <dd>{page.meta_description || "-"}</dd>
          <dt>H1</dt>
          <dd>{page.h1 || "-"}</dd>
          <dt>Canonical</dt>
          <dd>{page.canonical || "-"}</dd>
        </dl>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="overline">Checks</p>
            <h2>항목별 판정</h2>
          </div>
          <span className="chip">{page.checks.length} checks</span>
        </div>
        <div className="check-list">
          {page.checks.map((check) => (
            <article className="check-row" key={check.id}>
              <div>
                <strong>{check.label}</strong>
                <span>{check.details}</span>
                {!check.passed ? <em>개선 방향: {getRecommendation(check.check_key)}</em> : null}
              </div>
              <span className={check.passed ? "status success" : "status error"}>{check.passed ? "pass" : "fail"}</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "completed" || status === "passed") return "status success";
  if (status === "running") return "status warning";
  return "status error";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}
