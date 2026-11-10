// 사진 분석 서버 함수 (Vercel). ANTHROPIC_API_KEY 환경변수가 없으면 501을 돌려주고, 화면은 예시 결과로 동작합니다.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ihcomdxdbfgagmwooait.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_CeF1hU5lqic9so65PNeN3Q_oi5evrli";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(501).json({ error: "no_key" });

  // 로그인한 사용자만 사용
  const auth = req.headers.authorization || "";
  const u = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: { Authorization: auth, apikey: SUPABASE_ANON_KEY } });
  if (!u.ok) return res.status(401).json({ error: "unauthorized" });

  const { prompt, images } = req.body || {};
  if (typeof prompt !== "string" || !Array.isArray(images) || !images.length || images.length > 4)
    return res.status(400).json({ error: "bad_request" });

  const content = [
    ...images.map((data) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } })),
    { type: "text", text: prompt },
  ];
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5", max_tokens: 2000, messages: [{ role: "user", content }] }),
  });
  if (r.status === 429) return res.status(429).json({ error: "rate_limited" });
  if (!r.ok) return res.status(502).json({ error: "upstream", detail: (await r.text()).slice(0, 300) });
  const out = await r.json();
  const text = (out.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return res.status(502).json({ error: "bad_output" });
  try { return res.status(200).json(JSON.parse(m[0])); }
  catch { return res.status(502).json({ error: "bad_output" }); }
}
