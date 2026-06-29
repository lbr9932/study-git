"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuditCriteriaPanel } from "@/components/audit-criteria-panel";
import { RetryAuditButton } from "@/components/retry-audit-button";
import { getRecommendation } from "@/lib/recommendations";
import { auditStatusClass, auditStatusLabel } from "@/lib/status-labels";
import type { AuditDetail, PageResult } from "@/lib/types";

type LoadState = "idle" | "loading" | "error";
type PageFilter = "all" | "passed" | "failed" | "error";

export default function AuditDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [pageFilter, setPageFilter] = useState<PageFilter>("all");

  useEffect(() => {
    if (params.id) void loadAudit(params.id);
  }, [params.id]);

  const failedPages = useMemo(() => audit?.pages.filter((page) => page.error_message || page.failed_count > 0) ?? [], [audit]);
  const failedCheckLabels = useMemo(() => {
    if (!audit) return [];
    return audit.pages
      .flatMap((page) => page.checks.filter((check) => !check.passed).map((check) => check.label))
      .filter((label, index, source) => source.indexOf(label) === index)
      .slice(0, 3);
  }, [audit]);
  const filteredPages = useMemo(() => {
    const pages = audit?.pages ?? [];
    if (pageFilter === "passed") return pages.filter((page) => page.status === "passed" && page.failed_count === 0 && !page.error_message);
    if (pageFilter === "failed") return pages.filter((page) => page.failed_count > 0 && !page.error_message);
    if (pageFilter === "error") return pages.filter((page) => Boolean(page.error_message) || page.status === "error" || page.status === "robots_blocked");
    return pages;
  }, [audit, pageFilter]);

  async function loadAudit(id: string) {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch(`/api/audits/${id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "점검 상세를 불러오지 못했습니다.");
      setAudit(data.audit);
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  async function deleteAudit() {
    if (!audit) return;
    setState("loading");
    try {
      const response = await fetch(`/api/audits/${audit.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "삭제에 실패했습니다.");
      router.push("/");
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <p className="overline">Audit Detail</p>
          <h1>점검 결과</h1>
        </div>
        <div className="topbar-actions">
          {audit ? <Link className="ghost-button link-button" href={`/groups/${encodeURIComponent(audit.audit_group_key)}`}>버전 목록</Link> : null}
          <Link className="ghost-button link-button" href="/groups">목록</Link>
          <button className="ghost-button" onClick={() => void loadAudit(params.id)} type="button">새로고침</button>
        </div>
      </header>

      {message ? <div className={state === "error" ? "alert error" : "alert"}>{message}</div> : null}
      {state === "loading" && !audit ? <div className="alert">점검 결과를 불러오는 중입니다.</div> : null}

      {audit ? (
        <section className="results">
          <div className="summary-grid">
            <Metric label="평균 점수" value={`${Number(audit.average_score).toFixed(2)}%`} />
            <Metric label="통과" value={audit.passed_count} />
            <Metric label="미통과" value={audit.failed_count} />
            <Metric label="에러" value={audit.error_count} />
          </div>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="overline">Dashboard</p>
                <h2>{audit.target_url}</h2>
              </div>
              <span className={auditStatusClass(audit.status)}>{auditStatusLabel(audit.status)}</span>
            </div>
            <div className="meta-strip">
              <span>{`v${audit.version_no}`}</span>
              <span>실행자 {audit.created_by}</span>
              <span>최대 {audit.max_pages} pages</span>
              <span>robots {audit.respect_robots ? "on" : "off"}</span>
              <span>{formatDate(audit.created_at)}</span>
            </div>
            <div className="section-actions">
              <RetryAuditButton auditId={audit.id} className="text-button" />
              <button className="danger-button" onClick={() => void deleteAudit()} type="button">삭제</button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="overline">Priority</p>
                <h2>먼저 볼 항목</h2>
              </div>
            </div>
            <div className="meta-strip">
              <span>{`미통과 ${audit.failed_count}개`}</span>
              {failedCheckLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </section>

          <section className="panel">
            <AuditCriteriaPanel />
          </section>

          <section className="panel table-panel">
            <div className="panel-heading">
              <div>
                <p className="overline">Page Results</p>
                <h2>페이지별 결과</h2>
              </div>
              <div className="filter-group">
                <label htmlFor="page-filter">필터</label>
                <select
                  id="page-filter"
                  value={pageFilter}
                  onChange={(event) => setPageFilter(event.target.value as PageFilter)}
                >
                  <option value="all">전체</option>
                  <option value="passed">통과</option>
                  <option value="failed">미통과</option>
                  <option value="error">에러</option>
                </select>
                <span className="chip">{filteredPages.length} / {audit.pages.length}</span>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>상태</th>
                    <th>Score</th>
                    <th>Pass</th>
                    <th>Fail</th>
                    <th>주요 실패 항목</th>
                    <th>Title</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPages.map((page) => (
                    <PageRow auditId={audit.id} key={page.id} page={page} />
                  ))}
                </tbody>
              </table>
              {filteredPages.length === 0 ? <p className="empty table-empty">선택한 필터에 해당하는 페이지가 없습니다.</p> : null}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="overline">Needs Attention</p>
                <h2>개선 필요 페이지</h2>
              </div>
              <span className="chip">{failedPages.length} items</span>
            </div>
            <div className="error-list">
              {failedPages.length === 0 ? (
                <p className="empty">에러 또는 미통과 항목이 없습니다.</p>
              ) : (
                failedPages.map((page) => (
                  <details key={page.id} className="detail-card">
                    <summary>
                      <span>{page.url}</span>
                      <strong>{page.error_message ? "오류" : `${page.failed_count}개 미통과`}</strong>
                    </summary>
                    {page.error_message ? <p className="error-text">{page.error_message}</p> : null}
                    <ul>
                      {page.checks
                        .filter((check) => !check.passed)
                        .map((check) => (
                          <li key={check.id}>
                            <strong>{check.label}</strong>
                            <span>
                              {check.details}
                              <em>개선 방향: {getRecommendation(check.check_key)}</em>
                            </span>
                          </li>
                        ))}
                    </ul>
                  </details>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="overline">Events</p>
                <h2>실행 기록</h2>
              </div>
            </div>
            <div className="event-list">
              {audit.events.map((event) => (
                <div key={event.id}>
                  <span>{event.event_type}</span>
                  <p>{event.message}</p>
                </div>
              ))}
            </div>
          </section>
        </section>
      ) : null}
    </main>
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

function PageRow({ auditId, page }: { auditId: string; page: PageResult }) {
  return (
    <tr>
      <td>
        <details>
          <summary>
            <Link href={`/audits/${auditId}/pages/${page.id}`}>{page.url}</Link>
          </summary>
          <dl className="page-detail">
            <dt>Meta Description</dt>
            <dd>{page.meta_description || "-"}</dd>
            <dt>H1</dt>
            <dd>{page.h1 || "-"}</dd>
            <dt>Canonical</dt>
            <dd>{page.canonical || "-"}</dd>
            <dt>미통과</dt>
            <dd>
              {page.checks.filter((check) => !check.passed).map((check) => (
                <span className="fail-chip" key={check.id}>
                  {check.label}: {check.details}
                  <em>개선 방향: {getRecommendation(check.check_key)}</em>
                </span>
              ))}
            </dd>
          </dl>
        </details>
      </td>
      <td><span className={auditStatusClass(page.status)}>{auditStatusLabel(page.status)}</span></td>
      <td>{Number(page.score).toFixed(2)}%</td>
      <td>{page.passed_count}</td>
      <td>{page.failed_count}</td>
      <td>{page.checks.filter((check) => !check.passed).slice(0, 2).map((check) => check.label).join(", ") || "-"}</td>
      <td>{page.title || "-"}</td>
    </tr>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}
