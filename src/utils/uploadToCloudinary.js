import axios from 'axios';

const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
};

function inferExtension(fileName, uri) {
  const source = String(fileName || uri || '').split('?')[0];
  const match = source.match(/\.([a-zA-Z0-9]+)$/);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  return MIME_BY_EXTENSION[ext] ? ext : 'jpg';
}

/**
 * Uploads a selected Expo ImagePicker asset directly to Cloudinary using unsigned preset.
 * Returns the hosted HTTPS secure_url and never sends local file URIs to app storage.
 */
export async function uploadToCloudinary(asset) {
  const cloudName = (process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '').trim();
  const uploadPreset = (process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '').trim();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary configuration missing (EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME or EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET).'
    );
  }

  const uri = typeof asset === 'string' ? asset.trim() : String(asset?.uri || '').trim();
  if (!uri) {
    throw new Error('No image URI provided for upload.');
  }

  if (/^https?:\/\/res\.cloudinary\.com\//i.test(uri)) {
    return uri;
  }

  const extension = inferExtension(asset?.fileName, uri);
  const fileName = asset?.fileName || `a6news_${Date.now()}.${extension}`;
  const mimeType = asset?.mimeType || MIME_BY_EXTENSION[extension] || 'image/jpeg';

  const formData = new FormData();
  formData.append(
    'file',
    asset?.file || {
      uri,
      name: fileName,
      type: mimeType,
    }
  );
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    const secureUrl = response?.data?.secure_url;
    if (!secureUrl || typeof secureUrl !== 'string' || !/^https?:\/\//i.test(secureUrl)) {
      throw new Error('Cloudinary did not return a valid secure_url.');
    }

    return secureUrl;
  } catch (err) {
    const cloudinaryMsg = err?.response?.data?.error?.message;
    if (cloudinaryMsg) {
      throw new Error(cloudinaryMsg);
    }
    if (err instanceof Error && err.message) {
      throw err;
    }
    throw new Error('Failed to upload image to Cloudinary.');
  }
}

export default uploadToCloudinary;
