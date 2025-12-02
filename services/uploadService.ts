import { supabase } from './supabaseClient';

const BUCKET_NAME = 'loot-box-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

/**
 * Upload an image to Supabase Storage
 * @param file - File object from input
 * @param folder - Folder name (e.g., 'boxes', 'items')
 * @returns Upload result with public URL
 */
export async function uploadImage(file: File, folder: 'boxes' | 'items'): Promise<UploadResult> {
    try {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return {
                success: false,
                error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`
            };
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return {
                success: false,
                error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
            };
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return {
            success: true,
            url: publicUrl
        };

    } catch (error) {
        console.error('Upload exception:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}

/**
 * Delete an image from Supabase Storage
 * @param url - Public URL of the image
 */
export async function deleteImage(url: string): Promise<boolean> {
    try {
        // Extract file path from URL
        const urlParts = url.split('/');
        const bucketIndex = urlParts.findIndex(part => part === BUCKET_NAME);
        if (bucketIndex === -1) return false;

        const filePath = urlParts.slice(bucketIndex + 1).join('/');

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) {
            console.error('Delete error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Delete exception:', error);
        return false;
    }
}
