"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getRecommendation, getSchemaJsonExamples } from "@/lib/recommendations";
import { auditStatusClass, auditStatusLabel, checkStateClass, checkStateLabel } from "@/lib/status-labels";
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
          <Link className="ghost-button link-button" href="/groups">목록</Link>
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
  const orderedChecks = [...page.checks].sort((left, right) => compareCheckOrder(left.check_key, right.check_key));

  return (
      <section className="results">
        <div className="summary-grid">
        <Metric label="페이지 점수" value={`${Number(page.score).toFixed(2)}%`} />
        <Metric label="통과" value={page.passed_count} />
        <Metric label="미통과" value={page.failed_count} tone="danger" />
        <Metric label="HTTP" value={page.status_code ?? "-"} />
        </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="overline">URL</p>
            <h2>{page.url}</h2>
          </div>
          <span className={auditStatusClass(page.status)}>{auditStatusLabel(page.status)}</span>
        </div>
        <div className="meta-strip">
          <span>audit {auditId.slice(0, 8)}</span>
          <span>{page.status_code ?? "no status"}</span>
          <span>미통과 {failedChecks.length}개</span>
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
        <div className="check-item-list">
          {orderedChecks.map((check) => {
            const state = getCheckState(check, page);
            const extractedValue = getExtractedValue(check, page);
            const improvement = state === "improve" || state === "fail" ? getRecommendation(check.check_key) : "-";
            const supportRecommendation = getRecommendation(check.check_key);

            return (
              <article className="check-item" key={check.id}>
                <div className="check-item-head">
                  <h3>{check.label}</h3>
                  <span className={checkToneClass(check, page)}>{checkToneLabel(check, page)}</span>
                </div>
                <table className="check-item-table">
                  <tbody>
                    <tr>
                      <th className="check-item-emphasis" scope="row">소스 기준 추출값</th>
                      <td>
                        {check.check_key === "social_tag" ? (
                          <pre className="check-code"><code>{extractedValue}</code></pre>
                        ) : (
                          <span>{extractedValue}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th className="check-item-emphasis" scope="row">판정내용</th>
                      <td>{check.details}</td>
                    </tr>
                    <tr>
                      <th className="check-item-emphasis" scope="row">개선 방향</th>
                      <td>
                        <span>{improvement}</span>
                      </td>
                    </tr>
                    <tr>
                      <th className="check-item-emphasis" scope="row">보조 권장내용</th>
                      <td>{supportRecommendation}</td>
                    </tr>
                    {check.check_key === "schema" ? (
                      getSchemaJsonExamples(page).map((sample) => (
                        <tr key={sample.label}>
                          <th className="check-item-emphasis" scope="row">{sample.label}</th>
                          <td>
                            <pre className="json-sample"><code>{sample.value}</code></pre>
                          </td>
                        </tr>
                      ))
                    ) : null}
                  </tbody>
                </table>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "danger" }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong className={tone === "danger" ? "metric-danger" : undefined}>{value}</strong>
    </div>
  );
}

function checkToneClass(check: PageResult["checks"][number], page: PageResult) {
  return checkStateClass(getCheckState(check, page));
}

function checkToneLabel(check: PageResult["checks"][number], page: PageResult) {
  return checkStateLabel(getCheckState(check, page));
}

function getCheckState(check: PageResult["checks"][number], page: PageResult | null) {
  if (check.check_key === "meta_description") {
    const value = page?.meta_description?.trim() || "";
    if (!value) return "fail";
    if (value.length >= 50 && value.length <= 170) return "pass";
    return "improve";
  }

  return check.passed ? "pass" : "fail";
}

function getExtractedValue(check: PageResult["checks"][number], page: PageResult) {
  switch (check.check_key) {
    case "status":
      return page.status_code ? `${page.status_code}` : "-";
    case "title":
      return page.title || "-";
    case "meta_description":
      return page.meta_description || "-";
    case "h1":
      return page.h1 || "-";
    case "canonical":
      return page.canonical || "-";
    case "social_tag":
      return [
        `og:title: ${page.og_title || "-"}`,
        `og:description: ${page.og_description || "-"}`,
        `og:url: ${page.og_url || "-"}`,
        `twitter:card: ${page.twitter_card || "-"}`
      ].join("\n");
    case "schema":
      return check.details || "-";
    default:
      return "-";
  }
}

function compareCheckOrder(left: string, right: string) {
  const order = ["title", "status", "meta_description", "h1", "canonical", "social_tag", "schema"];
  return order.indexOf(left) - order.indexOf(right);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}
