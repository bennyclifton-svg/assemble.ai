import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface UploadResult {
  key: string;
  bucket: string;
  url: string;
}

const BUCKET_NAME = 'documents';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadToSupabase(
  file: Buffer,
  key: string,
  mimeType: string
): Promise<UploadResult> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(key, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(key);

  return {
    key,
    bucket: BUCKET_NAME,
    url: urlData.publicUrl,
  };
}

/**
 * Generate a signed URL for secure file download
 * Returns null if the file doesn't exist instead of throwing
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(key, expiresIn);

  if (error) {
    // Log warning for missing files instead of crashing
    console.warn(`Failed to generate signed URL for key "${key}": ${error.message}`);
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFromSupabase(key: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([key]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Generate a unique key for a file
 */
export function generateStorageKey(
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

// Export with same names for compatibility
export const uploadToS3 = uploadToSupabase;
export const deleteFromS3 = deleteFromSupabase;
export const generateS3Key = generateStorageKey;
