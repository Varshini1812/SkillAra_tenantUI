import api, { getData } from "./client.js";

/**
 * Upload tenant branding logo to Backblaze B2.
 * @param {File} file
 * @returns {Promise<{url: string, key: string}>}
 */
export async function uploadTenantLogoFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/api/storage/branding/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return getData(res);
}

/**
 * Upload user profile picture to Backblaze B2.
 * @param {File} file
 * @param {string} [userId]
 * @returns {Promise<{url: string, key: string}>}
 */
export async function uploadUserAvatarFile(file, userId) {
  const formData = new FormData();
  formData.append("file", file);

  const endpoint = userId ? `/api/storage/users/${userId}/avatar` : "/api/storage/users/avatar";
  const res = await api.post(endpoint, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return getData(res);
}
