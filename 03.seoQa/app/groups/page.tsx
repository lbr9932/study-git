"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RetryAuditButton } from "@/components/retry-audit-button";
import { auditStatusClass, auditStatusLabel } from "@/lib/status-labels";
import type { AuditGroupSummary } from "@/lib/types";

type LoadState = "idle" | "loading" | "error";

export default function AuditGroupsPage() {
  const [groups, setGroups] = useState<AuditGroupSummary[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadGroups();
  }, []);

  async function loadGroups() {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch("/api/audit-groups", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "그룹 목록을 불러오지 못했습니다.");
      setGroups(data.groups);
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
          <p className="overline">Groups</p>
          <h1>점검 버전 그룹</h1>
        </div>
        <div className="topbar-actions">
          <Link className="ghost-button link-button" href="/">홈</Link>
          <button className="ghost-button" onClick={() => void loadGroups()} type="button">새로고침</button>
        </div>
      </header>

      {message ? <div className={state === "error" ? "alert error" : "alert"}>{message}</div> : null}
      {state === "loading" && groups.length === 0 ? <div className="alert">그룹 목록을 불러오는 중입니다.</div> : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="overline">Group List</p>
            <h2>점검 목록</h2>
          </div>
          <span className="chip">{groups.length} groups</span>
        </div>

        <div className="history-list">
          {groups.length === 0 ? (
            <p className="empty">저장된 점검 그룹이 없습니다.</p>
          ) : (
            groups.map((group) => (
              <article className="history-row" key={group.audit_group_key}>
                <Link href={`/groups/${encodeURIComponent(group.audit_group_key)}`}>
                  <strong>{group.audit_group_url}</strong>
                  <span>{`v${group.latest_version_no}`} · {formatDate(group.last_run_at)} · {group.version_count} versions</span>
                </Link>
                <div className="row-actions">
                  <span className={auditStatusClass(group.latest_status)}>{auditStatusLabel(group.latest_status)}</span>
                  <RetryAuditButton auditId={group.latest_audit_id} className="text-button" />
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
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
