import React, { useState, useRef, useMemo } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import DocumentCard from "@/components/DocumentCard";
import DocumentPreviewModal from "@/components/DocumentPreviewModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import GeminiKeyModal from "@/components/GeminiKeyModal";
import { getGeminiKey } from "@/lib/gemini";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import { analyzeDocument } from "@/lib/documentAI";
import { DocumentFile, getFileType, formatFileSize } from "@/types/document";
import {
  FileText, PlusCircle, Upload, X, Loader2, Sparkles, Check, ArrowRight,
  Image, Music, Film, Search,
} from "lucide-react";
import { toast } from "sonner";

type Step = "upload" | "extracting" | "review";
type TypeFilter = "all" | "image" | "pdf" | "audio" | "video";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPT = "image/*,.pdf,audio/*,video/*";

const filterTabs: { value: TypeFilter; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: FileText },
  { value: "image", label: "Images", icon: Image },
  { value: "pdf", label: "PDFs", icon: FileText },
  { value: "audio", label: "Audio", icon: Music },
  { value: "video", label: "Video", icon: Film },
];

interface BulkItem {
  file: File;
  status: "pending" | "uploading" | "analyzing" | "done" | "error";
  progress: number;
  error?: string;
}

const DocumentsPage: React.FC = () => {
  const { documents, loading, addDocument, removeDocument } = useDocuments();
  const [step, setStep] = useState<Step | null>(null);
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  // Single file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [analysis, setAnalysis] = useState<DocumentFile["aiAnalysis"] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Bulk upload
  const [bulkFiles, setBulkFiles] = useState<BulkItem[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Preview & delete
  const [previewDoc, setPreviewDoc] = useState<DocumentFile | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`${file.name} too large. Max ${formatFileSize(MAX_FILE_SIZE)}`);
      return false;
    }
    const validTypes = ["image/", "audio/", "video/", "application/pdf"];
    if (!validTypes.some((t) => file.type.startsWith(t) || file.type === t)) {
      toast.error(`${file.name}: unsupported file type`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;
    setSelectedFile(file);
    setFilePreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
  };

  const handleMultiFileSelect = (files: FileList) => {
    if (files.length === 1 && !isBulkMode) {
      handleFileSelect(files[0]);
      return;
    }
    setIsBulkMode(true);
    const items: BulkItem[] = [];
    for (let i = 0; i < files.length; i++) {
      if (validateFile(files[i])) {
        items.push({ file: files[i], status: "pending", progress: 0 });
      }
    }
    setBulkFiles((prev) => [...prev, ...items]);
  };

  const removeBulkFile = (idx: number) => {
    setBulkFiles((prev) => prev.filter((_, i) => i !== idx));
    if (bulkFiles.length <= 1) setIsBulkMode(false);
  };

  const resetForm = () => {
    setStep(null); setAnalysis(null); setSaving(false); setProgress(0);
    setSelectedFile(null); setFilePreview(""); setFileUrl("");
    setBulkFiles([]); setIsBulkMode(false); setBulkProcessing(false);
  };

  const startExtraction = async () => {
    if (!getGeminiKey()) { setShowKeyModal(true); return; }

    if (isBulkMode && bulkFiles.length > 0) {
      await startBulkExtraction();
      return;
    }

    if (!selectedFile) { toast.error("Select a file first"); return; }
    setStep("extracting");
    try {
      setProgress(15); setProgressLabel("Uploading file...");
      const url = await uploadFileToCloudinary(selectedFile);
      setFileUrl(url); setProgress(50);
      setProgressLabel("AI analyzing your document..."); setProgress(65);
      const result = await analyzeDocument(url, selectedFile.type, selectedFile.size, selectedFile.name);
      setProgress(100); setAnalysis(result);
      setTimeout(() => setStep("review"), 400);
      toast.success("Document analyzed!");
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
      setStep("upload");
    }
  };

  const startBulkExtraction = async () => {
    setBulkProcessing(true);
    setStep("extracting");
    let successCount = 0;

    for (let i = 0; i < bulkFiles.length; i++) {
      const item = bulkFiles[i];
      setProgressLabel(`Processing ${i + 1}/${bulkFiles.length}: ${item.file.name}`);
      setProgress(Math.round(((i) / bulkFiles.length) * 100));

      setBulkFiles((prev) => prev.map((b, idx) => idx === i ? { ...b, status: "uploading", progress: 30 } : b));

      try {
        const url = await uploadFileToCloudinary(item.file);
        setBulkFiles((prev) => prev.map((b, idx) => idx === i ? { ...b, status: "analyzing", progress: 60 } : b));

        const result = await analyzeDocument(url, item.file.type, item.file.size, item.file.name);
        setBulkFiles((prev) => prev.map((b, idx) => idx === i ? { ...b, status: "done", progress: 100 } : b));

        await addDocument({
          fileName: item.file.name,
          fileUrl: url,
          fileType: getFileType(item.file.type),
          fileSize: item.file.size,
          mimeType: item.file.type,
          thumbnailUrl: "",
          aiAnalysis: result,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        successCount++;
      } catch (err: any) {
        setBulkFiles((prev) => prev.map((b, idx) => idx === i ? { ...b, status: "error", error: err.message } : b));
      }
    }

    setProgress(100);
    toast.success(`${successCount}/${bulkFiles.length} documents saved!`);
    setTimeout(resetForm, 1000);
  };

  const handleSave = async () => {
    if (!analysis || !selectedFile) return;
    setSaving(true);
    try {
      await addDocument({
        fileName: selectedFile.name, fileUrl,
        fileType: getFileType(selectedFile.type), fileSize: selectedFile.size,
        mimeType: selectedFile.type, thumbnailUrl: filePreview || "",
        aiAnalysis: analysis,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      toast.success("Document saved!"); resetForm();
    } catch (err: any) { toast.error(err.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await removeDocument(deleteId); setDeleteId(null);
    toast.success("Document deleted");
  };

  // Search + filter
  const filtered = useMemo(() => {
    let list = filter === "all" ? documents : documents.filter((d) => d.fileType === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((d) => {
        const a = d.aiAnalysis;
        return (
          d.fileName.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.extractedText.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [documents, filter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {showKeyModal && <GeminiKeyModal onDone={() => setShowKeyModal(false)} />}
      <DocumentPreviewModal doc={previewDoc} open={!!previewDoc} onClose={() => setPreviewDoc(null)} />
      <DeleteConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Document" description="This document will be permanently deleted." />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shrink-0">
            <FileText className="w-4.5 h-4.5 text-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-bold truncate">Documents</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Store & preview your files with AI insights</p>
          </div>
        </div>
        <button onClick={() => step ? resetForm() : setStep("upload")}
          className="gradient-hero text-foreground font-medium text-xs py-2 px-3.5 rounded-lg btn-press hover:opacity-90 flex items-center gap-1.5 shrink-0">
          {step ? <X className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{step ? "Cancel" : "Add Document"}</span>
          <span className="sm:hidden">{step ? "Cancel" : "Add"}</span>
        </button>
      </div>

      {/* Upload Step */}
      {step === "upload" && (
        <div className="glass-panel rounded-2xl p-6 space-y-5 animate-fade-slide-up">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Upload Documents</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload one or multiple files. AI will analyze each and create smart cards.
          </p>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleMultiFileSelect(e.dataTransfer.files); }}
            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${
              (selectedFile || bulkFiles.length > 0) ? "border-primary/30" : "border-border"
            }`}
          >
            <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden"
              onChange={(e) => { if (e.target.files) handleMultiFileSelect(e.target.files); }} />

            {isBulkMode && bulkFiles.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Upload className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">{bulkFiles.length} files selected</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {bulkFiles.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-secondary/50 rounded-xl px-3 py-2 text-left">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        {item.file.type.startsWith("image/") && <Image className="w-4 h-4 text-primary" />}
                        {item.file.type.startsWith("audio/") && <Music className="w-4 h-4 text-primary" />}
                        {item.file.type.startsWith("video/") && <Film className="w-4 h-4 text-accent" />}
                        {item.file.type === "application/pdf" && <FileText className="w-4 h-4 text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatFileSize(item.file.size)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeBulkFile(idx); }}
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Click or drop to add more files</p>
              </div>
            ) : selectedFile ? (
              <div className="space-y-3">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center mx-auto">
                    {selectedFile.type.startsWith("audio/") && <Music className="w-8 h-8 text-primary" />}
                    {selectedFile.type.startsWith("video/") && <Film className="w-8 h-8 text-accent" />}
                    {selectedFile.type === "application/pdf" && <FileText className="w-8 h-8 text-destructive" />}
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setFilePreview(""); }}
                  className="mx-auto w-7 h-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium text-sm mb-1">Drop or click to upload</p>
                <p className="text-xs text-muted-foreground">Images, PDFs, Audio, Video — Max 50MB each • Multiple files supported</p>
              </>
            )}
          </div>

          <button onClick={startExtraction} disabled={!selectedFile && bulkFiles.length === 0}
            className="w-full gradient-hero text-foreground font-semibold py-3 rounded-xl btn-press hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            {isBulkMode ? `Analyze ${bulkFiles.length} Files` : "Analyze with AI"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Extracting Step */}
      {step === "extracting" && (
        <div className="glass-panel rounded-2xl p-8 space-y-6 animate-fade-slide-up">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-foreground animate-spin" />
          </div>
          <div className="text-center">
            <h3 className="font-display text-lg font-semibold mb-1">
              {isBulkMode ? "Processing files..." : "Analyzing your document..."}
            </h3>
            <p className="text-sm text-muted-foreground">{progressLabel}</p>
          </div>

          {isBulkMode && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {bulkFiles.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-secondary/30 rounded-xl px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.file.name}</p>
                  </div>
                  <div className="shrink-0">
                    {item.status === "pending" && <span className="text-[10px] text-muted-foreground">Waiting</span>}
                    {item.status === "uploading" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                    {item.status === "analyzing" && <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />}
                    {item.status === "done" && <Check className="w-3.5 h-3.5 text-accent" />}
                    {item.status === "error" && <X className="w-3.5 h-3.5 text-destructive" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div className="h-full gradient-hero rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm font-mono-data text-muted-foreground text-center">{progress}%</p>
        </div>
      )}

      {/* Review Step (single file only) */}
      {step === "review" && analysis && (
        <div className="space-y-5 animate-fade-slide-up">
          <h3 className="font-display font-semibold text-lg">Review AI Analysis</h3>
          {selectedFile && (
            <div className="glass-panel rounded-2xl overflow-hidden">
              {filePreview && <img src={filePreview} alt="Preview" className="w-full max-h-60 object-contain bg-secondary/30" />}
              {selectedFile.type.startsWith("audio/") && (
                <div className="p-6 bg-secondary/30 flex justify-center">
                  <audio src={URL.createObjectURL(selectedFile)} controls className="w-full max-w-md" />
                </div>
              )}
              {selectedFile.type.startsWith("video/") && (
                <video src={URL.createObjectURL(selectedFile)} controls className="w-full max-h-60" />
              )}
            </div>
          )}

          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title</label>
              <input value={analysis.title} onChange={(e) => setAnalysis({ ...analysis, title: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Summary</label>
              <textarea value={analysis.summary} onChange={(e) => setAnalysis({ ...analysis, summary: e.target.value })}
                rows={3}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
            </div>
            {analysis.extractedText && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Extracted Text</label>
                <p className="text-sm font-mono-data bg-secondary/50 p-3 rounded-xl">{analysis.extractedText}</p>
              </div>
            )}
            {analysis.transcription && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Transcription</label>
                <p className="text-sm font-mono-data bg-secondary/50 p-3 rounded-xl">{analysis.transcription}</p>
              </div>
            )}
            {analysis.tags.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.dominantColors.length > 0 && (
              <div className="flex gap-2">
                {analysis.dominantColors.map((c, i) => (
                  <span key={i} className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={resetForm} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors btn-press">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 gradient-hero text-foreground font-semibold py-3 rounded-xl btn-press hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Document"}
            </button>
          </div>
        </div>
      )}

      {/* Document List */}
      {!step && (
        <>
          {/* Search + Filter */}
          {documents.length > 0 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, tags, summary..."
                  className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {filterTabs.map((tab) => (
                  <button key={tab.value} onClick={() => setFilter(tab.value)}
                    className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border whitespace-nowrap transition-colors btn-press ${
                      filter === tab.value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}>
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.value !== "all" && (
                      <span className="text-[10px] opacity-70">({documents.filter((d) => d.fileType === tab.value).length})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-pulse rounded-2xl" style={{ aspectRatio: "4/3" }} />
              ))}
            </div>
          ) : filtered.length === 0 && documents.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Upload a file and AI will analyze it for you</p>
              <button onClick={() => setStep("upload")} className="gradient-hero text-foreground font-medium text-sm py-2.5 px-5 rounded-xl btn-press">
                <PlusCircle className="w-4 h-4 inline mr-2" /> Add First Document
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">
                {searchQuery ? `No results for "${searchQuery}"` : `No ${filter} files found`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((d) => (
                <DocumentCard key={d.id} doc={d} onDelete={(id) => setDeleteId(id)} onPreview={setPreviewDoc} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentsPage;
