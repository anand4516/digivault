import React, { useState } from "react";
import { WalletCard, CARD_TYPE_COLORS } from "@/types/wallet";
import { Copy, Trash2, CreditCard, ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const CARD_TYPES = ["visa", "mastercard", "rupay", "amex", "other"] as const;
const CARD_CATEGORIES = ["credit", "debit", "other"] as const;

interface Props {
  card: WalletCard;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<WalletCard>) => Promise<void>;
}

const WalletCardItem: React.FC<Props> = ({ card, onDelete, onUpdate }) => {
  const [flipped, setFlipped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<WalletCard>>({});
  const gradient = CARD_TYPE_COLORS[card.cardType] || CARD_TYPE_COLORS.other;

  const maskedNumber = card.cardNumber
    ? "•••• •••• •••• " + card.cardNumber.slice(-4)
    : "•••• •••• •••• ••••";

  const copyField = (label: string, value: string) => {
    if (!value) { toast.error(`No ${label} available`); return; }
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied!`);
  };

  const hasFrontImage = !!card.cardFrontUrl;
  const hasBackImage = !!card.cardBackUrl;

  const startEdit = () => {
    setEditData({
      cardHolder: card.cardHolder,
      cardNumber: card.cardNumber,
      expiryDate: card.expiryDate,
      cvv: card.cvv || "",
      pin: card.pin || "",
      bankName: card.bankName,
      cardType: card.cardType,
      cardCategory: card.cardCategory,
      notes: card.notes || "",
    });
    setEditing(true);
    setShowDetails(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditData({});
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await onUpdate(card.id, editData);
      toast.success("Card updated!");
      setEditing(false);
      setEditData({});
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: "Card Holder", field: "cardHolder" as const, sensitive: false },
    { label: "Card Number", field: "cardNumber" as const, sensitive: true, mono: true },
    { label: "Expiry Date", field: "expiryDate" as const, sensitive: false, mono: true },
    { label: "CVV", field: "cvv" as const, sensitive: true, mono: true },
    { label: "PIN", field: "pin" as const, sensitive: true, mono: true },
    { label: "Bank Name", field: "bankName" as const, sensitive: false },
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
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {hasFrontImage ? (
              <img src={card.cardFrontUrl} alt="Card front" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} rounded-2xl p-6 flex flex-col justify-between`}>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-white/80">{card.bankName || "Bank"}</span>
                  <CreditCard className="w-8 h-8 text-white/60" />
                </div>
                <div>
                  <p className="text-lg font-mono-data text-white tracking-widest mb-3">{maskedNumber}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-white/50 uppercase">Card Holder</p>
                      <p className="text-sm text-white font-medium">{card.cardHolder || "NAME"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/50 uppercase">Expires</p>
                      <p className="text-sm text-white font-mono-data">{card.expiryDate || "MM/YY"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {hasBackImage ? (
              <img src={card.cardBackUrl} alt="Card back" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} rounded-2xl flex flex-col justify-center`}>
                <div className="w-full h-10 bg-black/40 mt-6" />
                <div className="px-6 mt-4">
                  <div className="bg-white/20 rounded h-8 flex items-center justify-end px-3">
                    <span className="text-white font-mono-data text-sm">{card.cvv || "•••"}</span>
                  </div>
                </div>
                <p className="text-center text-white/40 text-xs mt-auto mb-4">Tap to flip back</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">Tap card to flip</p>

      {/* Summary + Actions */}
      <div className="flex items-center justify-between px-1">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{card.cardHolder}</p>
          <p className="text-xs text-muted-foreground font-mono-data">
            {maskedNumber} · {card.cardType.toUpperCase()}
            {card.cardCategory && card.cardCategory !== "other" ? ` · ${card.cardCategory.toUpperCase()}` : ""}
          </p>
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
            title="Delete this card?"
            description="This will permanently remove this card and all its details."
          />
        </div>
      </div>

      {/* Expandable Detail Panel */}
      {showDetails && (
        <div className="glass-panel rounded-xl p-4 space-y-3 animate-fade-slide-up">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {editing ? "Edit Card" : "Card Details"}
            </span>
            {!editing && (
              <button
                onClick={() => setShowSensitive(!showSensitive)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showSensitive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSensitive ? "Hide" : "Show"}
              </button>
            )}
          </div>

          {editing ? (
            <>
              {fields.map(({ label, field, mono }) => (
                <div key={field}>
                  <label className="text-[10px] text-muted-foreground uppercase mb-1 block">{label}</label>
                  <input
                    value={getValue(field)}
                    onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                    className={`w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${mono ? "font-mono-data" : ""}`}
                  />
                </div>
              ))}

              <div>
                <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Card Type</label>
                <div className="flex gap-2 flex-wrap">
                  {CARD_TYPES.map((t) => (
                    <button key={t} onClick={() => setEditData({ ...editData, cardType: t })}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                        (editData.cardType || card.cardType) === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                      }`}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {CARD_CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setEditData({ ...editData, cardCategory: c })}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                        (editData.cardCategory || card.cardCategory) === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                      }`}>{c}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={cancelEdit} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 gradient-hero text-foreground font-medium text-sm py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          ) : (
            <>
              {fields.map(({ label, field, sensitive, mono }) => {
                const value = getValue(field);
                if (!value) return null;
                const display = sensitive && !showSensitive
                  ? label === "CVV" || label === "PIN" ? "••••" : "•••• •••• •••• " + (value?.slice(-4) || "")
                  : value;
                return (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
                      <p className={`text-sm truncate ${mono ? "font-mono-data" : ""}`}>{display}</p>
                    </div>
                    <button
                      onClick={() => copyField(label, value)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                      title={`Copy ${label}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {/* Card Type & Category as read-only */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Card Type</p>
                  <p className="text-sm">{card.cardType?.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Category</p>
                  <p className="text-sm">{(card.cardCategory || "other").toUpperCase()}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletCardItem;
