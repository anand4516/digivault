import React, { useState, useRef } from "react";
import { useWalletCards } from "@/hooks/useWalletCards";
import WalletCardItem from "@/components/WalletCardItem";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { extractWalletCardData, getGeminiKey, ExtractedWalletCard } from "@/lib/gemini";
import GeminiKeyModal from "@/components/GeminiKeyModal";
import { CreditCard, PlusCircle, Upload, X, Loader2, Sparkles, Check, ArrowRight, Filter, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type Step = "upload" | "extracting" | "review";
type CategoryFilter = "all" | "credit" | "debit";
const CARD_TYPES = ["visa", "mastercard", "rupay", "amex", "other"] as const;
const CARD_CATEGORIES = ["credit", "debit", "other"] as const;

const WalletPage: React.FC = () => {
  const { cards, loading, addCard, updateCard, removeCard } = useWalletCards();
  const [step, setStep] = useState<Step | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [showFilter, setShowFilter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  // Files
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState("");
  const [backPreview, setBackPreview] = useState("");
  const [frontUrl, setFrontUrl] = useState("");
  const [backUrl, setBackUrl] = useState("");
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  // Extracted data (review step)
  const [data, setData] = useState<ExtractedWalletCard | null>(null);

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
    if (!frontFile) { toast.error("Upload the front of the card"); return; }
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

      setProgressLabel("AI reading your card...");
      setProgress(70);

      const extracted = await extractWalletCardData(fUrl, bUrl || undefined);
      setProgress(100);
      setData(extracted);

      setTimeout(() => setStep("review"), 400);
      toast.success("Card details extracted!");
    } catch (err: any) {
      toast.error(err.message || "Extraction failed");
      setStep("upload");
    }
  };

  const handleSave = async () => {
    if (!data) return;
    if (!data.cardHolder?.trim()) { toast.error("Card holder name required"); return; }
    setSaving(true);
    try {
      await addCard({
        cardHolder: data.cardHolder.trim(),
        cardNumber: (data.cardNumber || "").replace(/\s/g, ""),
        expiryDate: data.expiryDate || "",
        cvv: data.cvv || "",
        pin: data.pin || "",
        bankName: data.bankName || "",
        cardType: data.cardType || "other",
        cardCategory: data.cardCategory || "other",
        notes: data.notes || "",
        cardFrontUrl: frontUrl,
        cardBackUrl: backUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success("Card saved!");
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await removeCard(id);
    toast.success("Card deleted");
  };

  const updateField = (field: keyof ExtractedWalletCard, value: string) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {showKeyModal && <GeminiKeyModal onDone={() => setShowKeyModal(false)} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">My Cards</h1>
            <p className="text-sm text-muted-foreground">Store your credit &amp; debit cards securely</p>
          </div>
        </div>
        <button
          onClick={() => step ? resetForm() : setStep("upload")}
          className="gradient-hero text-foreground font-medium text-xs py-2 px-3.5 rounded-lg btn-press hover:opacity-90 flex items-center gap-1.5"
        >
          {step ? <X className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
          {step ? "Cancel" : "Add Card"}
        </button>
      </div>

      {/* Upload Step */}
      {step === "upload" && (
        <div className="glass-panel rounded-2xl p-6 space-y-5 animate-fade-slide-up">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Upload Card Image</h3>
          </div>
          <p className="text-sm text-muted-foreground">Upload front (and optionally back) of your card. AI will extract all details automatically.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["front", "back"] as const).map((side) => {
              const preview = side === "front" ? frontPreview : backPreview;
              const ref = side === "front" ? frontRef : backRef;
              return (
                <div
                  key={side}
                  onClick={() => ref.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && handleFileSelect(e.dataTransfer.files[0], side); }}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${preview ? "border-primary/30" : "border-border"}`}
                >
                  <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], side)} />
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt={side} className="max-h-40 mx-auto rounded-lg" />
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
                      <p className="font-medium text-sm mb-1 capitalize">{side} Side {side === "front" ? "*" : ""}</p>
                      <p className="text-xs text-muted-foreground">{side === "back" ? "(Optional) " : ""}Drop, click or use camera</p>
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

      {/* Extracting Step */}
      {step === "extracting" && (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-6 animate-fade-slide-up">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-foreground animate-spin" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">Reading your card...</h3>
            <p className="text-sm text-muted-foreground">{progressLabel}</p>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div className="h-full gradient-hero rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm font-mono-data text-muted-foreground">{progress}%</p>
        </div>
      )}

      {/* Review Step */}
      {step === "review" && data && (
        <div className="space-y-5 animate-fade-slide-up">
          <h3 className="font-display font-semibold text-lg">Review Extracted Info</h3>

          {/* Preview images side by side */}
          {(frontPreview || backPreview) && (
            <div className="grid grid-cols-2 gap-3">
              {frontPreview && <img src={frontPreview} alt="Front" className="rounded-xl w-full object-cover" style={{ aspectRatio: "1.586" }} />}
              {backPreview && <img src={backPreview} alt="Back" className="rounded-xl w-full object-cover" style={{ aspectRatio: "1.586" }} />}
            </div>
          )}

          <div className="glass-panel rounded-2xl p-6 space-y-4">
            {([
              { label: "Card Holder", field: "cardHolder" as const },
              { label: "Card Number", field: "cardNumber" as const },
              { label: "Expiry Date", field: "expiryDate" as const },
              { label: "CVV", field: "cvv" as const },
              { label: "PIN", field: "pin" as const },
              { label: "Bank Name", field: "bankName" as const },
              { label: "Notes", field: "notes" as const },
            ]).map(({ label, field }) => (
              <div key={field}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input
                  value={data[field] || ""}
                  onChange={(e) => updateField(field, e.target.value)}
                  className={`w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${field === "cardNumber" || field === "expiryDate" || field === "cvv" ? "font-mono-data" : ""}`}
                />
              </div>
            ))}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Card Type</label>
              <div className="flex gap-2 flex-wrap">
                {CARD_TYPES.map((t) => (
                  <button key={t} onClick={() => updateField("cardType", t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors btn-press capitalize ${
                      data.cardType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <div className="flex gap-2 flex-wrap">
                {CARD_CATEGORIES.map((c) => (
                  <button key={c} onClick={() => updateField("cardCategory", c)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors btn-press capitalize ${
                      data.cardCategory === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={resetForm} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors btn-press">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 gradient-hero text-foreground font-semibold py-3 rounded-xl btn-press hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Card"}
            </button>
          </div>
        </div>
      )}

      {/* Existing Cards */}
      {!step && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-pulse rounded-2xl" style={{ aspectRatio: "1.586" }} />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">No cards yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Upload a card image and AI will extract the details</p>
              <button onClick={() => setStep("upload")} className="gradient-hero text-foreground font-medium text-sm py-2.5 px-5 rounded-xl btn-press">
                <PlusCircle className="w-4 h-4 inline mr-2" /> Add First Card
              </button>
            </div>
          ) : (
            <>
              {/* Filter */}
              <div className="relative inline-block">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-accent transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  {categoryFilter === "all" ? "All Cards" : categoryFilter === "credit" ? "Credit Cards" : "Debit Cards"}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showFilter && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden min-w-[150px]">
                    {(["all", "credit", "debit"] as CategoryFilter[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => { setCategoryFilter(f); setShowFilter(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors capitalize ${categoryFilter === f ? "text-primary font-medium" : "text-foreground"}`}
                      >
                        {f === "all" ? "All Cards" : `${f} Cards`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards
                  .filter((c) => categoryFilter === "all" || c.cardCategory === categoryFilter)
                  .map((card) => (
                    <WalletCardItem key={card.id} card={card} onDelete={handleDelete} onUpdate={updateCard} />
                  ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default WalletPage;
