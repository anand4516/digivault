import React from "react";
import { DocumentFile, formatFileSize } from "@/types/document";
import { Trash2, Expand, FileText, Music, Film, Image } from "lucide-react";
import { format } from "date-fns";

interface Props {
  doc: DocumentFile;
  onDelete: (id: string) => void;
  onPreview: (doc: DocumentFile) => void;
}

const typeIcons = {
  image: Image,
  pdf: FileText,
  audio: Music,
  video: Film,
};

const DocumentCard: React.FC<Props> = ({ doc, onDelete, onPreview }) => {
  const Icon = typeIcons[doc.fileType];
  const analysis = doc.aiAnalysis;

  return (
    <div
      className="glass-panel rounded-2xl overflow-hidden card-hover animate-fade-slide-up cursor-pointer group"
      onClick={() => onPreview(doc)}
    >
      {/* Preview area */}
      <div className="relative aspect-video bg-secondary/50 overflow-hidden">
        {doc.fileType === "image" && (
          <img src={doc.fileUrl} alt={analysis.title} className="w-full h-full object-cover" loading="lazy" />
        )}
        {doc.fileType === "video" && (
          <video src={doc.fileUrl} className="w-full h-full object-cover" muted preload="metadata" />
        )}
        {doc.fileType === "pdf" && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-destructive/10 to-destructive/5">
            <FileText className="w-16 h-16 text-destructive/60" />
            {analysis.pageCount > 0 && (
              <span className="absolute top-2 right-2 text-xs font-mono-data bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                {analysis.pageCount} pages
              </span>
            )}
          </div>
        )}
        {doc.fileType === "audio" && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
            <Music className="w-12 h-12 text-primary/60 mb-3" />
            <audio src={doc.fileUrl} controls className="w-full max-w-[90%]" preload="metadata" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        {/* Duration badge */}
        {analysis.duration && (
          <span className="absolute bottom-2 right-2 text-[10px] font-mono-data bg-foreground/70 text-background px-1.5 py-0.5 rounded">
            {analysis.duration}
          </span>
        )}

        {/* Expand button */}
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(doc); }}
          className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-foreground/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Expand className="w-3.5 h-3.5 text-background" />
        </button>
      </div>

      {/* Info area */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <h3 className="font-display font-semibold text-sm truncate">{analysis.title || doc.fileName}</h3>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {analysis.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2">{analysis.summary}</p>
        )}

        {/* Color dots for images */}
        {doc.fileType === "image" && analysis.dominantColors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {analysis.dominantColors.slice(0, 5).map((c, i) => (
              <span key={i} className="w-3.5 h-3.5 rounded-full border border-border" style={{ backgroundColor: c }} />
            ))}
          </div>
        )}

        {/* Extracted text badge */}
        {analysis.extractedText && (
          <div className="text-[10px] font-mono-data text-muted-foreground bg-secondary px-2 py-1 rounded-lg line-clamp-1">
            📝 {analysis.extractedText}
          </div>
        )}

        {/* Transcription snippet */}
        {analysis.transcription && (
          <div className="text-[10px] font-mono-data text-muted-foreground bg-secondary px-2 py-1 rounded-lg line-clamp-2">
            🎤 {analysis.transcription}
          </div>
        )}

        {/* Tags */}
        {analysis.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {analysis.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span>{formatFileSize(doc.fileSize)}</span>
          <span>{format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
