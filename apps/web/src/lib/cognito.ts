import "server-only";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { headers } from "next/headers";

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  const pool = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!pool || !clientId) return null;
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: pool,
      tokenUse: "access",
      clientId,
    });
  }
  return verifier;
}

/**
 * Resuelve tenant desde JWT Cognito (claim custom:tenant_id).
 * Usar con API Gateway authorizer en prod; en Next, enviar Authorization: Bearer (access token).
 */
export async function getCognitoTenantId(): Promise<string | null> {
  if (process.env.AUTH_DISABLED === "true") return null;
  const v = getVerifier();
  if (!v) return null;
  const h = await headers();
  const auth = h.get("authorization") ?? h.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = await v.verify(auth.slice(7));
    const tid = payload["custom:tenant_id"];
    if (typeof tid === "string" && tid.length > 0) return tid;
    return null;
  } catch {
    return null;
  }
}
