export function auditStatusLabel(status: string) {
  if (status === "completed" || status === "passed") return "완료";
  if (status === "running") return "진행 중";
  if (status === "failed") return "개선 필요";
  if (status === "error" || status === "fetch_error" || status === "unsupported_content") return "오류";
  if (status === "robots_blocked") return "robots 차단";
  return status;
}

export function auditStatusClass(status: string) {
  if (status === "completed" || status === "passed") return "status success";
  if (status === "running") return "status warning";
  if (status === "failed") return "status improve";
  return "status error";
}

export function checkStateLabel(state: "pass" | "improve" | "fail") {
  if (state === "pass") return "통과";
  if (state === "improve") return "개선 권장";
  return "미통과";
}

export function checkStateClass(state: "pass" | "improve" | "fail") {
  if (state === "pass") return "status success";
  if (state === "improve") return "status improve";
  return "status error";
}
