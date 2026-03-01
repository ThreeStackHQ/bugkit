import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// Lazy singleton
let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

const BUCKET = () => process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = () =>
  (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

/**
 * Upload a buffer to R2 and return the public URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${PUBLIC_URL()}/${key}`;
}

/**
 * Download a file from R2 by key or full URL and return a Buffer.
 */
export async function downloadFromR2(keyOrUrl: string): Promise<Buffer> {
  const client = getClient();
  // Accept full public URL or bare key
  const key = keyOrUrl.startsWith("http")
    ? keyOrUrl.replace(`${PUBLIC_URL()}/`, "")
    : keyOrUrl;

  const response = await client.send(
    new GetObjectCommand({ Bucket: BUCKET(), Key: key })
  );

  const stream = response.Body;
  if (!stream) throw new Error("Empty body from R2");

  // ReadableStream → Buffer
  const chunks: Uint8Array[] = [];
  // @ts-expect-error — AWS SDK returns a web ReadableStream in Node 18+
  for await (const chunk of stream) {
    chunks.push(chunk as Uint8Array);
  }
  return Buffer.concat(chunks);
}
