"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuditCriteriaPanel } from "@/components/audit-criteria-panel";
import { RetryAuditButton } from "@/components/retry-audit-button";
import { getRecommendation } from "@/lib/recommendations";
import { auditStatusClass, auditStatusLabel } from "@/lib/status-labels";
import type { AuditDetail, AuditGroupDetail, PageResult } from "@/lib/types";

type LoadState = "idle" | "loading" | "error";
type PageFilter = "all" | "passed" | "failed" | "error";

export default function AuditGroupPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<AuditGroupDetail | null>(null);
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [selectedAuditId, setSelectedAuditId] = useState("");
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [pageFilter, setPageFilter] = useState<PageFilter>("all");

  useEffect(() => {
    if (params.groupId) void loadGroup(params.groupId);
  }, [params.groupId]);

  useEffect(() => {
    if (selectedAuditId) void loadAudit(selectedAuditId);
  }, [selectedAuditId]);

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

  async function loadGroup(groupId: string) {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch(`/api/audit-groups/${groupId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "버전 그룹을 불러오지 못했습니다.");
      setGroup(data.group);
      setSelectedAuditId((current) =>
        current && data.group.versions.some((version: { id: string }) => version.id === current)
          ? current
          : data.group.latest_audit_id
      );
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  async function loadAudit(id: string) {
    try {
      const response = await fetch(`/api/audits/${id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "검증 상세를 불러오지 못했습니다.");
      setAudit(data.audit);
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  async function deleteGroup() {
    if (!group) return;
    setState("loading");
    try {
      const response = await fetch(`/api/audit-groups/${encodeURIComponent(group.audit_group_key)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "그룹 삭제에 실패했습니다.");
      router.push("/");
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  async function deleteVersion(versionId: string) {
    setState("loading");
    try {
      const response = await fetch(`/api/audits/${versionId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "버전 삭제에 실패했습니다.");
      const groupId = params.groupId;
      if (group?.versions.length === 1) {
        router.push("/");
        return;
      }
      await loadGroup(groupId);
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
          <p className="overline">Audit Group</p>
          <h1>점검 버전 목록</h1>
        </div>
        <div className="topbar-actions">
          <Link className="ghost-button link-button" href="/">홈</Link>
          <Link className="ghost-button link-button" href="/groups">그룹 목록</Link>
          <button className="ghost-button" onClick={() => void loadGroup(params.groupId)} type="button">새로고침</button>
        </div>
      </header>

      {message ? <div className={state === "error" ? "alert error" : "alert"}>{message}</div> : null}
      {state === "loading" && !group ? <div className="alert">버전 그룹을 불러오는 중입니다.</div> : null}

      {group ? (
        <section className="results">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="overline">Group</p>
                <h2>{group.audit_group_url}</h2>
              </div>
              <span className="chip">{group.versions.length} versions</span>
            </div>
            <div className="section-actions">
              <RetryAuditButton auditId={selectedAuditId || group.latest_audit_id} className="text-button" />
              <button className="danger-button" onClick={() => void deleteGroup()} type="button">그룹 삭제</button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="overline">Versions</p>
                <h2>점검 버전 목록</h2>
              </div>
            </div>
            <div className="version-list">
              {group.versions.map((version) => (
                <article className={selectedAuditId === version.id ? "version-row active" : "version-row"} key={version.id}>
                  <div>
                    <strong>{`v${version.version_no}`}</strong>
                    <span>{formatDate(version.created_at)}</span>
                  </div>
                  <div className="row-actions">
                    <span className={auditStatusClass(version.status)}>{auditStatusLabel(version.status)}</span>
                    <button className="text-button" onClick={() => setSelectedAuditId(version.id)} type="button">보기</button>
                    <button
                      className="danger-button"
                      onClick={() => void deleteVersion(version.id)}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {audit ? (
            <>
              <div className="summary-grid">
                <Metric label="선택 버전" value={`v${audit.version_no}`} />
                <Metric label="평균 점수" value={`${Number(audit.average_score).toFixed(2)}%`} />
                <Metric label="통과" value={audit.passed_count} />
                <Metric label="미통과" value={audit.failed_count} />
              </div>

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

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="overline">Detail</p>
                    <h2>검증 상세</h2>
                  </div>
                  <div className="topbar-actions">
                    <span className={auditStatusClass(audit.status)}>{auditStatusLabel(audit.status)}</span>
                    <Link className="text-button link-button" href={`/audits/${audit.id}`}>상세 페이지</Link>
                  </div>
                </div>
                <div className="meta-strip">
                  <span>{audit.target_url}</span>
                  <span>최대 {audit.max_pages} pages</span>
                  <span>robots {audit.respect_robots ? "on" : "off"}</span>
                  <span>{formatDate(audit.created_at)}</span>
                </div>
              </section>

              <section className="panel table-panel">
                <div className="panel-heading">
                  <div>
                    <p className="overline">Page Results</p>
                    <h2>페이지별 결과</h2>
                  </div>
                  <div className="filter-group">
                    <label htmlFor="group-page-filter">필터</label>
                    <select id="group-page-filter" value={pageFilter} onChange={(event) => setPageFilter(event.target.value as PageFilter)}>
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
                          {page.checks.filter((check) => !check.passed).map((check) => (
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
            </>
          ) : null}
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
