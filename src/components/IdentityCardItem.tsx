import React, { useState } from "react";
import { IdentityCard, IdentityDocType, DOC_TYPE_COLORS, DOC_TYPE_LABELS } from "@/types/identity";
import { Copy, Trash2, IdCard, ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const DOC_TYPES: IdentityDocType[] = ["aadhar", "pan", "passport", "driving_license", "other"];

interface Props {
  card: IdentityCard;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<IdentityCard>) => Promise<void>;
}

const IdentityCardItem: React.FC<Props> = ({ card, onDelete, onUpdate }) => {
  const [flipped, setFlipped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<IdentityCard>>({});
  const gradient = DOC_TYPE_COLORS[card.docType] || DOC_TYPE_COLORS.other;
  const label = DOC_TYPE_LABELS[card.docType] || "ID Document";

  const maskedNumber = card.documentNumber
    ? "•••• " + card.documentNumber.slice(-4)
    : "••••";

  const copyField = (lbl: string, value: string) => {
    if (!value) { toast.error(`No ${lbl} available`); return; }
    navigator.clipboard.writeText(value);
    toast.success(`${lbl} copied!`);
  };

  const startEdit = () => {
    setEditData({
      holderName: card.holderName,
      documentNumber: card.documentNumber,
      dateOfBirth: card.dateOfBirth || "",
      gender: card.gender || "",
      fatherName: card.fatherName || "",
      issueDate: card.issueDate || "",
      expiryDate: card.expiryDate || "",
      address: card.address || "",
      notes: card.notes || "",
      docType: card.docType,
    });
    setEditing(true);
    setShowDetails(true);
  };

  const cancelEdit = () => { setEditing(false); setEditData({}); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await onUpdate(card.id, editData);
      toast.success("Document updated!");
      setEditing(false);
      setEditData({});
    } catch {
      toast.error("Failed to update");
    } finally { setSaving(false); }
  };

  const fields = [
    { label: "Holder Name", field: "holderName" as const, sensitive: false },
    { label: "Document Number", field: "documentNumber" as const, sensitive: true, mono: true },
    { label: "Date of Birth", field: "dateOfBirth" as const, sensitive: false, mono: true },
    { label: "Gender", field: "gender" as const, sensitive: false },
    { label: "Father's Name", field: "fatherName" as const, sensitive: false },
    { label: "Issue Date", field: "issueDate" as const, sensitive: false, mono: true },
    { label: "Expiry Date", field: "expiryDate" as const, sensitive: false, mono: true },
    { label: "Address", field: "address" as const, sensitive: false },
    { label: "Notes", field: "notes" as const, sensitive: false },
  ];

  const getValue = (field: string) => {
    if (editing && field in editData) return (editData as any)[field] || "";
    return (card as any)[field] || "";
  };

  return (
    <div className="space-y-2">
      {/* Flip container */}
      <div
        className="relative w-full cursor-pointer"
        style={{ perspective: "1000px", aspectRatio: "1.586" }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
            {card.frontUrl ? (
              <img src={card.frontUrl} alt="Front" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} rounded-2xl p-6 flex flex-col justify-between`}>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-white/80">{label}</span>
                  <IdCard className="w-8 h-8 text-white/60" />
                </div>
                <div>
                  <p className="text-lg font-mono-data text-white tracking-widest mb-3">{maskedNumber}</p>
                  <p className="text-sm text-white font-medium">{card.holderName || "NAME"}</p>
                </div>
              </div>
            )}
          </div>
          <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            {card.backUrl ? (
              <img src={card.backUrl} alt="Back" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center`}>
                <p className="text-white/40 text-sm">No back image · Tap to flip</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">Tap card to flip</p>

      {/* Summary + Actions */}
      <div className="flex items-center justify-between px-1">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{card.holderName}</p>
          <p className="text-xs text-muted-foreground font-mono-data">{maskedNumber} · {label}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => editing ? cancelEdit() : startEdit()} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Edit">
            {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowDetails(!showDetails)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="View details">
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <DeleteConfirmDialog
            onConfirm={() => onDelete(card.id)}
            title="Delete this document?"
            description="This will permanently remove this identity document and all its details."
          />
        </div>
      </div>

      {/* Expandable Detail Panel */}
      {showDetails && (
        <div className="glass-panel rounded-xl p-4 space-y-3 animate-fade-slide-up">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {editing ? "Edit Document" : "Document Details"}
            </span>
            {!editing && (
              <button onClick={() => setShowSensitive(!showSensitive)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {showSensitive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSensitive ? "Hide" : "Show"}
              </button>
            )}
          </div>

          {editing ? (
            <>
              {fields.map(({ label: lbl, field, mono }) => (
                <div key={field}>
                  <label className="text-[10px] text-muted-foreground uppercase mb-1 block">{lbl}</label>
                  <input
                    value={getValue(field)}
                    onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                    className={`w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${mono ? "font-mono-data" : ""}`}
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Document Type</label>
                <div className="flex gap-2 flex-wrap">
                  {DOC_TYPES.map((t) => (
                    <button key={t} onClick={() => setEditData({ ...editData, docType: t })}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                        (editData.docType || card.docType) === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                      }`}>{DOC_TYPE_LABELS[t]}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={cancelEdit} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 gradient-hero text-foreground font-medium text-sm py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          ) : (
            <>
              {fields.map(({ label: lbl, field, sensitive, mono }) => {
                const value = getValue(field);
                if (!value) return null;
                const display = sensitive && !showSensitive ? "•••• " + (value?.slice(-4) || "") : value;
                return (
                  <div key={lbl} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase">{lbl}</p>
                      <p className={`text-sm truncate ${mono ? "font-mono-data" : ""}`}>{display}</p>
                    </div>
                    <button onClick={() => copyField(lbl, value)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0" title={`Copy ${lbl}`}>
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Document Type</p>
                  <p className="text-sm">{DOC_TYPE_LABELS[card.docType] || "Other"}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default IdentityCardItem;
