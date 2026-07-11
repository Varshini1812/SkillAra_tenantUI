/** Build a data URL from a tenant logo object stored in MongoDB. */
export function getTenantLogoUrl(logo) {
  if (!logo || logo.status === false) return null;
  const blob = logo.image_blob;
  if (!blob || blob === "no-data") return null;
  if (String(blob).startsWith("data:")) return blob;
  const mime = logo.mime_type || "image/png";
  return `data:${mime};base64,${blob}`;
}

export function buildLogoPayload(file) {
  if (!file?.dataUrl) return null;
  return {
    status: true,
    mime_type: file.mimeType || "image/png",
    image_name: file.name || "logo",
    image_blob: file.dataUrl.split(",")[1] || file.dataUrl,
  };
}

export function clearLogoPayload() {
  return {
    status: false,
    mime_type: "",
    image_name: "no-data",
    image_blob: "",
  };
}
