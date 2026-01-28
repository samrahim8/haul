import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const BUCKET_NAME = "estate-sale-images";

/**
 * Upload a single file to Supabase Storage
 * Returns the public URL of the uploaded file
 */
export async function uploadFile(
  supabase: SupabaseClient<Database>,
  file: File,
  folder: string
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Upload multiple photos for a sale
 * Returns array of public URLs
 */
export async function uploadSalePhotos(
  supabase: SupabaseClient<Database>,
  files: File[],
  saleId: string
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split(".").pop();
    const fileName = `sales/${saleId}/photos/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      errors.push(`${file.name}: ${error.message}`);
    } else {
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
      urls.push(urlData.publicUrl);
    }
  }

  return { urls, errors };
}

/**
 * Upload a video for a sale
 * Returns the public URL
 */
export async function uploadSaleVideo(
  supabase: SupabaseClient<Database>,
  file: File,
  saleId: string
): Promise<string | null> {
  return uploadFile(supabase, file, `sales/${saleId}/video`);
}

/**
 * Upload a company logo
 * Returns the public URL
 */
export async function uploadCompanyLogo(
  supabase: SupabaseClient<Database>,
  file: File,
  companyId: string
): Promise<string | null> {
  return uploadFile(supabase, file, `companies/${companyId}/logo`);
}
