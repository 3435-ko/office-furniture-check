// QR 로그인 서버 함수 (Vercel).
// 휴대폰이 승인한 QR 요청이면, 그 사람의 1회용 로그인 토큰을 PC에 돌려줍니다.
// 필요한 환경변수: SUPABASE_SECRET_KEY (Supabase > Project Settings > API Keys 의 secret 키)
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ihcomdxdbfgagmwooait.supabase.co";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return res.status(501).json({ error: "no_key" });
  const H = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) H.Authorization = "Bearer " + key;

  const { id, secret } = req.body || {};
  if (!/^[0-9a-f-]{36}$/i.test(id || "") || !/^[0-9a-f]{48}$/i.test(secret || ""))
    return res.status(400).json({ error: "bad_request" });

  const q = await fetch(`${SUPABASE_URL}/rest/v1/qr_logins?id=eq.${id}&secret=eq.${secret}&select=*`, { headers: H });
  if (!q.ok) return res.status(502).json({ error: "db" });
  const row = (await q.json())[0];
  if (!row) return res.status(404).json({ error: "not_found" });
  if (row.status !== "approved" || !row.email) return res.status(409).json({ error: row.status });
  if (Date.now() - new Date(row.approved_at).getTime() > 2 * 60 * 1000) return res.status(410).json({ error: "expired" });

  // 한 번만 쓰도록 먼저 'used' 로 바꿈 (동시에 두 번 오면 하나만 통과)
  const u = await fetch(`${SUPABASE_URL}/rest/v1/qr_logins?id=eq.${id}&status=eq.approved`, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ status: "used" }),
  });
  if (!u.ok || !(await u.json()).length) return res.status(409).json({ error: "used" });

  const g = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST", headers: H, body: JSON.stringify({ type: "magiclink", email: row.email }),
  });
  if (!g.ok) return res.status(502).json({ error: "auth" });
  const link = await g.json();
  const token_hash = link.hashed_token || link.properties?.hashed_token;
  if (!token_hash) return res.status(502).json({ error: "no_token" });
  return res.status(200).json({ token_hash });
}
