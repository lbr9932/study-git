import { NextRequest, NextResponse } from "next/server";

const AUTH_USER = process.env.BASIC_AUTH_USER;
const AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;

export function middleware(request: NextRequest) {
  if (!AUTH_USER || !AUTH_PASSWORD) return NextResponse.next();

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const encoded = authHeader.slice(6);
    const decoded = atob(encoded);
    const [user, ...rest] = decoded.split(":");
    const password = rest.join(":");

    if (timingSafeEqual(user, AUTH_USER) && timingSafeEqual(password, AUTH_PASSWORD)) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="SEO QA", charset="UTF-8"'
    }
  });
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"]
};
