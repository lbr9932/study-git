import dns from "node:dns/promises";
import net from "node:net";

const PRIVATE_IPV4_RANGES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\./
];

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"]);
const BLOCKED_EXACT_IPS = new Set(["::1", "0:0:0:0:0:0:0:1", "169.254.169.254"]);

export function parseHttpUrl(value: string) {
  const url = new URL(value.trim());
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("HTTP 또는 HTTPS URL만 입력할 수 있습니다.");
  }
  url.hash = "";
  return url;
}

export function normalizeForQueue(url: URL) {
  const normalized = new URL(url.toString());
  normalized.hash = "";
  normalized.search = "";
  if (normalized.pathname.length > 1) {
    normalized.pathname = normalized.pathname.replace(/\/+$/, "");
  }
  return normalized.toString();
}

export function isSameDomain(candidate: URL, origin: URL) {
  return candidate.hostname === origin.hostname;
}

export function isProductDetail(url: URL) {
  return /\/products\/[^/]+/.test(url.pathname);
}

export async function assertPublicUrl(url: URL) {
  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith(".localhost")) {
    throw new Error("localhost 또는 내부 호스트는 점검할 수 없습니다.");
  }

  const directIpVersion = net.isIP(hostname);
  const addresses = directIpVersion
    ? [{ address: hostname, family: directIpVersion }]
    : await dns.lookup(hostname, { all: true });

  for (const record of addresses) {
    if (isPrivateAddress(record.address)) {
      throw new Error("사설 IP, 내부망, 클라우드 메타데이터 주소는 점검할 수 없습니다.");
    }
  }
}

function isPrivateAddress(address: string) {
  if (BLOCKED_EXACT_IPS.has(address)) return true;

  if (net.isIPv4(address)) {
    return PRIVATE_IPV4_RANGES.some((range) => range.test(address));
  }

  if (net.isIPv6(address)) {
    const lower = address.toLowerCase();
    return lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:");
  }

  return true;
}

