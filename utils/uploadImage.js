const cloudinary = require('../config/cloudinary');

/**
 * Normalises whatever the client sent into a hosted image URL.
 *
 *   data:image/... base64  ->  uploaded to Cloudinary, returns secure_url
 *   http(s)://...          ->  already hosted, returned unchanged
 *   anything else / empty   ->  '' (never store raw bytes in Mongo)
 *
 * @param {string} image  base64 data URI or existing URL
 * @param {string} folder Cloudinary folder to upload into
 * @returns {Promise<string>}
 */
const uploadImage = async (image, folder = 'misc') => {
  if (!image || typeof image !== 'string') return '';

  // Already hosted somewhere — don't re-upload on every edit.
  if (/^https?:\/\//i.test(image)) return image;

  if (!image.startsWith('data:image')) return '';

  const result = await cloudinary.uploader.upload(image, { folder });
  return result.secure_url;
};

/** Same, for an array of images. Skips anything that can't be resolved. */
const uploadImages = async (images, folder = 'misc') => {
  if (!Array.isArray(images)) return [];
  const uploaded = await Promise.all(
    images.map(img => uploadImage(img, folder))
  );
  return uploaded.filter(Boolean);
};

module.exports = { uploadImage, uploadImages };
