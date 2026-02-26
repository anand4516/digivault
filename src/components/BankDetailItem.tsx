import React, { useState } from "react";
import { BankDetail, getBankGradient } from "@/types/bank";
import { Copy, Trash2, Landmark, ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Check, X, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface Props {
  bank: BankDetail;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<BankDetail>) => Promise<void>;
}

const ACCOUNT_TYPES = ["savings", "current", "other"] as const;

const BankDetailItem: React.FC<Props> = ({ bank, onDelete, onUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [showCardInfo, setShowCardInfo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<BankDetail>>({});
  const gradient = getBankGradient(bank.bankName);

  const maskedAccount = bank.accountNumber
    ? "****" + bank.accountNumber.slice(-4)
    : "****";

  const copyField = (label: string, value: string) => {
    if (!value) { toast.error(`No ${label} available`); return; }
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied!`);
  };

  const startEdit = () => {
    setEditData({
      bankName: bank.bankName, customerId: bank.customerId, accountHolder: bank.accountHolder,
      accountNumber: bank.accountNumber, ifscCode: bank.ifscCode, branchName: bank.branchName,
      accountType: bank.accountType, debitCardNumber: bank.debitCardNumber || "",
      cardExpiry: bank.cardExpiry || "", cvv: bank.cvv || "", atmPin: bank.atmPin || "",
      registeredMobile: bank.registeredMobile || "", mobileAppLoginPin: bank.mobileAppLoginPin || "",
      mobileBankingPin: bank.mobileBankingPin || "", netBankingUserId: bank.netBankingUserId || "",
      netBankingPassword: bank.netBankingPassword || "", upiId: bank.upiId || "", upiPin: bank.upiPin || "",
      notes: bank.notes || "",
    });
    setEditing(true);
    setShowDetails(true);
  };

  const cancelEdit = () => { setEditing(false); setEditData({}); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await onUpdate(bank.id, editData);
      toast.success("Bank details updated!");
      setEditing(false);
      setEditData({});
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  const getValue = (field: string) => {
    if (editing && field in editData) return (editData as any)[field] || "";
    return (bank as any)[field] || "";
  };

  const sections = [
    {
      title: "Bank Information",
      icon: "🏦",
      fields: [
        { label: "Bank Name", field: "bankName", sensitive: false },
        { label: "Customer ID", field: "customerId", sensitive: false, mono: true },
        { label: "Account Holder", field: "accountHolder", sensitive: false },
        { label: "Account Number", field: "accountNumber", sensitive: true, mono: true },
        { label: "IFSC Code", field: "ifscCode", sensitive: false, mono: true },
        { label: "Branch Name", field: "branchName", sensitive: false },
      ],
    },
    {
      title: "Debit Card Details",
      icon: "💳",
      fields: [
        { label: "Debit Card Number", field: "debitCardNumber", sensitive: true, mono: true },
        { label: "Card Expiry (MM/YY)", field: "cardExpiry", sensitive: true, mono: true },
        { label: "CVV", field: "cvv", sensitive: true, mono: true },
        { label: "ATM PIN", field: "atmPin", sensitive: true, mono: true },
      ],
    },
    {
      title: "Mobile & App Banking",
      icon: "📱",
      fields: [
        { label: "Registered Mobile", field: "registeredMobile", sensitive: true, mono: true },
        { label: "Mobile App Login PIN", field: "mobileAppLoginPin", sensitive: true, mono: true },
        { label: "Mobile Banking PIN", field: "mobileBankingPin", sensitive: true, mono: true },
      ],
    },
    {
      title: "Net Banking",
      icon: "🌐",
      fields: [
        { label: "Net Banking User ID", field: "netBankingUserId", sensitive: true, mono: true },
        { label: "Net Banking Password", field: "netBankingPassword", sensitive: true, mono: true },
      ],
    },
    {
      title: "UPI Details",
      icon: "📲",
      fields: [
        { label: "UPI ID", field: "upiId", sensitive: false, mono: true },
        { label: "UPI PIN", field: "upiPin", sensitive: true, mono: true },
      ],
    },
  ];

  const maskValue = (value: string, label: string) => {
    if (!value) return "";
    if (label.includes("PIN") || label.includes("CVV") || label.includes("Password")) return "••••";
    if (value.length > 4) return "****" + value.slice(-4);
    return "••••";
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Header Card */}
      <div className={`bg-gradient-to-br ${gradient} p-5`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Bank</p>
            <h3 className="text-white font-bold text-lg">{bank.bankName || "Bank"}</h3>
            <p className="text-white/80 text-sm mt-1">{bank.accountHolder || "Account Holder"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowCardInfo(!showCardInfo); }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title={showCardInfo ? "Hide details" : "Show details"}
            >
              {showCardInfo ? <EyeOff className="w-4 h-4 text-white/70" /> : <Eye className="w-4 h-4 text-white/70" />}
            </button>
            <Landmark className="w-6 h-6 text-white/30" />
          </div>
        </div>
        <div className="mt-4 flex justify-between items-end">
          <div>
            <p className="text-white/50 text-[10px] uppercase">Account Number</p>
            <p className="text-white font-mono-data tracking-widest">
              {showCardInfo ? bank.accountNumber || "—" : maskedAccount}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-[10px] uppercase">IFSC</p>
            <p className="text-white font-mono-data text-sm">
              {showCardInfo ? (bank.ifscCode || "—") : (bank.ifscCode ? "****" + bank.ifscCode.slice(-3) : "—")}
            </p>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-xs text-muted-foreground">
          {(bank.accountType || "savings").toUpperCase()} ACCOUNT
          {bank.branchName ? ` · ${bank.branchName}` : ""}
        </p>
        <div className="flex gap-1">
          <button onClick={() => editing ? cancelEdit() : startEdit()} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Edit">
            {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowDetails(!showDetails)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Details">
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <DeleteConfirmDialog
            onConfirm={() => onDelete(bank.id)}
            title="Delete bank details?"
            description="This will permanently remove this bank entry and all its credentials."
          />
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="p-4 space-y-4 animate-fade-slide-up">
          {!editing && (
            <div className="flex justify-end">
              <button onClick={() => setShowSensitive(!showSensitive)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {showSensitive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSensitive ? "Hide Sensitive" : "Show All"}
              </button>
            </div>
          )}

          {sections.map((section) => {
            const hasData = editing || section.fields.some(f => getValue(f.field));
            if (!hasData && !editing) return null;
            return (
              <div key={section.title} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{section.icon}</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</span>
                </div>
                {editing ? (
                  <div className="space-y-3">
                    {section.fields.map(({ label, field, mono }) => (
                      <div key={field}>
                        <label className="text-[10px] text-muted-foreground uppercase mb-1 block">{label}</label>
                        <input
                          value={getValue(field)}
                          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                          className={`w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${mono ? "font-mono-data" : ""}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {section.fields.map(({ label, field, sensitive, mono }) => {
                      const value = getValue(field);
                      if (!value) return (
                        <div key={field} className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
                            <p className="text-sm text-muted-foreground/50 italic">Not Set</p>
                          </div>
                        </div>
                      );
                      const display = sensitive && !showSensitive ? maskValue(value, label) : value;
                      const isSaved = sensitive && value;
                      return (
                        <div key={field} className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm truncate ${mono ? "font-mono-data" : ""}`}>{display}</p>
                              {isSaved && !showSensitive && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> Saved
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => copyField(label, value)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0" title={`Copy ${label}`}>
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Notes */}
          {editing ? (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Notes</label>
              <textarea
                value={getValue("notes")}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={2}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>
          ) : getValue("notes") ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase">Notes</p>
                <p className="text-sm">{getValue("notes")}</p>
              </div>
              <button onClick={() => copyField("Notes", getValue("notes"))} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Account Type (edit mode) */}
          {editing && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Account Type</label>
              <div className="flex gap-2 flex-wrap">
                {ACCOUNT_TYPES.map((t) => (
                  <button key={t} onClick={() => setEditData({ ...editData, accountType: t })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                      (editData.accountType || bank.accountType) === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {/* Save/Cancel buttons */}
          {editing && (
            <div className="flex gap-2 pt-2">
              <button onClick={cancelEdit} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 gradient-hero text-foreground font-medium text-sm py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BankDetailItem;
