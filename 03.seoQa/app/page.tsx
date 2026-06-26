"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AuditDetail, AuditSummary, PageResult } from "@/lib/types";

type LoadState = "idle" | "loading" | "error";

export default function Home() {
  const router = useRouter();
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [selected, setSelected] = useState<AuditDetail | null>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [maxPages, setMaxPages] = useState(20);
  const [respectRobots, setRespectRobots] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authUser, setAuthUser] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [state, setState] = useState<LoadState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadAudits();
  }, []);

  useEffect(() => {
    const reuseId = new URLSearchParams(window.location.search).get("reuse");
    if (reuseId) void loadAuditForReuse(reuseId);
  }, []);

  const failedPages = useMemo(() => selected?.pages.filter((page) => page.error_message || page.failed_count > 0) ?? [], [selected]);

  async function loadAudits() {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch("/api/audits", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "점검 목록을 불러오지 못했습니다.");
      setAudits(data.audits);
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  async function loadAudit(id: string) {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch(`/api/audits/${id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "점검 상세를 불러오지 못했습니다.");
      setSelected(data.audit);
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  async function loadAuditForReuse(id: string) {
    try {
      const response = await fetch(`/api/audits/${id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "점검 상세를 불러오지 못했습니다.");
      reuseAudit(data.audit);
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  async function runAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("점검을 실행 중입니다. 최대 페이지 수에 따라 시간이 걸릴 수 있습니다.");

    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl,
          maxPages,
          respectRobots,
          authRequired
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "점검 실행에 실패했습니다.");

      setAuthUser("");
      setAuthPassword("");
      await loadAudits();
      router.push(`/audits/${data.id}`);
      setMessage("점검이 완료되었습니다.");
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  async function deleteAudit(id: string) {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch(`/api/audits/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "삭제에 실패했습니다.");
      if (selected?.id === id) setSelected(null);
      await loadAudits();
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  function reuseAudit(audit: AuditSummary) {
    setTargetUrl(audit.target_url);
    setMaxPages(audit.max_pages);
    setRespectRobots(audit.respect_robots);
    setAuthRequired(audit.auth_required);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <p className="overline">Internal SEO QA</p>
          <h1>Shopify SEO 점검</h1>
        </div>
        <button className="ghost-button" onClick={() => void loadAudits()} type="button">
          새로고침
        </button>
      </header>

      <section className="layout-grid">
        <form className="panel run-panel" onSubmit={(event) => void runAudit(event)}>
          <div className="panel-heading">
            <div>
              <p className="overline">New Audit</p>
              <h2>신규 점검 설정</h2>
            </div>
            <span className="chip">1020px desktop</span>
          </div>

          <label className="field">
            <span>사이트 URL</span>
            <input
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              placeholder="https://example.myshopify.com"
              type="url"
              required
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>최대 페이지 수</span>
              <input
                value={maxPages}
                min={1}
                max={100}
                onChange={(event) => setMaxPages(Number(event.target.value))}
                type="number"
              />
            </label>
            <label className="field checkbox-field">
              <input checked={respectRobots} onChange={(event) => setRespectRobots(event.target.checked)} type="checkbox" />
              <span>robots.txt 준수</span>
            </label>
          </div>

          <label className="field checkbox-field auth-toggle">
            <input
              checked={authRequired}
              onChange={(event) => {
                setAuthRequired(event.target.checked);
                if (event.target.checked) setAuthDialogOpen(true);
              }}
              type="checkbox"
            />
            <span>인증이 필요한 사이트</span>
          </label>

          {authRequired ? (
            <div className="notice">
              인증 정보는 저장하지 않습니다. MVP에서는 로그인 자동 제출 대신 입력 절차와 미저장 정책만 적용합니다.
            </div>
          ) : null}

          <button className="primary-button" disabled={state === "loading"} type="submit">
            {state === "loading" ? "점검 중" : "점검 실행"}
          </button>
        </form>

        <section className="panel history-panel">
          <div className="panel-heading">
            <div>
              <p className="overline">History</p>
              <h2>이전 점검</h2>
            </div>
            <span className="chip">{audits.length} records</span>
          </div>

          <div className="history-list">
            {audits.length === 0 ? (
              <p className="empty">저장된 점검 기록이 없습니다.</p>
            ) : (
              audits.map((audit) => (
                <article className="history-row" key={audit.id}>
                  <Link href={`/audits/${audit.id}`}>
                    <strong>{audit.normalized_origin || audit.target_url}</strong>
                    <span>{formatDate(audit.created_at)} · {audit.page_count} pages</span>
                  </Link>
                  <div className="row-actions">
                    <span className={statusClass(audit.status)}>{audit.status}</span>
                    <button className="text-button" onClick={() => reuseAudit(audit)} type="button">재검증</button>
                    <button className="danger-button" onClick={() => void deleteAudit(audit.id)} type="button">삭제</button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      {message ? <div className={state === "error" ? "alert error" : "alert"}>{message}</div> : null}

      {selected ? (
        <section className="results">
          <div className="summary-grid">
            <Metric label="평균 점수" value={`${Number(selected.average_score).toFixed(2)}%`} />
            <Metric label="통과" value={selected.passed_count} />
            <Metric label="미통과" value={selected.failed_count} />
            <Metric label="에러" value={selected.error_count} />
          </div>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="overline">Dashboard</p>
                <h2>{selected.target_url}</h2>
              </div>
              <span className={statusClass(selected.status)}>{selected.status}</span>
            </div>
            <div className="meta-strip">
              <span>실행자 {selected.created_by}</span>
              <span>최대 {selected.max_pages} pages</span>
              <span>robots {selected.respect_robots ? "on" : "off"}</span>
              <span>{formatDate(selected.created_at)}</span>
            </div>
          </section>

          <section className="panel table-panel">
            <div className="panel-heading">
              <div>
                <p className="overline">Page Results</p>
                <h2>페이지별 결과</h2>
              </div>
              <span className="chip">Excel-like table</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Pass</th>
                    <th>Fail</th>
                    <th>Title</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.pages.map((page) => (
                    <PageRow key={page.id} page={page} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="overline">Errors</p>
                <h2>에러 상태</h2>
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
                      <strong>{page.error_message ? "error" : `${page.failed_count} failed`}</strong>
                    </summary>
                    {page.error_message ? <p className="error-text">{page.error_message}</p> : null}
                    <ul>
                      {page.checks
                        .filter((check) => !check.passed)
                        .map((check) => (
                          <li key={check.id}>
                            <strong>{check.label}</strong>
                            <span>{check.details}</span>
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
              {selected.events.map((event) => (
                <div key={event.id}>
                  <span>{event.event_type}</span>
                  <p>{event.message}</p>
                </div>
              ))}
            </div>
          </section>
        </section>
      ) : null}

      {authDialogOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <div aria-modal="true" className="dialog" role="dialog">
            <div className="panel-heading">
              <div>
                <p className="overline">Credentials</p>
                <h2>인증 정보 입력</h2>
              </div>
            </div>
            <label className="field">
              <span>아이디 또는 이메일</span>
              <input autoComplete="off" value={authUser} onChange={(event) => setAuthUser(event.target.value)} />
            </label>
            <label className="field">
              <span>비밀번호 또는 Shopify password</span>
              <input
                autoComplete="new-password"
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
              />
            </label>
            <div className="notice">이 값은 현재 브라우저 상태에만 있고 서버로 저장하지 않습니다.</div>
            <div className="dialog-actions">
              <button className="ghost-button" onClick={() => setAuthDialogOpen(false)} type="button">닫기</button>
              <button className="primary-button" onClick={() => setAuthDialogOpen(false)} type="button">확인</button>
            </div>
          </div>
        </div>
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

function PageRow({ page }: { page: PageResult }) {
  return (
    <tr>
      <td>
        <details>
          <summary>{page.url}</summary>
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
                <span className="fail-chip" key={check.id}>{check.label}: {check.details}</span>
              ))}
            </dd>
          </dl>
        </details>
      </td>
      <td><span className={statusClass(page.status)}>{page.status}</span></td>
      <td>{Number(page.score).toFixed(2)}%</td>
      <td>{page.passed_count}</td>
      <td>{page.failed_count}</td>
      <td>{page.title || "-"}</td>
    </tr>
  );
}

function statusClass(status: string) {
  if (status === "completed" || status === "passed") return "status success";
  if (status === "running") return "status warning";
  return "status error";
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
