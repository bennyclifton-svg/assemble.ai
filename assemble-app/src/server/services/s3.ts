import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@/lib/logger';

// Validate required environment variables at module initialization
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Fail fast if credentials are missing
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  const error = new Error(
    'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.'
  );
  logger.fatal({ error }, 'S3 service initialization failed: missing AWS credentials');
  throw error;
}

if (!S3_BUCKET_NAME) {
  const error = new Error(
    'S3 bucket not configured. Please set S3_BUCKET_NAME environment variable.'
  );
  logger.fatal({ error }, 'S3 service initialization failed: missing bucket name');
  throw error;
}

logger.info(
  {
    region: AWS_REGION || 'us-east-1',
    bucket: S3_BUCKET_NAME,
  },
  'S3 service initialized successfully'
);

// Initialize S3 client
const s3Client = new S3Client({
  region: AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a signed URL for uploading a file to S3
 * @param key - The S3 object key (file path)
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed upload URL
 * @throws Error if URL generation fails
 */
export async function getUploadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    logger.debug({ key, expiresIn }, 'Generating signed upload URL');

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    logger.info({ key, expiresIn }, 'Signed upload URL generated successfully');
    return url;
  } catch (error) {
    logger.error(
      {
        error,
        key,
        expiresIn,
        bucket: S3_BUCKET_NAME,
      },
      'Failed to generate signed upload URL'
    );
    throw new Error(`Failed to generate upload URL for ${key}`);
  }
}

/**
 * Generate a signed URL for downloading a file from S3
 * @param key - The S3 object key (file path)
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed download URL
 * @throws Error if URL generation fails
 */
export async function getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    logger.debug({ key, expiresIn }, 'Generating signed download URL');

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    logger.info({ key, expiresIn }, 'Signed download URL generated successfully');
    return url;
  } catch (error) {
    logger.error(
      {
        error,
        key,
        expiresIn,
        bucket: S3_BUCKET_NAME,
      },
      'Failed to generate signed download URL'
    );
    throw new Error(`Failed to generate download URL for ${key}`);
  }
}

/**
 * Upload a file to S3
 * @param key - The S3 object key (file path)
 * @param body - File content
 * @param contentType - MIME type of the file
 * @throws Error if upload fails
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string
): Promise<void> {
  try {
    const fileSize = body instanceof Buffer ? body.length : body.toString().length;

    logger.debug(
      {
        key,
        contentType,
        size: fileSize,
        bucket: S3_BUCKET_NAME,
      },
      'Starting S3 upload'
    );

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);

    logger.info(
      {
        key,
        contentType,
        size: fileSize,
        bucket: S3_BUCKET_NAME,
      },
      'File uploaded to S3 successfully'
    );
  } catch (error) {
    logger.error(
      {
        error,
        key,
        contentType,
        bucket: S3_BUCKET_NAME,
      },
      'S3 upload failed'
    );
    throw new Error(`Failed to upload file to S3: ${key}`);
  }
}

export { s3Client };
