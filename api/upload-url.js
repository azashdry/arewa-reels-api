import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { s3, BUCKET, cors } from "./_b2.js";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "arewa-market-4e603";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

const MB = 1024 * 1024;
const MAX_BYTES = { image: 10 * MB, document: 20 * MB, video: 50 * MB, audio: 15 * MB };

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Ba a shiga ba." });

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID
    });
    const uid = payload.sub;
    if (!uid) return res.status(401).json({ error: "Shiga bai inganta ba." });

    const { contentType, size, category, ext } = req.body || {};
    if (!MAX_BYTES[category]) return res.status(400).json({ error: "Irin fayil bai inganta ba." });
    if (!contentType || typeof contentType !== "string") return res.status(400).json({ error: "Babu contentType." });
    if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES[category]) {
      return res.status(400).json({ error: "Girman fayil ya wuce iyaka." });
    }

    const safeExt = String(ext || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
    const rand = Math.random().toString(36).slice(2, 10);
    const key = `${category}/${uid}/${Date.now()}-${rand}.${safeExt}`;

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
      { expiresIn: 600 }
    );

    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const url = `https://${host}/api/media?k=${encodeURIComponent(key)}`;

    return res.status(200).json({ uploadUrl, url, key });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: "Tabbatarwa ta gaza. Ka sake shiga." });
  }
}
