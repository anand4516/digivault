

## Documents Section - AI-Powered File Storage with Preview & Dynamic Cards

### Overview
A new "Documents" section where users upload images, PDFs, audio, and video files. Each file is stored in Cloudinary, analyzed by Gemini AI to generate metadata, and displayed as a dynamic UI card with inline preview/playback. Users can view documents directly in the app.

### Architecture

```text
User uploads file → Cloudinary (store) → Get URL
                                           │
                                    Gemini AI (analyze)
                                    ├─ Image → description, OCR text, tags, colors
                                    ├─ PDF   → title, summary, topics
                                    ├─ Audio → transcription, duration, summary
                                    └─ Video → description, duration, key moments
                                           │
                                    Firestore (save metadata + AI result)
                                           │
                                    Dynamic Card with inline preview
                                    ├─ Image → <img> thumbnail, click to fullscreen
                                    ├─ PDF   → <iframe> or link to open
                                    ├─ Audio → <audio> player
                                    └─ Video → <video> player
```

### Files to Create

1. **`src/types/document.ts`**
   - `DocumentFile` interface: `id`, `fileName`, `fileUrl`, `fileType` (image/pdf/audio/video), `fileSize`, `mimeType`, `thumbnailUrl`, `aiAnalysis` object (title, summary, tags, extractedText, dominantColors, duration, pageCount, transcription, keyMoments, category), `createdAt`, `updatedAt`

2. **`src/hooks/useDocuments.ts`**
   - Same pattern as `useWalletCards.ts`: Firestore collection `users/{uid}/documents` with `onSnapshot`, `addDocument`, `updateDocument`, `removeDocument`

3. **`src/lib/documentAI.ts`**
   - `analyzeDocument(fileUrl, mimeType)` function that sends file to Gemini with type-specific prompts
   - For images: sends as inlineData, asks for description, OCR, tags, colors
   - For PDFs: converts first page to image via canvas, sends for title/summary/topics (or falls back to filename-based metadata)
   - For audio/video: if under 20MB, sends to Gemini for transcription/summary; otherwise returns basic metadata only
   - Returns a typed `DocumentAnalysis` object

4. **`src/lib/cloudinary.ts`** (extend)
   - Add `uploadFileToCloudinary(file, resourceType)` supporting `image`, `video` (for video/audio), and `raw` (for PDFs) upload endpoints

5. **`src/components/DocumentCard.tsx`**
   - Dynamic card rendering based on `fileType`:
     - **Image**: thumbnail with click-to-fullscreen lightbox, AI description, color dots, OCR text badge
     - **PDF**: document icon with page count, title, summary, "Open PDF" link (opens in new tab or iframe modal)
     - **Audio**: waveform icon + inline `<audio>` player with controls, duration badge, transcription snippet
     - **Video**: inline `<video>` player with controls, duration badge, description
   - All cards show: file name, size, date, tags as pills, delete button, expand button

6. **`src/components/DocumentPreviewModal.tsx`**
   - Full-screen dialog for viewing documents:
     - Image: full-resolution display
     - PDF: `<iframe src={url}>` embedded viewer
     - Audio: large audio player with full transcription text
     - Video: full-width video player
   - Shows complete AI analysis below the preview

7. **`src/pages/DocumentsPage.tsx`**
   - Header with FileText icon + "Add Document" button
   - Upload flow (same multi-step pattern as WalletPage): file picker (accepts `image/*,.pdf,audio/*,video/*`) → extracting progress → review AI analysis → save
   - Filter tabs: All / Images / PDFs / Audio / Video
   - Masonry-style grid of `DocumentCard` components
   - Empty state with upload CTA
   - 50MB client-side file size limit

### Files to Modify

1. **`src/App.tsx`** - Add route `/documents` pointing to `DocumentsPage`
2. **`src/components/AppSidebar.tsx`** - Add nav item `{ to: "/documents", icon: FileText, label: "Documents" }` after Passwords

### Key Technical Details

- Cloudinary upload preset needs to accept raw + video resource types (existing `businessinfo` preset should work with the correct endpoint)
- Gemini 2.5 Flash natively supports image and audio input; for video, we extract a thumbnail frame via canvas
- PDF preview uses Cloudinary's URL directly in an iframe; browsers can render PDFs natively
- Audio/video use native HTML5 `<audio>`/`<video>` elements with the Cloudinary URL as source
- Files over 20MB skip AI analysis and store basic metadata (name, size, type) only
- All cards use existing `glass-panel rounded-2xl` styling with `animate-fade-slide-up`

