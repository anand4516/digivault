import React, { useState, useRef } from "react";
import { useIdentityCards } from "@/hooks/useIdentityCards";
import IdentityCardItem from "@/components/IdentityCardItem";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { extractIdentityCardData, getGeminiKey, ExtractedIdentityCard } from "@/lib/gemini";
import GeminiKeyModal from "@/components/GeminiKeyModal";
import { IdentityDocType, DOC_TYPE_LABELS } from "@/types/identity";
import { IdCard, PlusCircle, Upload, X, Loader2, Sparkles, Check, ArrowRight, Filter, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type Step = "upload" | "extracting" | "review";
const DOC_TYPES: IdentityDocType[] = ["aadhar", "pan", "passport", "driving_license", "other"];

const IdentityPage: React.FC = () => {
  const { cards, loading, addCard, updateCard, removeCard } = useIdentityCards();
  const [step, setStep] = useState<Step | null>(null);
  const [docFilter, setDocFilter] = useState<IdentityDocType | "all">("all");
  const [showFilter, setShowFilter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState("");
  const [backPreview, setBackPreview] = useState("");
  const [frontUrl, setFrontUrl] = useState("");
  const [backUrl, setBackUrl] = useState("");
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<ExtractedIdentityCard | null>(null);

  const handleFileSelect = (file: File, side: "front" | "back") => {
    if (!file.type.startsWith("image/")) { toast.error("Only images"); return; }
    const url = URL.createObjectURL(file);
    if (side === "front") { setFrontFile(file); setFrontPreview(url); }
    else { setBackFile(file); setBackPreview(url); }
  };

  const resetForm = () => {
    setStep(null); setData(null); setSaving(false); setProgress(0);
    setFrontFile(null); setBackFile(null);
    setFrontPreview(""); setBackPreview("");
    setFrontUrl(""); setBackUrl("");
  };

  const startExtraction = async () => {
    if (!frontFile) { toast.error("Upload the front of the document"); return; }
    if (!getGeminiKey()) { setShowKeyModal(true); return; }

    setStep("extracting");
    try {
      setProgress(15); setProgressLabel("Uploading front image...");
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
      setProgressLabel("AI reading your document...");
      setProgress(70);

      const extracted = await extractIdentityCardData(fUrl, bUrl || undefined);
      setProgress(100);
      setData(extracted);
      setTimeout(() => setStep("review"), 400);
      toast.success("Document details extracted!");
    } catch (err: any) {
      toast.error(err.message || "Extraction failed");
      setStep("upload");
    }
  };

  const handleSave = async () => {
    if (!data) return;
    if (!data.holderName?.trim()) { toast.error("Holder name required"); return; }
    setSaving(true);
    try {
      await addCard({
        docType: data.docType || "other",
        holderName: data.holderName.trim(),
        documentNumber: data.documentNumber || "",
        dateOfBirth: data.dateOfBirth || "",
        issueDate: data.issueDate || "",
        expiryDate: data.expiryDate || "",
        address: data.address || "",
        gender: data.gender || "",
        fatherName: data.fatherName || "",
        notes: data.notes || "",
        frontUrl, backUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success("Document saved!");
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await removeCard(id);
    toast.success("Document deleted");
  };

  const updateField = (field: keyof ExtractedIdentityCard, value: string) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {showKeyModal && <GeminiKeyModal onDone={() => setShowKeyModal(false)} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <IdCard className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Identity Docs</h1>
            <p className="text-sm text-muted-foreground">Store your identity documents securely</p>
          </div>
        </div>
        <button
          onClick={() => step ? resetForm() : setStep("upload")}
          className="gradient-hero text-foreground font-medium text-xs py-2 px-3.5 rounded-lg btn-press hover:opacity-90 flex items-center gap-1.5"
        >
          {step ? <X className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
          {step ? "Cancel" : "Add Doc"}
        </button>
      </div>

      {/* Upload */}
      {step === "upload" && (
        <div className="glass-panel rounded-2xl p-6 space-y-5 animate-fade-slide-up">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Upload Document Image</h3>
          </div>
          <p className="text-sm text-muted-foreground">Upload front (and optionally back). AI will extract all details automatically.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["front", "back"] as const).map((side) => {
              const preview = side === "front" ? frontPreview : backPreview;
              const ref = side === "front" ? frontRef : backRef;
              return (
                <div key={side} onClick={() => ref.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && handleFileSelect(e.dataTransfer.files[0], side); }}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${preview ? "border-primary/30" : "border-border"}`}>
                  <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], side)} />
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt={side} className="max-h-40 mx-auto rounded-lg" />
                      <button onClick={(e) => { e.stopPropagation(); if (side === "front") { setFrontFile(null); setFrontPreview(""); } else { setBackFile(null); setBackPreview(""); } }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="font-medium text-sm mb-1 capitalize">{side} Side {side === "front" ? "*" : ""}</p>
                      <p className="text-xs text-muted-foreground">{side === "back" ? "(Optional) " : ""}Drop, click or camera</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={startExtraction} disabled={!frontFile}
            className="w-full gradient-hero text-foreground font-semibold py-3 rounded-xl btn-press hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Extract with AI <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Extracting */}
      {step === "extracting" && (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-6 animate-fade-slide-up">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-foreground animate-spin" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">Reading your document...</h3>
            <p className="text-sm text-muted-foreground">{progressLabel}</p>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div className="h-full gradient-hero rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm font-mono-data text-muted-foreground">{progress}%</p>
        </div>
      )}

      {/* Review */}
      {step === "review" && data && (
        <div className="space-y-5 animate-fade-slide-up">
          <h3 className="font-display font-semibold text-lg">Review Extracted Info</h3>
          {(frontPreview || backPreview) && (
            <div className="grid grid-cols-2 gap-3">
              {frontPreview && <img src={frontPreview} alt="Front" className="rounded-xl w-full object-cover" style={{ aspectRatio: "1.586" }} />}
              {backPreview && <img src={backPreview} alt="Back" className="rounded-xl w-full object-cover" style={{ aspectRatio: "1.586" }} />}
            </div>
          )}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            {([
              { label: "Holder Name", field: "holderName" as const },
              { label: "Document Number", field: "documentNumber" as const },
              { label: "Date of Birth", field: "dateOfBirth" as const },
              { label: "Gender", field: "gender" as const },
              { label: "Father's Name", field: "fatherName" as const },
              { label: "Issue Date", field: "issueDate" as const },
              { label: "Expiry Date", field: "expiryDate" as const },
              { label: "Address", field: "address" as const },
              { label: "Notes", field: "notes" as const },
            ]).map(({ label, field }) => (
              <div key={field}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input value={data[field] || ""} onChange={(e) => updateField(field, e.target.value)}
                  className={`w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${field === "documentNumber" ? "font-mono-data" : ""}`} />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Document Type</label>
              <div className="flex gap-2 flex-wrap">
                {DOC_TYPES.map((t) => (
                  <button key={t} onClick={() => updateField("docType", t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors btn-press ${data.docType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    {DOC_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
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

      {/* Existing Cards */}
      {!step && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton-pulse rounded-2xl" style={{ aspectRatio: "1.586" }} />)}
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <IdCard className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Upload a document image and AI will extract the details</p>
              <button onClick={() => setStep("upload")} className="gradient-hero text-foreground font-medium text-sm py-2.5 px-5 rounded-xl btn-press">
                <PlusCircle className="w-4 h-4 inline mr-2" /> Add First Document
              </button>
            </div>
          ) : (
            <>
              <div className="relative inline-block">
                <button onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-accent transition-colors">
                  <Filter className="w-4 h-4" />
                  {docFilter === "all" ? "All Documents" : DOC_TYPE_LABELS[docFilter]}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showFilter && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden min-w-[180px]">
                    <button onClick={() => { setDocFilter("all"); setShowFilter(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${docFilter === "all" ? "text-primary font-medium" : "text-foreground"}`}>All Documents</button>
                    {DOC_TYPES.map((t) => (
                      <button key={t} onClick={() => { setDocFilter(t); setShowFilter(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${docFilter === t ? "text-primary font-medium" : "text-foreground"}`}>
                        {DOC_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.filter((c) => docFilter === "all" || c.docType === docFilter).map((card) => (
                  <IdentityCardItem key={card.id} card={card} onDelete={handleDelete} onUpdate={updateCard} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default IdentityPage;
