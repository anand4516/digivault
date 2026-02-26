const CLOUD_NAME = "dcmdirh32";
const UPLOAD_PRESET = "businessinfo";

function getUploadUrl(resourceType: "image" | "video" | "raw" = "image") {
  return `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
}

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(getUploadUrl("image"), { method: "POST", body: formData });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url;
};

export const uploadFileToCloudinary = async (file: File): Promise<string> => {
  let resourceType: "image" | "video" | "raw" = "raw";
  if (file.type.startsWith("image/")) resourceType = "image";
  else if (file.type.startsWith("video/") || file.type.startsWith("audio/")) resourceType = "video";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(getUploadUrl(resourceType), { method: "POST", body: formData });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url;
};
