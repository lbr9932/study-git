import { pool } from "@/lib/db";

type Grouping = {
  groupKey: string;
  groupUrl: string;
};

export function normalizeAuditGroup(targetUrl: string): Grouping {
  const parsed = new URL(targetUrl);
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const pathname = normalizePathname(parsed.pathname);
  const groupKey = `${host}${pathname}` || host;
  const groupUrl = `https://${host}${pathname}`;

  return { groupKey, groupUrl };
}

export async function ensureAuditGroupingData() {
  const result = await pool.query<{
    id: string;
    target_url: string;
    audit_group_key: string | null;
    audit_group_url: string | null;
    version_no: number | null;
    created_at: string;
  }>(`
    SELECT id, target_url, audit_group_key, audit_group_url, version_no, created_at
    FROM audits
    ORDER BY created_at ASC
  `);

  const versionMap = new Map<string, number>();

  for (const row of result.rows) {
    const { groupKey, groupUrl } = normalizeAuditGroup(row.target_url);
    const nextVersion = (versionMap.get(groupKey) ?? 0) + 1;
    versionMap.set(groupKey, nextVersion);

    if (row.audit_group_key !== groupKey || row.audit_group_url !== groupUrl || row.version_no !== nextVersion) {
      await pool.query(
        `
          UPDATE audits
          SET audit_group_key = $2,
              audit_group_url = $3,
              version_no = $4
          WHERE id = $1
        `,
        [row.id, groupKey, groupUrl, nextVersion]
      );
    }
  }
}

function normalizePathname(pathname: string) {
  const normalized = pathname.trim().replace(/\/+/g, "/");
  if (!normalized || normalized === "/") return "/";
  const withoutTrailingSlash = normalized.replace(/\/$/, "");
  return withoutTrailingSlash.startsWith("/") ? withoutTrailingSlash.toLowerCase() : `/${withoutTrailingSlash.toLowerCase()}`;
}
