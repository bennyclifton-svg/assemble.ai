import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface UploadResult {
  key: string;
  bucket: string;
  url: string;
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  file: Buffer,
  key: string,
  mimeType: string
): Promise<UploadResult> {
  const bucket = process.env.S3_BUCKET_NAME!;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  return {
    key,
    bucket,
    url: `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`,
  };
}

/**
 * Generate a signed URL for secure file download
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a unique S3 key for a file
 */
export function generateS3Key(
  projectId: string,
  folderPath: string,
  fileName: string
): string {
  // Clean the filename
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();

  // Build the key
  const pathParts = [projectId];

  if (folderPath) {
    pathParts.push(folderPath);
  }

  pathParts.push(`${timestamp}-${cleanFileName}`);

  return pathParts.join('/');
}