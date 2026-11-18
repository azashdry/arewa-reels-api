export default async function handler(req, res) {
  const id = process.env.B2_KEY_ID || "";
  const key = process.env.B2_APP_KEY || "";
  const out = {};
  try {
    const a = await fetch("https://api.backblazeb2.com/b2api/v3/b2_authorize_account", {
      headers: { Authorization: "Basic " + Buffer.from(id + ":" + key).toString("base64") }
    });
    const aj = await a.json();
    if (!a.ok) { out.error = "auth " + a.status; return res.status(200).json(out); }
    const api = aj.apiInfo.storageApi.apiUrl;
    const r = await fetch(api + "/b2api/v3/b2_update_bucket", {
      method: "POST",
      headers: { Authorization: aj.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: aj.accountId,
        bucketId: "2f092f0a62b1c459af1f0a1e",
        corsRules: [{
          corsRuleName: "reelsBrowser",
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          allowedOperations: ["s3_put", "s3_get", "s3_head", "b2_download_file_by_name", "b2_download_file_by_id"],
          maxAgeSeconds: 3600
        }]
      })
    });
    const rj = await r.json();
    out.status = r.status;
    if (r.ok) { out.rules = (rj.corsRules || []).length; out.ops = rj.corsRules && rj.corsRules[0] && rj.corsRules[0].allowedOperations; }
    else { out.error = String(rj.code) + " " + String(rj.message).slice(0, 120); }
  } catch (e) {
    out.error = String(e.message || e).slice(0, 150);
  }
  res.status(200).json(out);
}
