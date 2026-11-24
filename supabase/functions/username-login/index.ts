import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://jshs-us.github.io",
  "http://localhost",
  "capacitor://localhost",
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin || allowedOrigins.has(origin)) return true;
  return /^http:\/\/localhost:\d+$/.test(origin);
}

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  origin: string | null,
): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  });
  if (origin && isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (request: Request): Promise<Response> => {
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin(origin)) {
      return jsonResponse(403, { message: "허용되지 않은 요청입니다." }, null);
    }
    return jsonResponse(200, {}, origin);
  }
  if (!isAllowedOrigin(origin)) {
    return jsonResponse(403, { message: "허용되지 않은 요청입니다." }, null);
  }
  if (request.method !== "POST") {
    return jsonResponse(405, { message: "지원하지 않는 요청입니다." }, origin);
  }
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    return jsonResponse(415, { message: "요청 형식을 확인해주세요." }, origin);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { message: "요청 내용을 확인해주세요." }, origin);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return jsonResponse(400, { message: "요청 내용을 확인해주세요." }, origin);
  }
  const body = payload as { username?: unknown; password?: unknown };
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || username.length > 30 || !password || password.length > 128) {
    return jsonResponse(401, { message: "아이디 또는 비밀번호를 확인해주세요." }, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !publishableKey) {
    console.error("[username-login] Required Supabase secrets are not configured.");
    return jsonResponse(500, { message: "로그인 서비스를 준비하지 못했어요." }, origin);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const authClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let email: string | null;
  try {
    const result = await adminClient.rpc(
      "lookup_auth_email_by_username",
      { login_username: username },
    );
    if (result.error) {
      console.error("[username-login] Username lookup failed:", result.error.message);
      return jsonResponse(500, { message: "로그인 서비스를 준비하지 못했어요." }, origin);
    }
    email = typeof result.data === "string" ? result.data : null;
  } catch (error) {
    console.error(
      "[username-login] Username lookup request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return jsonResponse(500, { message: "로그인 서비스를 준비하지 못했어요." }, origin);
  }

  const loginEmail = typeof email === "string"
    ? email
    : "gwakuri-invalid-login@invalid.example";
  let session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
    token_type: string;
  } | null = null;
  try {
    const result = await authClient.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    if (!email || result.error || !result.data.session) {
      return jsonResponse(401, { message: "아이디 또는 비밀번호를 확인해주세요." }, origin);
    }
    session = result.data.session;
  } catch (error) {
    console.error(
      "[username-login] Authentication request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return jsonResponse(500, { message: "로그인 서비스를 준비하지 못했어요." }, origin);
  }
  if (!session) {
    return jsonResponse(401, { message: "아이디 또는 비밀번호를 확인해주세요." }, origin);
  }

  return jsonResponse(200, {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type,
  }, origin);
});
