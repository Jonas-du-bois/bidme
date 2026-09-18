// ── Cloudinary Configuration ─────────────────────────────────
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a single file to Cloudinary via unsigned upload.
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} The secure URL of the uploaded image
 */
export async function uploadImage(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Upload failed");
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Upload multiple files to Cloudinary in parallel.
 * @param {File[]} files - Array of image files
 * @returns {Promise<string[]>} Array of secure URLs
 */
export async function uploadImages(files) {
  const uploads = Array.from(files).map((file) => uploadImage(file));
  return Promise.all(uploads);
}
