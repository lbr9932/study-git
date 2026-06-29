"use client";

export function AuditCriteriaPanel({ compact = false }: { compact?: boolean }) {
  return (
    <details className={compact ? "criteria-panel compact" : "criteria-panel"}>
      <summary>점검 기준 보기</summary>
      <div className="criteria-list">
        <div><strong>Title</strong><span>존재 여부, 페이지별 고유성, 사이트명 후행 배치</span></div>
        <div><strong>Description</strong><span>존재 여부, 50~170자</span></div>
        <div><strong>H1</strong><span>존재 여부</span></div>
        <div><strong>Canonical</strong><span>존재 여부</span></div>
        <div><strong>Social Tag</strong><span>og:title, og:description, og:url, twitter:card</span></div>
        <div><strong>Schema</strong><span>JSON-LD 존재 여부</span></div>
      </div>
    </details>
  );
}
