import { assertPublicUrl, isProductDetail, isSameDomain, normalizeForQueue, parseHttpUrl } from "./url-policy";

export type SeoCheck = {
  key: string;
  label: string;
  state: "pass" | "improve" | "fail";
  passed: boolean;
  score: 0 | 1;
  details: string;
  recommendation: string;
};

export type PageAudit = {
  url: string;
  status: "passed" | "failed" | "error" | "skipped" | "robots_blocked" | "unsupported_content" | "fetch_error";
  statusCode: number | null;
  score: number;
  passedCount: number;
  failedCount: number;
  errorMessage: string | null;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogUrl: string | null;
  twitterCard: string | null;
  schemaCount: number;
  checks: SeoCheck[];
  links: string[];
};

export type CrawlOptions = {
  targetUrl: string;
  maxPages: number;
  respectRobots: boolean;
  authRequired: boolean;
};

export const DEFAULT_MAX_PAGES = 25;
export const REQUEST_DELAY_MS = 650;

export async function crawlAndAudit(options: CrawlOptions) {
  const origin = parseHttpUrl(options.targetUrl);
  await assertPublicUrl(origin);

  const maxPages = clamp(options.maxPages || DEFAULT_MAX_PAGES, 1, 100);
  const disallowedPaths = options.respectRobots ? await loadRobots(origin) : [];
  const queue = [normalizeForQueue(origin)];
  const seen = new Set<string>();
  const pages: PageAudit[] = [];
  const events: { type: string; message: string }[] = [];

  if (options.authRequired) {
    events.push({
      type: "auth_notice",
      message: "인증 정보는 저장하지 않습니다. MVP는 소스 HTML 접근 기준으로 점검하며 로그인 자동 제출은 제외했습니다."
    });
  }

  while (queue.length > 0 && pages.length < maxPages) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    const currentUrl = parseHttpUrl(current);
    if (!isSameDomain(currentUrl, origin)) continue;
    if (isProductDetail(currentUrl)) {
      events.push({ type: "skipped_product", message: `제품 상세페이지 제외: ${currentUrl.toString()}` });
      continue;
    }

    if (isRobotsBlocked(currentUrl, disallowedPaths)) {
      pages.push(errorPage(currentUrl.toString(), "robots_blocked", "robots.txt 정책으로 차단된 URL입니다."));
      continue;
    }

    await assertPublicUrl(currentUrl);
    const page = await fetchAndAuditPage(currentUrl);
    pages.push(page);

    for (const link of page.links) {
      if (queue.length + seen.size >= maxPages * 3) break;
      const next = parseHttpUrl(link);
      const normalized = normalizeForQueue(next);
      if (!seen.has(normalized) && isSameDomain(next, origin) && !isProductDetail(next)) {
        queue.push(normalized);
      }
    }

    if (queue.length > 0 && pages.length < maxPages) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  return {
    origin: origin.origin,
    pages,
    events,
    policy: {
      queryParameters: "중복 제거를 위해 MVP에서는 query parameter를 제거한 URL을 기준으로 검사합니다.",
      robots: options.respectRobots ? "robots.txt의 User-agent: * Disallow 규칙을 단순 준수합니다." : "robots.txt 준수를 비활성화했습니다.",
      maxPages,
      requestDelayMs: REQUEST_DELAY_MS,
      concurrency: 1
    }
  };
}

async function fetchAndAuditPage(url: URL): Promise<PageAudit> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SEO-QA-Internal/0.1",
        Accept: "text/html,application/xhtml+xml"
      },
      redirect: "follow",
      signal: controller.signal
    });
    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return errorPage(url.toString(), "unsupported_content", "HTML 페이지가 아니어서 점검을 건너뜁니다.", response.status);
    }

    const html = await response.text();
    const summary = extractSeo(html);
    const checks = buildChecks(summary, response.status);
    const passedCount = checks.filter((check) => check.passed).length;
    const failedCount = checks.length - passedCount;
    const score = checks.length ? Math.round((passedCount / checks.length) * 100) : 0;

    return {
      url: url.toString(),
      status: failedCount === 0 ? "passed" : "failed",
      statusCode: response.status,
      score,
      passedCount,
      failedCount,
      errorMessage: null,
      ...summary,
      checks,
      links: extractLinks(html, url)
    };
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "페이지 요청 시간이 초과되었습니다." : stringifyError(error);
    return errorPage(url.toString(), "fetch_error", message);
  }
}

function extractSeo(html: string) {
  const title = textContent(matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const metaDescription = attrContent(html, "description");
  const h1 = extractH1Text(html);
  const canonical = matchAttr(html, /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/i, "href");
  return {
    title,
    metaDescription,
    h1,
    canonical,
    ogTitle: propContent(html, "og:title"),
    ogDescription: propContent(html, "og:description"),
    ogUrl: propContent(html, "og:url"),
    twitterCard: attrContent(html, "twitter:card"),
    schemaCount: (html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi) ?? []).length
  };
}

function buildChecks(summary: ReturnType<typeof extractSeo>, statusCode: number): SeoCheck[] {
  return [
    check(
      "status",
      "Status Code",
      "fail",
      statusCode >= 200 && statusCode < 300,
      `${statusCode} 응답`,
      "200대 응답이 나오도록 리다이렉트, 404, 500 오류를 먼저 정리하세요."
    ),
    check(
      "title",
      "Title",
      "fail",
      Boolean(summary.title),
      summary.title ? `title 확인 (${summary.title.length}자)` : "title 누락",
      "Title이 존재하고 페이지 주제를 구분할 수 있으면 통과로 봅니다. 구분자(|, >) 사용이나 게시글 상세의 축약 표기는 허용합니다."
    ),
    check(
      "meta_description",
      "Meta Description",
      summary.metaDescription && within(summary.metaDescription.length, 50, 170) ? "pass" : summary.metaDescription ? "improve" : "fail",
      Boolean(summary.metaDescription),
      summary.metaDescription ? `${summary.metaDescription.length}자` : "meta description 누락",
      summary.metaDescription
        ? within(summary.metaDescription.length, 50, 170)
          ? "description이 설정되어 있고 권장 길이도 충족합니다."
          : "description은 설정되어 있습니다. CTR을 높이려면 페이지의 핵심 가치와 클릭 이유가 드러나도록 더 자연스럽게 다듬고 50-170자 범위로 맞추세요."
        : "description이 비어 있습니다. 페이지 내용을 보고 50-170자 범위의 설명을 작성하세요."
    ),
    check("h1", "H1", "fail", Boolean(summary.h1), summary.h1 ? "H1 확인" : "H1 누락", "페이지 주제를 대표하는 H1을 1개 이상 명확히 노출하세요."),
    check("canonical", "Canonical", "fail", Boolean(summary.canonical), summary.canonical ? "canonical 확인" : "canonical 누락", "중복 URL 신호를 줄이기 위해 self canonical 또는 대표 URL canonical을 지정하세요."),
    check(
      "social_tag",
      "Social Tag",
      "fail",
      Boolean(summary.ogTitle && summary.ogDescription && summary.ogUrl && summary.twitterCard),
      "og:title, og:description, og:url, twitter:card 기준",
      "공유 미리보기에 필요한 OG/Twitter 태그를 title, description, url, image 중심으로 채우세요."
    ),
    check("schema", "Schema", "fail", summary.schemaCount > 0, summary.schemaCount > 0 ? `${summary.schemaCount}개 JSON-LD` : "JSON-LD schema 누락", "페이지 유형에 맞는 JSON-LD 구조화 데이터를 추가하세요.")
  ];
}

function check(key: string, label: string, state: SeoCheck["state"], passed: boolean, details: string, recommendation: string): SeoCheck {
  return { key, label, state, passed, score: passed ? 1 : 0, details, recommendation };
}

function extractLinks(html: string, base: URL) {
  const hrefs = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)).map((match) => match[1]);
  const links: string[] = [];
  for (const href of hrefs) {
    try {
      const url = new URL(href, base);
      if (["http:", "https:"].includes(url.protocol)) {
        links.push(normalizeForQueue(url));
      }
    } catch {
      continue;
    }
  }
  return Array.from(new Set(links));
}

async function loadRobots(origin: URL) {
  try {
    const robotsUrl = new URL("/robots.txt", origin);
    const response = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return [];
    const text = await response.text();
    return parseRobots(text);
  } catch {
    return [];
  }
}

function parseRobots(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.split("#")[0].trim());
  const disallow: string[] = [];
  let applies = false;

  for (const line of lines) {
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") applies = value === "*";
    if (applies && key === "disallow" && value) disallow.push(value);
  }

  return disallow;
}

function isRobotsBlocked(url: URL, disallowedPaths: string[]) {
  return disallowedPaths.some((path) => path !== "/" && url.pathname.startsWith(path));
}

function errorPage(url: string, status: PageAudit["status"], message: string, statusCode: number | null = null): PageAudit {
  return {
    url,
    status,
    statusCode,
    score: 0,
    passedCount: 0,
    failedCount: 0,
    errorMessage: message,
    title: null,
    metaDescription: null,
    h1: null,
    canonical: null,
    ogTitle: null,
    ogDescription: null,
    ogUrl: null,
    twitterCard: null,
    schemaCount: 0,
    checks: [],
    links: []
  };
}

function attrContent(html: string, name: string) {
  return findMetaContent(html, "name", name);
}

function propContent(html: string, property: string) {
  return findMetaContent(html, "property", property);
}

function matchAttr(html: string, tagRegex: RegExp, attr: string) {
  const tag = html.match(tagRegex)?.[0];
  if (!tag) return null;
  const value = readAttr(tag, attr);
  return value ? decodeHtml(value.trim()) : null;
}

function findMetaContent(html: string, attrName: "name" | "property", expected: string) {
  const tags = html.match(/<meta[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (readAttr(tag, attrName)?.toLowerCase() === expected.toLowerCase()) {
      const content = readAttr(tag, "content");
      return content ? decodeHtml(content.trim()) : null;
    }
  }
  return null;
}

function readAttr(tag: string, attr: string) {
  return tag.match(new RegExp(`${attr}=["']([^"']+)["']`, "i"))?.[1] ?? null;
}

function matchFirst(html: string, regex: RegExp) {
  return html.match(regex)?.[1] ?? null;
}

function textContent(value: string | null) {
  if (!value) return null;
  return decodeHtml(value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
}

function extractH1Text(html: string) {
  const inner = matchFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!inner) return null;
  const withAltText = inner.replace(/<img\b[^>]*alt=["']([^"']*)["'][^>]*>/gi, "$1");
  return textContent(withAltText);
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function within(value: number, min: number, max: number) {
  return value >= min && value <= max;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stringifyError(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
