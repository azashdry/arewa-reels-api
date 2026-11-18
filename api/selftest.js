// redeploy
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "./_b2.js";

export default async function handler(req, res) {
  const id = process.env.B2_KEY_ID || "";
  const key = process.env.B2_APP_KEY || "";
  const out = {
    bucket: BUCKET || "NOT SET",
    keyIdLength: id.length,
    appKeyLength: key.length,
    appKeyStart: key.slice(0, 4)
  };
  try {
    const r = await fetch("https://api.backblazeb2.com/b2api/v3/b2_authorize_account", {
      headers: { Authorization: "Basic " + Buffer.from(id + ":" + key).toString("base64") }
    });
    out.authStatus = r.status;
    const j = await r.json();
    if (r.ok) {
      const sa = (j.apiInfo && j.apiInfo.storageApi) || {};
      out.s3ApiUrl = sa.s3ApiUrl;
      out.keyBucket = sa.bucketName;
    } else {
      out.authError = String(j.code) + " " + String(j.message).slice(0, 100);
    }
  } catch (e) {
    out.authError = String(e.message || e).slice(0, 120);
  }
  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: "selftest/ping.txt", Body: "ok", ContentType: "text/plain"
    }));
    out.put = "OK";
  } catch (e) {
    out.put = "FAIL: " + (e.name || "") + " " + String(e.message || "").slice(0, 150);
  }
  res.status(200).json(out);
}
