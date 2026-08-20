import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/constants';

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
      const safeId = memberId.replace(/[^a-zA-Z0-9_-]/g, '_');
      formData.append('public_id', safeId);
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
