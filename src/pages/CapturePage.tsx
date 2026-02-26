import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { extractCardData, getGeminiKey, ExtractedCard } from "@/lib/gemini";
import { useCards } from "@/hooks/useCards";
import GeminiKeyModal from "@/components/GeminiKeyModal";
import { Upload, Camera, X, Check, ArrowRight, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Step = "capture" | "extracting" | "review";

const CapturePage: React.FC = () => {
  const navigate = useNavigate();
  const { addCard } = useCards();
  const [step, setStep] = useState<Step>("capture");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>("");
  const [backPreview, setBackPreview] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedCard | null>(null);
  const [frontUrl, setFrontUrl] = useState("");
  const [backUrl, setBackUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(!getGeminiKey());
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File, side: "front" | "back") => {
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Only images allowed"); return; }
    const url = URL.createObjectURL(file);
    if (side === "front") { setFrontFile(file); setFrontPreview(url); }
    else { setBackFile(file); setBackPreview(url); }
  };

  const handleDrop = (e: React.DragEvent, side: "front" | "back") => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file, side);
  };

  const startExtraction = async () => {
    if (!frontFile) { toast.error("Please add a front image"); return; }
    if (!getGeminiKey()) { setShowKeyModal(true); return; }

    setStep("extracting");
    try {
      setProgress(15);
      setProgressLabel("Uploading front image to cloud...");
      const fUrl = await uploadToCloudinary(frontFile);
      setFrontUrl(fUrl);
      setProgress(35);

      let bUrl = "";
      if (backFile) {
        setProgressLabel("Uploading back image...");
        bUrl = await uploadToCloudinary(backFile);
        setBackUrl(bUrl);
      }
      setProgress(55);

      setProgressLabel("Sending to Gemini AI...");
      setProgress(70);

      setProgressLabel("Extracting contact details...");
      const data = await extractCardData(fUrl, bUrl || undefined);
      setProgress(90);

      setProgressLabel("Validating data...");
      setExtractedData(data);
      setProgress(100);

      setTimeout(() => setStep("review"), 500);
      toast.success("Card data extracted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Extraction failed");
      setStep("capture");
    }
  };

  const handleSave = async () => {
    if (!extractedData) return;
    setSaving(true);
    try {
      await addCard({
        ...extractedData,
        tags: [],
        cardFrontUrl: frontUrl,
        cardBackUrl: backUrl,
        favorite: false,
        groups: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success(`${extractedData.name}'s card saved!`);
      navigate("/businessinfo");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, [field]: value });
  };

  const UploadZone = ({ side, file, preview, inputRef }: { side: "front" | "back"; file: File | null; preview: string; inputRef: React.RefObject<HTMLInputElement> }) => (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5 ${
        preview ? "border-primary/30" : "border-border"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, side)}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], side)} />
      {preview ? (
        <div className="relative">
          <img src={preview} alt={side} className="max-h-48 mx-auto rounded-lg" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (side === "front") { setFrontFile(null); setFrontPreview(""); }
              else { setBackFile(null); setBackPreview(""); }
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <>
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium text-sm mb-1">{side === "front" ? "Front Side" : "Back Side"}</p>
          <p className="text-xs text-muted-foreground">{side === "back" ? "(Optional) " : ""}Drop or click to upload</p>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-fade-slide-up">
      {showKeyModal && <GeminiKeyModal onDone={() => setShowKeyModal(false)} />}

      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-8">
        {["Capture", "Extract", "Review"].map((label, i) => {
          const stepMap: Step[] = ["capture", "extracting", "review"];
          const active = stepMap.indexOf(step) >= i;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${active ? "gradient-hero text-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px ${active ? "bg-primary" : "bg-border"}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP: Capture */}
      {step === "capture" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-bold mb-2">Upload Business Card</h2>
            <p className="text-muted-foreground text-sm">Add front and optionally back images of the card</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UploadZone side="front" file={frontFile} preview={frontPreview} inputRef={frontInputRef as React.RefObject<HTMLInputElement>} />
            <UploadZone side="back" file={backFile} preview={backPreview} inputRef={backInputRef as React.RefObject<HTMLInputElement>} />
          </div>
          <button
            onClick={startExtraction}
            disabled={!frontFile}
            className="w-full gradient-hero text-foreground font-semibold py-3 rounded-xl btn-press hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Extract with AI <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP: Extracting */}
      {step === "extracting" && (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-foreground animate-spin" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">DigiVault AI is reading your card...</h3>
            <p className="text-sm text-muted-foreground">{progressLabel}</p>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div className="h-full gradient-hero rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm font-mono-data text-muted-foreground">{progress}%</p>
        </div>
      )}

      {/* STEP: Review */}
      {step === "review" && extractedData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Review Extracted Data</h2>
            <button onClick={() => { setStep("capture"); setProgress(0); }} className="text-sm text-primary flex items-center gap-1 hover:underline">
              <RefreshCw className="w-3 h-3" /> Re-extract
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-6 space-y-4">
            {[
              { label: "Full Name", field: "name", value: extractedData.name },
              { label: "Job Title", field: "title", value: extractedData.title },
              { label: "Company", field: "company", value: extractedData.company },
              { label: "Industry", field: "industry", value: extractedData.industry },
              { label: "WhatsApp", field: "whatsapp", value: extractedData.whatsapp },
            ].map(({ label, field, value }) => (
              <div key={field}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input
                  value={value || ""}
                  onChange={(e) => updateField(field, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            ))}

            {/* Array fields */}
            {[
              { label: "Phone Numbers", field: "phone", values: extractedData.phone },
              { label: "Emails", field: "email", values: extractedData.email },
              { label: "Websites", field: "website", values: extractedData.website },
            ].map(({ label, field, values }) => (
              <div key={field}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input
                  value={(values || []).join(", ")}
                  onChange={(e) => updateField(field, e.target.value.split(",").map((s: string) => s.trim()))}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground font-mono-data focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            ))}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Address</label>
              <input
                value={extractedData.address?.full || ""}
                onChange={(e) => updateField("address", { ...extractedData.address, full: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea
                value={extractedData.notes || ""}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {extractedData.confidence && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">AI Confidence:</span>
                <span className={`text-xs font-mono-data px-2 py-0.5 rounded-full ${extractedData.confidence > 0.8 ? "bg-cv-teal/20 text-cv-teal" : extractedData.confidence > 0.5 ? "bg-cv-amber/20 text-cv-amber" : "bg-cv-coral/20 text-cv-coral"}`}>
                  {Math.round(extractedData.confidence * 100)}%
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate("/businessinfo")} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors btn-press">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gradient-hero text-foreground font-semibold py-3 rounded-xl btn-press hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Card"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapturePage;
