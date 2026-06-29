export function getRecommendation(checkKey: string) {
  const recommendations: Record<string, string> = {
    status: "200대 응답이 나오도록 리다이렉트, 404, 500 오류를 먼저 정리하세요.",
    title: "Title이 비어 있지 않고 페이지 주제를 구분할 수 있으면 됩니다. 구분자(|, >) 사용과 게시글 상세의 축약 표기는 허용합니다.",
    meta_description: "Meta Description은 CTR에 영향을 줍니다. 내용이 있으면 더 자연스럽게 다듬고, 비어 있으면 페이지 요약을 50-170자 범위로 채우세요.",
    h1: "페이지 주제를 대표하는 H1을 1개 이상 명확히 노출하세요.",
    canonical: "중복 URL 신호를 줄이기 위해 self canonical 또는 대표 URL canonical을 지정하세요.",
    social_tag: "공유 미리보기에 필요한 OG/Twitter 태그를 title, description, url, image 중심으로 채우세요.",
    schema: "페이지 유형에 맞는 JSON-LD 구조화 데이터를 추가하세요."
  };

  return recommendations[checkKey] ?? "엑셀 기준표의 해당 항목 조건에 맞게 콘텐츠 또는 메타 데이터를 보완하세요.";
}

import type { PageResult } from "./types";

export function getSchemaJsonExamples(page: PageResult) {
  const siteUrl = page.og_url || page.url || "https://example.com";
  const siteName = inferSiteName(siteUrl, page.title);
  const pageTitle = page.title || "페이지 제목";
  const pageDescription = page.meta_description || "페이지 요약 설명";

  return [
    {
      label: "현재 페이지 기준",
      value: `{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${escapeJson(pageTitle)}",
  "description": "${escapeJson(pageDescription)}",
  "url": "${escapeJson(page.url)}",
  "mainEntityOfPage": "${escapeJson(page.url)}"
}`
    },
    {
      label: "사이트 기반 붙여넣기용",
      value: `{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "페이지 제목",
  "description": "페이지 요약 설명",
  "url": "https://example.com/page",
  "isPartOf": {
    "@type": "WebSite",
    "name": "사이트명",
    "url": "https://example.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "브랜드명",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "mainEntityOfPage": "https://example.com/page"
}`
    }
  ];
}

function inferSiteName(siteUrl: string, title: string | null) {
  try {
    const host = new URL(siteUrl).hostname.replace(/^www\./, "");
    const titleParts = (title || "").split(/[|>]/).map((part) => part.trim()).filter(Boolean);
    if (titleParts.length > 1) {
      return titleParts[titleParts.length - 1] || host;
    }
    return host || "사이트명";
  } catch {
    return "사이트명";
  }
}

function resolveLogoUrl(siteUrl: string) {
  try {
    const url = new URL(siteUrl);
    return `${url.origin}/logo.png`;
  } catch {
    return "https://example.com/logo.png";
  }
}

function escapeJson(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
