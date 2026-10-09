import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/constants';
import { supabase } from '../supabase/client';

/**
 * Upload an image (File, Blob, or base64 data URL) directly to Cloudinary using unsigned upload preset.
 * @param {File|Blob|string} file - The file or base64 string to upload
 * @param {string} [memberId] - Optional identifier to use as public_id in Cloudinary
 * @returns {Promise<string|null>} - Returns the secure HTTPS Cloudinary URL or null on failure
 */
export const uploadToCloudinary = async (file, memberId = null) => {
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'members');

    if (memberId) {
      // Clean memberId to be safe for Cloudinary public_id
      const safeId = String(memberId).replace(/[^a-zA-Z0-9_-]/g, '_');
      // If the ID doesn't already end with a unique timestamp, append one.
      // This prevents Cloudinary unsigned presets from returning existing: true (which ignores new uploads)
      const hasTimestamp = /_\d{10,}$/.test(safeId);
      const uniquePublicId = hasTimestamp ? safeId : `${safeId}_${Date.now()}`;
      formData.append('public_id', uniquePublicId);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Cloudinary upload error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    return null;
  }
};

/**
 * Automatically deletes an old photo from Supabase Storage if the URL points to Supabase.
 * @param {string} oldUrl - The previous photo_url
 */
export const deleteOldStoragePhoto = async (oldUrl) => {
  if (!oldUrl || typeof oldUrl !== 'string') return;
  try {
    // Only attempt deletion for Supabase Storage member photos
    if (oldUrl.includes('supabase.co') && oldUrl.includes('/member-photos/')) {
      const match = oldUrl.match(/\/member-photos\/([^?#]+)/);
      if (match && match[1]) {
        const filePath = decodeURIComponent(match[1]);
        const { error } = await supabase.storage.from('member-photos').remove([filePath]);
        if (error) {
          console.warn('Failed to delete old Supabase storage photo:', error);
        } else {
          console.log('Old Supabase storage photo deleted successfully:', filePath);
        }
      }
    }
  } catch (err) {
    console.warn('Failed to delete old storage photo:', err);
  }
};
