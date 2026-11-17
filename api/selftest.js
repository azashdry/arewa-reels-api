import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "./_b2.js";

export default async function handler(req, res) {
  const kid = process.env.B2_KEY_ID || "";
  const out = {
    bucket: BUCKET || "NOT SET",
    keyIdStart: kid.slice(0, 6),
    keyIdLength: kid.length,
    appKeyLength: (process.env.B2_APP_KEY || "").length
  };
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
