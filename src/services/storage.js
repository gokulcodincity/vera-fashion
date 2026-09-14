import { requireSupabase } from '../lib/supabase';

const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 8 * 1024 * 1024;

export function validateImage(file) {
  if (!file || !TYPES.has(file.type)) throw new Error('Use a JPEG, PNG, or WebP image.');
  if (file.size > MAX_BYTES) throw new Error('Images must be 8 MB or smaller.');
}

export async function uploadImage(bucket, folder, file) {
  validateImage(file);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await requireSupabase().storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = requireSupabase().storage.from(bucket).getPublicUrl(path);
  return { storagePath: path, publicUrl: data.publicUrl };
}

export async function removeImage(bucket, storagePath) {
  if (!storagePath) return;
  const { error } = await requireSupabase().storage.from(bucket).remove([storagePath]);
  if (error) throw error;
}
