import type { PageResult } from "@/lib/types";

type SeoAuditBlock = {
  currentStatus: string;
  problem: string;
  violatedRule: string;
  reason: string;
  guideline: string;
  example?: string;
};

export type SeoAuditGuidance = {
  title: SeoAuditBlock;
  metaDescription: SeoAuditBlock;
  h1: SeoAuditBlock;
  canonical: SeoAuditBlock;
  url: SeoAuditBlock;
  socialTag: SeoAuditBlock;
  structuredData: SeoAuditBlock;
};

export function buildSeoGuidance(page: PageResult): SeoAuditGuidance {
  const parsedUrl = safeUrl(page.url);
  const homepage = isHomePage(parsedUrl);
  const siteName = inferSiteName(page.title, page.h1, parsedUrl);
  const subject = inferSubject(page.title, page.h1, parsedUrl, siteName);
  const schemaDetails = page.checks.find((check) => check.check_key === "schema")?.details ?? "확인 불가";

  return {
    title: buildTitleAudit(page.title, subject, siteName, homepage),
    metaDescription: buildMetaDescriptionAudit(page.meta_description, subject, siteName),
    h1: buildH1Audit(page.h1, subject),
    canonical: buildCanonicalAudit(page.canonical, page.url),
    url: buildUrlAudit(page.url, subject),
    socialTag: buildSocialTagAudit(page),
    structuredData: buildStructuredDataAudit(schemaDetails, page, subject, siteName)
  };
}

function buildTitleAudit(title: string | null, subject: string, siteName: string, homepage: boolean): SeoAuditBlock {
  const currentStatus = title?.trim() || "확인 불가";
  const issues: string[] = [];

  if (!title?.trim()) {
    issues.push("Title이 존재하지 않습니다.");
  } else {
    if (!homepage && normalizeText(title) === normalizeText(siteName)) {
      issues.push("사이트명만 있고 페이지 고유 주제가 드러나지 않습니다.");
    }
  }

  return {
    currentStatus,
    problem: issues.length ? issues.join(" ") : "양호",
    violatedRule: issues.length
      ? "페이지별 고유 Title이 있어야 하고, 사이트명만 반복되지 않아야 한다는 기준에 어긋납니다."
      : "없음",
    reason: issues.length
      ? "Title은 검색 결과에서 가장 직접적으로 노출되는 핵심 메타 정보라서 페이지 주제와 브랜드 구분이 명확해야 합니다."
      : "해당 없음",
    guideline: "권장 기준: Title 존재 여부, 페이지 주제 구분 가능 여부, 구분자(|, >) 사용 및 게시글 상세 축약 표기 허용"
  };
}

function buildMetaDescriptionAudit(metaDescription: string | null, subject: string, siteName: string): SeoAuditBlock {
  const currentStatus = metaDescription?.trim() || "확인 불가";
  const issues: string[] = [];

  if (!metaDescription?.trim()) {
    issues.push("Meta Description이 존재하지 않습니다.");
  } else if (metaDescription.length < 50 || metaDescription.length > 170) {
    issues.push("권장 길이 50~170자 기준에서 벗어났습니다.");
  }

  return {
    currentStatus,
    problem: issues.length ? issues.join(" ") : "양호",
    violatedRule: issues.length
      ? "Meta Description은 페이지 내용을 자연스럽게 요약하고, 검색 결과에서 클릭을 유도할 수 있는 50~170자 범위로 관리하는 기준에 어긋납니다."
      : "없음",
    reason: issues.length
      ? "Meta Description은 직접 랭킹 요소는 아니지만 검색 결과 클릭률과 문서 주제 이해에 영향을 줍니다."
      : "해당 없음",
    guideline: "권장 기준: Meta Description 존재 여부, 50~170자 범위, 페이지 내용을 직접 요약"
  };
}

function buildH1Audit(h1: string | null, subject: string): SeoAuditBlock {
  const currentStatus = h1?.trim() || "확인 불가";
  const hasH1 = Boolean(h1?.trim());

  return {
    currentStatus,
    problem: hasH1 ? "양호" : "대표 주제를 보여주는 H1이 확인되지 않습니다.",
    violatedRule: hasH1 ? "없음" : "페이지 핵심 주제를 설명하는 H1이 명확히 존재해야 한다는 기준에 어긋납니다.",
    reason: hasH1 ? "해당 없음" : "H1은 문서의 대표 주제를 사용자와 검색엔진에 동시에 전달하는 기본 구조입니다.",
    guideline: "권장 기준: H1 존재 여부, 페이지 주제를 직접 설명하는지 확인"
  };
}

function buildCanonicalAudit(canonical: string | null, pageUrl: string): SeoAuditBlock {
  const currentStatus = canonical?.trim() || "-";
  const normalizedPage = normalizeUrl(pageUrl);
  const normalizedCanonical = normalizeUrl(canonical);
  const hasCanonical = Boolean(canonical?.trim());
  const issue = !hasCanonical
    ? "Canonical이 존재하지 않습니다."
    : normalizedCanonical && normalizedPage && normalizedCanonical !== normalizedPage
      ? "현재 페이지 URL과 다른 canonical이 설정되어 있습니다. 대표 URL 의도 확인이 필요합니다."
      : "";

  return {
    currentStatus,
    problem: issue ? "확인 필요" : "양호",
    violatedRule: issue
      ? "중복 URL 신호를 줄이기 위해 canonical을 명확히 지정해야 한다는 기준에 어긋납니다."
      : "없음",
    reason: issue
      ? "Canonical이 없거나 예상과 다르면 검색엔진이 어떤 URL을 대표 문서로 이해해야 하는지 혼란이 생길 수 있습니다."
      : "해당 없음",
    guideline: "권장 기준: Canonical 존재 여부, 현재 페이지 또는 대표 URL과 일치하는지 확인"
  };
}

function buildUrlAudit(pageUrl: string, subject: string): SeoAuditBlock {
  const parsedUrl = safeUrl(pageUrl);
  const pathname = parsedUrl?.pathname || "확인 불가";
  const search = parsedUrl?.search || "";
  const issues: string[] = [];
  const homepage = isHomePage(parsedUrl);

  if (!parsedUrl) {
    issues.push("URL을 해석할 수 없습니다.");
  } else {
    if (search && reliesOnQueryForIdentity(pathname, search)) {
      issues.push("Query Parameter에 주요 콘텐츠 식별을 의존하고 있습니다.");
    }
    if (!homepage && hasMeaninglessSlug(pathname)) {
      issues.push("의미 없는 slug를 사용하고 있습니다.");
    }
    if (isExcessivelyLongUrl(parsedUrl)) {
      issues.push("URL 길이가 과도하게 깁니다.");
    }
    if (hasUnsafeUrlCharacters(parsedUrl)) {
      issues.push("대문자, 공백 또는 특수문자가 포함되어 있습니다.");
    }
  }

  return {
    currentStatus: parsedUrl ? `${pathname}${search}` : "확인 불가",
    problem: issues.length ? issues.join(" ") : "양호",
    violatedRule: issues.length
      ? "Query Parameter 의존, 의미 없는 slug, 과도한 길이, 대문자/공백/특수문자 사용을 피해야 한다는 URL 기준에 어긋납니다."
      : "없음",
    reason: issues.length
      ? "URL은 콘텐츠 식별과 공유 가독성, 중복 관리에 직접 영향을 주므로 의미 있는 slug와 안정적인 구조를 유지하는 편이 좋습니다."
      : "해당 없음",
    guideline: "권장 기준: 의미 있는 영어 slug, query 의존 최소화, 과도한 길이 및 특수문자 사용 회피"
  };
}

function buildSocialTagAudit(page: PageResult): SeoAuditBlock {
  const currentStatus = [
    `og:title=${page.og_title || "확인 불가"}`,
    `og:description=${page.og_description || "확인 불가"}`,
    `og:url=${page.og_url || "확인 불가"}`,
    `twitter:card=${page.twitter_card || "확인 불가"}`
  ].join("\n");

  const missing = [
    !page.og_title ? "og:title" : "",
    !page.og_description ? "og:description" : "",
    !page.og_url ? "og:url" : "",
    !page.twitter_card ? "twitter:card" : ""
  ].filter(Boolean);

  const hasMissing = missing.length > 0;

  return {
    currentStatus,
    problem: hasMissing ? `${missing.join(", ")} 값이 부족합니다.` : "양호",
    violatedRule: hasMissing
      ? "공유 미리보기용 Open Graph 및 Twitter Card 메타 정보를 갖춰야 한다는 기준에 어긋납니다."
      : "없음",
    reason: hasMissing
      ? "Social Tag가 누락되면 메신저나 SNS 공유 시 제목, 설명, URL 컨텍스트가 불안정하게 표시될 수 있습니다."
      : "해당 없음",
    guideline: "권장 기준: og:title, og:description, og:url, twitter:card 존재 여부"
  };
}

function buildStructuredDataAudit(schemaDetails: string, page: PageResult, subject: string, siteName: string): SeoAuditBlock {
  const missing = schemaDetails.includes("누락");
  const currentStatus = schemaDetails || "확인 불가";

  return {
    currentStatus,
    problem: missing ? "구조화 데이터가 확인되지 않습니다." : "양호",
    violatedRule: missing
      ? "페이지 유형에 맞는 구조화 데이터를 제공해야 한다는 기준에 어긋납니다."
      : "없음",
    reason: missing
      ? "구조화 데이터는 검색엔진이 문서 유형과 핵심 엔티티를 더 명확하게 해석하는 데 도움을 줍니다."
      : "해당 없음",
    guideline: "권장 기준: JSON-LD 존재 여부, 페이지 유형에 맞는 Schema 사용",
    example: `{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${siteName}",
  "description": "${subject}",
  "url": "${page.url}",
  "isPartOf": {
    "@type": "WebSite",
    "name": "${siteName}",
    "url": "${page.og_url || page.url}"
  }
}`
  };
}

function inferSiteName(title: string | null, h1: string | null, url: URL | null) {
  const host = (url?.hostname ?? "사이트").replace(/^www\./, "");
  const titleParts = splitTitle(title);

  if (titleParts.length > 1) {
    const [first, second] = titleParts;
    if (looksLikeDomain(second)) return first;
    if (looksLikeDomain(first)) return second;
  }

  if (titleParts.length === 1 && titleParts[0]) return titleParts[0];
  if (h1?.trim()) return h1.trim();
  return host;
}

function inferSubject(title: string | null, h1: string | null, url: URL | null, siteName: string) {
  const titleParts = splitTitle(title);
  const pathname = url?.pathname || "/";
  const fromTitle = titleParts.find((part) => normalizeText(part) !== normalizeText(siteName));
  const fromH1 = h1?.trim();
  const fromPath = pathname !== "/" ? unslugify(pathname.split("/").filter(Boolean).pop() || "") : "";
  return (fromTitle || fromH1 || fromPath || siteName || "페이지").trim() || "페이지";
}

function splitTitle(title: string | null) {
  return (title || "").split(/[|>]/).map((part) => part.trim()).filter(Boolean);
}

function reliesOnQueryForIdentity(pathname: string, search: string) {
  if (!search) return false;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return true;
  return segments.every((segment) => /^(view|detail|item|page|index|list)$/i.test(segment));
}

function hasMeaninglessSlug(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  return segments.some((segment) => {
    const normalized = segment.toLowerCase();
    if (/^(page\d+|p\d+|abc\d+|test\d*|\d+)$/.test(normalized)) return true;
    if (/^[a-z]{1,3}\d{2,}$/.test(normalized)) return true;
    return false;
  });
}

function isExcessivelyLongUrl(url: URL) {
  return url.toString().length > 120;
}

function hasUnsafeUrlCharacters(url: URL) {
  const raw = `${url.pathname}${url.search}`;
  return /[A-Z\s]/.test(raw) || /[^A-Za-z0-9\-._~/?=&]/.test(raw);
}

function looksLikeDomain(value: string) {
  return /[a-z0-9-]+\.[a-z]{2,}$/i.test(value.trim());
}

function safeUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.hash = "";
    return `${url.origin}${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function unslugify(value: string) {
  return value.replace(/-/g, " ").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "about";
}

function isHomePage(url: URL | null) {
  if (!url) return false;
  return url.pathname === "/" || url.pathname === "";
}
