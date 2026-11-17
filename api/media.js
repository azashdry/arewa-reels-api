import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET, cors } from "./_b2.js";

const KEY_RE = /^(image|document|video|audio)\/[A-Za-z0-9_-]+\/[0-9]+-[a-z0-9]+\.[a-z0-9]+$/;

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const key = req.query.k;
  if (typeof key !== "string" || !KEY_RE.test(key)) {
    return res.status(400).send("Bad key");
  }

  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
    res.setHeader("Cache-Control", "public, max-age=1800");
    return res.redirect(302, url);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Error");
  }
}
