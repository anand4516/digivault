import { GoogleGenAI } from "@google/genai";
import { getGeminiKey } from "@/lib/gemini";
import { DocumentAnalysis } from "@/types/document";

const GEMINI_MODEL = "gemini-2.5-flash";

const IMAGE_PROMPT = `Analyze this image thoroughly. Return ONLY a valid JSON object (no markdown):
{
  "title": "Short descriptive title",
  "summary": "2-3 sentence description of the image content",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "extractedText": "Any text visible in the image (OCR). Empty string if none.",
  "dominantColors": ["#hex1", "#hex2", "#hex3"],
  "category": "photo/screenshot/document/art/diagram/meme/other"
}`;

const PDF_PROMPT = `Analyze this document page image. Return ONLY a valid JSON object (no markdown):
{
  "title": "Document title or best guess from content",
  "summary": "2-3 sentence summary of the document content",
  "tags": ["topic1", "topic2", "topic3"],
  "extractedText": "Key text extracted from the document (first ~500 chars)",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "category": "report/invoice/letter/resume/contract/academic/presentation/other"
}`;

const AUDIO_PROMPT = `Analyze this audio file. Return ONLY a valid JSON object (no markdown):
{
  "title": "Best guess title or description",
  "summary": "Summary of the audio content",
  "tags": ["tag1", "tag2"],
  "transcription": "Transcription of the first ~500 chars of speech",
  "language": "Detected language",
  "category": "music/speech/podcast/recording/meeting/other"
}`;

const VIDEO_PROMPT = `Analyze this video. Return ONLY a valid JSON object (no markdown):
{
  "title": "Descriptive title",
  "summary": "2-3 sentence description of the video content",
  "tags": ["tag1", "tag2", "tag3"],
  "keyMoments": ["Description of key moment 1", "Description of key moment 2"],
  "category": "tutorial/vlog/demo/recording/clip/other"
}`;

async function fetchFileAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getMimeCategory(mime: string): "image" | "pdf" | "audio" | "video" {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "image";
}

export async function analyzeDocument(
  fileUrl: string,
  mimeType: string,
  fileSize: number,
  fileName: string,
): Promise<DocumentAnalysis> {
  const key = getGeminiKey();
  const category = getMimeCategory(mimeType);

  // Skip AI for files over 20MB
  if (fileSize > 20 * 1024 * 1024 || !key) {
    return {
      title: fileName.replace(/\.[^/.]+$/, ""),
      summary: `${category.charAt(0).toUpperCase() + category.slice(1)} file - ${(fileSize / (1024 * 1024)).toFixed(1)}MB`,
      tags: [category],
      extractedText: "",
      dominantColors: [],
      duration: "",
      pageCount: 0,
      transcription: "",
      keyMoments: [],
      category,
    };
  }

  const ai = new GoogleGenAI({ apiKey: key });

  try {
    let prompt: string;
    let parts: any[];

    if (category === "image") {
      prompt = IMAGE_PROMPT;
      const base64 = await fetchFileAsBase64(fileUrl);
      parts = [
        { text: prompt },
        { inlineData: { mimeType, data: base64 } },
      ];
    } else if (category === "pdf") {
      // For PDFs, we try to send as image of first page or fall back to metadata
      prompt = PDF_PROMPT;
      try {
        const base64 = await fetchFileAsBase64(fileUrl);
        parts = [
          { text: prompt },
          { inlineData: { mimeType: "application/pdf", data: base64 } },
        ];
      } catch {
        return fallbackAnalysis(fileName, fileSize, category);
      }
    } else if (category === "audio") {
      prompt = AUDIO_PROMPT;
      try {
        const base64 = await fetchFileAsBase64(fileUrl);
        parts = [
          { text: prompt },
          { inlineData: { mimeType, data: base64 } },
        ];
      } catch {
        return fallbackAnalysis(fileName, fileSize, category);
      }
    } else {
      // video - extract thumbnail approach or send directly
      prompt = VIDEO_PROMPT;
      try {
        const base64 = await fetchFileAsBase64(fileUrl);
        parts = [
          { text: prompt },
          { inlineData: { mimeType, data: base64 } },
        ];
      } catch {
        return fallbackAnalysis(fileName, fileSize, category);
      }
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
    });

    const text = response.text || "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      title: parsed.title || fileName,
      summary: parsed.summary || parsed.description || "",
      tags: parsed.tags || [],
      extractedText: parsed.extractedText || "",
      dominantColors: parsed.dominantColors || [],
      duration: parsed.duration || "",
      pageCount: parsed.pageCount || 0,
      transcription: parsed.transcription || "",
      keyMoments: parsed.keyMoments || parsed.keyTopics || [],
      category: parsed.category || category,
    };
  } catch (error: any) {
    console.error("Document AI analysis failed:", error);
    return fallbackAnalysis(fileName, fileSize, category);
  }
}

function fallbackAnalysis(fileName: string, fileSize: number, category: string): DocumentAnalysis {
  return {
    title: fileName.replace(/\.[^/.]+$/, ""),
    summary: `${category.charAt(0).toUpperCase() + category.slice(1)} file`,
    tags: [category],
    extractedText: "",
    dominantColors: [],
    duration: "",
    pageCount: 0,
    transcription: "",
    keyMoments: [],
    category,
  };
}
