import { NextResponse, type NextRequest } from "next/server";

/**
 * Preparado para API Gateway + Cognito: en local usar AUTH_DISABLED=true.
 * Cuando COGNITO_* está definido y AUTH_DISABLED no es true, exige Bearer en /api/* (excepto pusher auth y payroll si se configura lista blanca).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.AUTH_DISABLED === "true") {
    return NextResponse.next();
  }

  const cognitoOn = !!(process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID);
  if (!cognitoOn) {
    return NextResponse.next();
  }

  const allowlist = ["/api/pusher/auth", "/api/payroll/calculate"];
  if (!pathname.startsWith("/api/") || allowlist.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Se requiere Authorization: Bearer (Cognito access token)" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
