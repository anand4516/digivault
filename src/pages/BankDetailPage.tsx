import React, { useState, useRef } from "react";
import { useBankDetails } from "@/hooks/useBankDetails";
import BankDetailItem from "@/components/BankDetailItem";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { extractBankData, getGeminiKey, ExtractedBankDetail } from "@/lib/gemini";
import GeminiKeyModal from "@/components/GeminiKeyModal";
import { Landmark, PlusCircle, Upload, X, Loader2, Sparkles, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Step = "choose" | "upload" | "extracting" | "form";

const ACCOUNT_TYPES = ["savings", "current", "other"] as const;

const BankDetailPage: React.FC = () => {
  const { banks, loading, addBank, updateBank, removeBank } = useBankDetails();
  const [step, setStep] = useState<Step | null>(null);
  const [saving, setSaving] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [passbookUrl, setPassbookUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const emptyForm = {
    bankName: "", customerId: "", accountHolder: "", accountNumber: "",
    ifscCode: "", branchName: "", accountType: "savings" as "savings" | "current" | "other",
    debitCardNumber: "", cardExpiry: "", cvv: "", atmPin: "",
    registeredMobile: "", mobileAppLoginPin: "", mobileBankingPin: "",
    netBankingUserId: "", netBankingPassword: "", upiId: "", upiPin: "", notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const handleFileSelect = (f: File) => {
    if (!f.type.startsWith("image/")) { toast.error("Only images"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const resetAll = () => {
    setStep(null); setForm(emptyForm); setSaving(false); setProgress(0);
    setFile(null); setPreview(""); setPassbookUrl("");
  };

  const startExtraction = async () => {
    if (!file) { toast.error("Upload passbook image"); return; }
    if (!getGeminiKey()) { setShowKeyModal(true); return; }

    setStep("extracting");
    try {
      setProgress(20); setProgressLabel("Uploading image...");
      const url = await uploadToCloudinary(file);
      setPassbookUrl(url);
      setProgress(50);

      setProgressLabel("AI reading bank details...");
      setProgress(70);
      const extracted = await extractBankData(url);
      setProgress(100);

      setForm((prev) => ({
        ...prev,
        bankName: extracted.bankName || prev.bankName,
        customerId: extracted.customerId || prev.customerId,
        accountHolder: extracted.accountHolder || prev.accountHolder,
        accountNumber: extracted.accountNumber || prev.accountNumber,
        ifscCode: extracted.ifscCode || prev.ifscCode,
        branchName: extracted.branchName || prev.branchName,
        accountType: extracted.accountType || prev.accountType,
      }));

      setTimeout(() => setStep("form"), 400);
      toast.success("Bank details extracted!");
    } catch (err: any) {
      toast.error(err.message || "Extraction failed");
      setStep("upload");
    }
  };

  const handleSave = async () => {
    if (!form.bankName?.trim() && !form.accountHolder?.trim()) {
      toast.error("Bank name or account holder required");
      return;
    }
    setSaving(true);
    try {
      await addBank({
        ...form,
        passbookUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success("Bank details saved!");
      resetAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await removeBank(id);
    toast.success("Bank details deleted");
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const bankInfoFields = [
    { label: "Bank Name", field: "bankName" },
    { label: "Customer ID", field: "customerId", mono: true },
    { label: "Account Holder", field: "accountHolder" },
    { label: "Account Number", field: "accountNumber", mono: true },
    { label: "IFSC Code", field: "ifscCode", mono: true },
    { label: "Branch Name", field: "branchName" },
  ];

  const debitCardFields = [
    { label: "Debit Card Number", field: "debitCardNumber", mono: true },
    { label: "Card Expiry (MM/YY)", field: "cardExpiry", mono: true },
    { label: "CVV", field: "cvv", mono: true },
    { label: "ATM PIN", field: "atmPin", mono: true },
  ];

  const mobileFields = [
    { label: "Registered Mobile", field: "registeredMobile", mono: true },
    { label: "Mobile App Login PIN", field: "mobileAppLoginPin", mono: true },
    { label: "Mobile Banking PIN", field: "mobileBankingPin", mono: true },
  ];

  const netBankingFields = [
    { label: "Net Banking User ID", field: "netBankingUserId", mono: true },
    { label: "Net Banking Password", field: "netBankingPassword", mono: true },
  ];

  const upiFields = [
    { label: "UPI ID", field: "upiId", mono: true },
    { label: "UPI PIN", field: "upiPin", mono: true },
  ];

  const formSections = [
    { title: "🏦 Bank Information", fields: bankInfoFields },
    { title: "💳 Debit Card Details", fields: debitCardFields },
    { title: "📱 Mobile & App Banking", fields: mobileFields },
    { title: "🌐 Net Banking", fields: netBankingFields },
    { title: "📲 UPI Details", fields: upiFields },
  ];

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {showKeyModal && <GeminiKeyModal onDone={() => setShowKeyModal(false)} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
            <Landmark className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Bank Details</h1>
            <p className="text-sm text-muted-foreground">Store all your banking credentials securely</p>
          </div>
        </div>
        <button
          onClick={() => step ? resetAll() : setStep("choose")}
          className="gradient-hero text-foreground font-medium text-xs py-2 px-3.5 rounded-lg btn-press hover:opacity-90 flex items-center gap-1.5"
        >
          {step ? <X className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
          {step ? "Cancel" : "Add Bank"}
        </button>
      </div>

      {/* Choose method */}
      {step === "choose" && (
        <div className="glass-panel rounded-2xl p-6 space-y-4 animate-fade-slide-up">
          <h3 className="font-display font-semibold">How would you like to add?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => setStep("upload")}
              className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-primary" />
              <p className="font-medium text-sm mb-1">Upload Passbook</p>
              <p className="text-xs text-muted-foreground">AI extracts bank info from passbook front page</p>
            </button>
            <button onClick={() => setStep("form")}
              className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all">
              <Landmark className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-sm mb-1">Enter Manually</p>
              <p className="text-xs text-muted-foreground">Fill in all details yourself</p>
            </button>
          </div>
        </div>
      )}

      {/* Upload */}
      {step === "upload" && (
        <div className="glass-panel rounded-2xl p-6 space-y-5 animate-fade-slide-up">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Upload Passbook Front Page</h3>
          </div>
          <p className="text-sm text-muted-foreground">Upload the front page of your bank passbook. AI will extract bank name, account number, IFSC, and more.</p>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && handleFileSelect(e.dataTransfer.files[0]); }}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${preview ? "border-primary/30" : "border-border"}`}
          >
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Passbook" className="max-h-48 mx-auto rounded-lg" />
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(""); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium text-sm mb-1">Passbook Front Page</p>
                <p className="text-xs text-muted-foreground">Drop, click or use camera</p>
              </>
            )}
          </div>

          <button onClick={startExtraction} disabled={!file}
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
            <h3 className="font-display text-lg font-semibold mb-1">Reading your passbook...</h3>
            <p className="text-sm text-muted-foreground">{progressLabel}</p>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div className="h-full gradient-hero rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm font-mono-data text-muted-foreground">{progress}%</p>
        </div>
      )}

      {/* Form */}
      {step === "form" && (
        <div className="space-y-5 animate-fade-slide-up">
          <h3 className="font-display font-semibold text-lg">
            {passbookUrl ? "Review & Complete Details" : "Enter Bank Details"}
          </h3>

          {preview && (
            <img src={preview} alt="Passbook" className="rounded-xl max-h-40 mx-auto" />
          )}

          <div className="space-y-4">
            {formSections.map((section) => (
              <div key={section.title} className="glass-panel rounded-2xl p-5 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">{section.title}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {section.fields.map(({ label, field, mono }) => (
                    <div key={field}>
                      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                      <input
                        value={(form as any)[field] || ""}
                        onChange={(e) => updateField(field, e.target.value)}
                        className={`w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${mono ? "font-mono-data" : ""}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Account Type */}
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <label className="text-xs text-muted-foreground block">Account Type</label>
              <div className="flex gap-2 flex-wrap">
                {ACCOUNT_TYPES.map((t) => (
                  <button key={t} onClick={() => updateField("accountType", t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                      form.accountType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}>{t}</button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="glass-panel rounded-2xl p-5">
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={2}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={resetAll} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors btn-press">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 gradient-hero text-foreground font-semibold py-3 rounded-xl btn-press hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Bank Details"}
            </button>
          </div>
        </div>
      )}

      {/* Existing Banks */}
      {!step && (
        <>
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => <div key={i} className="skeleton-pulse rounded-2xl h-48" />)}
            </div>
          ) : banks.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Landmark className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">No bank details yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Upload a passbook image or add details manually</p>
              <button onClick={() => setStep("choose")} className="gradient-hero text-foreground font-medium text-sm py-2.5 px-5 rounded-xl btn-press">
                <PlusCircle className="w-4 h-4 inline mr-2" /> Add First Bank
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {banks.map((bank) => (
                <BankDetailItem key={bank.id} bank={bank} onDelete={handleDelete} onUpdate={updateBank} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BankDetailPage;
