"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AuditDetail } from "@/lib/types";

type LoadState = "idle" | "loading" | "error";

export function RetryAuditButton({
  auditId,
  className,
  label = "재검증"
}: {
  auditId: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>("idle");
  const [message, setMessage] = useState("");
  const [loadedAuditId, setLoadedAuditId] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [maxPages, setMaxPages] = useState(20);
  const [respectRobots, setRespectRobots] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [authUser, setAuthUser] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  useEffect(() => {
    if (open && loadedAuditId !== auditId) void loadAudit(auditId);
  }, [open, auditId, loadedAuditId]);

  async function loadAudit(id: string) {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch(`/api/audits/${id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "재검증 설정을 불러오지 못했습니다.");
      applyAudit(data.audit);
      setLoadedAuditId(id);
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  async function runAudit() {
    setState("loading");
    setMessage("재검증을 실행 중입니다.");
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
      if (!response.ok) throw new Error(data.error ?? "재검증 실행에 실패했습니다.");
      setOpen(false);
      router.push(`/groups/${encodeURIComponent(data.groupKey)}`);
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  function applyAudit(audit: AuditDetail) {
    setTargetUrl(audit.target_url);
    setMaxPages(audit.max_pages);
    setRespectRobots(audit.respect_robots);
    setAuthRequired(audit.auth_required);
  }

  return (
    <>
      <button className={className ?? "text-button"} onClick={() => setOpen(true)} type="button">
        {label}
      </button>

      {open ? (
        <div className="dialog-backdrop" role="presentation">
          <div aria-modal="true" className="dialog" role="dialog">
            <div className="panel-heading">
              <div>
                <p className="overline">Retry Audit</p>
                <h2>재검증 설정</h2>
              </div>
            </div>

            {message ? <div className={state === "error" ? "alert error" : "alert"}>{message}</div> : null}

            <label className="field">
              <span>사이트 URL</span>
              <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} type="url" required />
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
              <input checked={authRequired} onChange={(event) => setAuthRequired(event.target.checked)} type="checkbox" />
              <span>인증이 필요한 사이트</span>
            </label>

            {authRequired ? (
              <>
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
              </>
            ) : null}

            <div className="dialog-actions">
              <button className="ghost-button" onClick={() => setOpen(false)} type="button">닫기</button>
              <button className="primary-button" disabled={state === "loading"} onClick={() => void runAudit()} type="button">
                {state === "loading" ? "재검증 중" : "재검증 실행"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}
