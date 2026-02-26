import React from "react";
import { DocumentFile, formatFileSize } from "@/types/document";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ExternalLink, Download } from "lucide-react";
import { format } from "date-fns";

interface Props {
  doc: DocumentFile | null;
  open: boolean;
  onClose: () => void;
}

const DocumentPreviewModal: React.FC<Props> = ({ doc, open, onClose }) => {
  if (!doc) return null;
  const a = doc.aiAnalysis;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-display font-bold text-sm sm:text-lg truncate pr-2">{a.title || doc.fileName}</h2>
          <div className="flex items-center gap-1.5">
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-secondary/30 w-full max-w-full">
          {doc.fileType === "image" && (
            <img src={doc.fileUrl} alt={a.title} className="w-full max-h-[50vh] object-contain" />
          )}
          {doc.fileType === "video" && (
            <video src={doc.fileUrl} controls className="w-full max-h-[50vh]" />
          )}
          {doc.fileType === "audio" && (
            <div className="p-6 sm:p-8 flex items-center justify-center">
              <audio src={doc.fileUrl} controls className="w-full max-w-lg" />
            </div>
          )}
          {doc.fileType === "pdf" && (
            <>
              {/* Desktop: iframe */}
              <iframe src={doc.fileUrl} className="hidden sm:block w-full max-w-full h-[50vh] border-0" title={doc.fileName} />
              {/* Mobile: Google Docs viewer as fallback + open link */}
              <div className="sm:hidden w-full max-w-full">
                <iframe
                  src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(doc.fileUrl)}`}
                  className="w-full max-w-full h-[45vh] border-0"
                  title={doc.fileName}
                />
                <div className="p-3 text-center">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open PDF in new tab
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* AI Analysis */}
        <div className="p-4 sm:p-5 space-y-4">
          {a.summary && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary</h4>
              <p className="text-sm">{a.summary}</p>
            </div>
          )}

          {a.extractedText && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Extracted Text</h4>
              <p className="text-sm font-mono-data bg-secondary p-3 rounded-xl whitespace-pre-wrap break-all overflow-hidden">{a.extractedText}</p>
            </div>
          )}

          {a.transcription && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Transcription</h4>
              <p className="text-sm font-mono-data bg-secondary p-3 rounded-xl whitespace-pre-wrap break-all overflow-hidden">{a.transcription}</p>
            </div>
          )}

          {a.keyMoments.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Key Topics / Moments</h4>
              <ul className="space-y-1">
                {a.keyMoments.map((m, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {a.dominantColors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Colors</h4>
              <div className="flex flex-wrap gap-2">
                {a.dominantColors.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full border border-border shrink-0" style={{ backgroundColor: c }} />
                    <span className="text-xs font-mono-data text-muted-foreground break-all">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {a.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {a.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border">
            <span className="truncate max-w-[200px]">{doc.fileName}</span>
            <span>{formatFileSize(doc.fileSize)}</span>
            <span>{a.category}</span>
            <span>{format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
