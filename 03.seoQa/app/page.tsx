"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuditCriteriaPanel } from "@/components/audit-criteria-panel";

type LoadState = "idle" | "loading" | "error";

export default function Home() {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState("");
  const [maxPages, setMaxPages] = useState(20);
  const [respectRobots, setRespectRobots] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authUser, setAuthUser] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [state, setState] = useState<LoadState>("idle");
  const [message, setMessage] = useState("");

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
      router.push(`/groups/${encodeURIComponent(data.groupKey)}`);
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <p className="overline">Internal SEO QA</p>
          <h1>SEO 점검</h1>
        </div>
        <Link className="ghost-button link-button" href="/groups">점검 버전 그룹</Link>
      </header>

      <section className="single-column">
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
              placeholder="https://example.com"
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

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="overline">Preview</p>
              <h2>점검 결과 예시</h2>
            </div>
          </div>
          <p className="empty">점검 항목: Title, Description, H1, Canonical, Social Tag, Schema</p>
          <AuditCriteriaPanel compact />
        </section>

        {message ? <div className={state === "error" ? "alert error" : "alert"}>{message}</div> : null}
      </section>

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
              <span>비밀번호</span>
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}
