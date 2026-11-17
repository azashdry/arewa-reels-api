import { S3Client } from "@aws-sdk/client-s3";

export const BUCKET = process.env.B2_BUCKET;

export const s3 = new S3Client({
  region: process.env.B2_REGION || "us-west-004",
  endpoint: process.env.B2_ENDPOINT || "https://s3.us-west-004.backblazeb2.com",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APP_KEY
  },
  forcePathStyle: true
});

export function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
