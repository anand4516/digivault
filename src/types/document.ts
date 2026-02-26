export interface DocumentAnalysis {
  title: string;
  summary: string;
  tags: string[];
  extractedText: string;
  dominantColors: string[];
  duration: string;
  pageCount: number;
  transcription: string;
  keyMoments: string[];
  category: string;
}

export interface DocumentFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: "image" | "pdf" | "audio" | "video";
  fileSize: number;
  mimeType: string;
  thumbnailUrl: string;
  aiAnalysis: DocumentAnalysis;
  createdAt: string;
  updatedAt: string;
}

export const FILE_TYPE_ICONS: Record<DocumentFile["fileType"], string> = {
  image: "🖼️",
  pdf: "📄",
  audio: "🎵",
  video: "🎬",
};

export function getFileType(mimeType: string): DocumentFile["fileType"] {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "pdf"; // fallback
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
