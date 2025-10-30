import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

/**
 * Generate a signed URL for uploading a file to S3
 * @param key - The S3 object key (file path)
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed upload URL
 */
export async function getUploadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Generate a signed URL for downloading a file from S3
 * @param key - The S3 object key (file path)
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed download URL
 */
export async function getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Upload a file to S3
 * @param key - The S3 object key (file path)
 * @param body - File content
 * @param contentType - MIME type of the file
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

export { s3Client };
