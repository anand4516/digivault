import React, { useState, useMemo, useRef, useEffect } from "react";
import { useFinance } from "@/hooks/useFinance";
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from "@/types/finance";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Filter, PieChart, Trash2, Tag, Edit3, X, Settings, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

const FinancePage: React.FC = () => {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, customCategories, addCustomCategory, deleteCustomCategory, editCustomCategory } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterMonth, setFilterMonth] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryOld, setEditCategoryOld] = useState("");
  const [manageCategoryType, setManageCategoryType] = useState<"income" | "expense">("expense");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"income" | "expense">("expense");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allCategories = useMemo(() => ({
    income: [...DEFAULT_INCOME_CATEGORIES, ...customCategories.income],
    expense: [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories.expense],
  }), [customCategories]);

  const filtered = useMemo(() => {
    let result = transactions.filter((t) => t.type === activeTab);
    if (filterMonth) result = result.filter((t) => t.date.startsWith(filterMonth));
    return result;
  }, [transactions, activeTab, filterMonth]);

  const summary = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { amount: number; type: string }> = {};
    filtered.forEach((t) => {
      if (!map[t.category]) map[t.category] = { amount: 0, type: t.type };
      map[t.category].amount += t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
  }, [filtered]);

  const totalFiltered = filtered.reduce((s, t) => s + t.amount, 0);

  const resetForm = () => {
    setAmount(""); setCategory(""); setDescription(""); setEditingId(null);
    setDate(new Date().toISOString().split("T")[0]);
  };

  const openEdit = (t: typeof transactions[0]) => {
    setType(t.type); setAmount(String(t.amount)); setCategory(t.category);
    setDescription(t.description || ""); setDate(t.date); setEditingId(t.id); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) { toast.error("Fill in amount and category"); return; }
    const data = { type, amount: parseFloat(amount), category, description, date };
    if (editingId) {
      await updateTransaction(editingId, data);
      toast.success("Transaction updated");
    } else {
      await addTransaction(data);
      toast.success(`${type === "income" ? "Income" : "Expense"} added`);
    }
    resetForm(); setShowForm(false);
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (allCategories[type].includes(newCategory.trim())) { toast.error("Category exists"); return; }
    addCustomCategory(type, newCategory.trim());
    toast.success("Category added");
    setNewCategory(""); setShowCategoryForm(false);
  };

  const handleEditCategory = () => {
    if (!editCategoryName.trim() || !editCategoryOld) return;
    editCustomCategory(manageCategoryType, editCategoryOld, editCategoryName.trim());
    toast.success("Category renamed");
    setEditCategoryOld(""); setEditCategoryName("");
  };

  const handleDeleteCategory = () => {
    if (deleteCategoryName) {
      deleteCustomCategory(manageCategoryType, deleteCategoryName);
      toast.success("Category deleted");
      setDeleteCategoryName(null);
    }
  };

  const handleDelete = async () => {
    if (deleteId) { await deleteTransaction(deleteId); toast.success("Deleted"); setDeleteId(null); }
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Income & Expenses</h1>
            <p className="text-sm text-muted-foreground">Track your finances</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setManageCategoryType(activeTab); setShowCategoryManager(true); }} className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={() => { resetForm(); setType(activeTab); setShowForm(true); }} className="gradient-hero text-foreground font-medium text-xs py-2 px-3.5 rounded-lg btn-press hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Income", value: summary.income, icon: TrendingUp, color: "text-cv-teal" },
          { label: "Expenses", value: summary.expense, icon: TrendingDown, color: "text-cv-coral" },
          { label: "Balance", value: summary.balance, icon: DollarSign, color: summary.balance >= 0 ? "text-cv-teal" : "text-cv-coral" },
        ].map((s) => (
          <div key={s.label} className="glass-panel rounded-2xl p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className={`text-lg font-bold font-mono-data ${s.color}`}>
              {s.label === "Expenses" ? "-" : ""}{s.label === "Balance" && s.value < 0 ? "-" : ""}₹{Math.abs(s.value).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Income / Expense Toggle */}
      <div className="flex rounded-xl bg-secondary p-1">
        {(["income", "expense"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all capitalize ${
              activeTab === tab
                ? tab === "income" ? "bg-cv-teal/20 text-cv-teal shadow-sm" : "bg-cv-coral/20 text-cv-coral shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            {tab === "income" ? <TrendingUp className="w-4 h-4 inline mr-1.5" /> : <TrendingDown className="w-4 h-4 inline mr-1.5" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Month Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary text-foreground" />
        {filterMonth && <button onClick={() => setFilterMonth("")} className="text-xs text-primary hover:underline">Clear</button>}
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="glass-panel rounded-2xl h-16 skeleton-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No {activeTab} transactions yet</p>
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="glass-panel rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-cv-teal/20" : "bg-cv-coral/20"}`}>
                {t.type === "income" ? <TrendingUp className="w-5 h-5 text-cv-teal" /> : <TrendingDown className="w-5 h-5 text-cv-coral" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.description || t.category}</p>
                <p className="text-xs text-muted-foreground">{t.category} · {new Date(t.date).toLocaleDateString()}</p>
              </div>
              <span className={`font-mono-data text-sm font-bold shrink-0 ${t.type === "income" ? "text-cv-teal" : "text-cv-coral"}`}>
                {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString()}
              </span>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-cv-coral hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Category Breakdown - Below transactions */}
      {categoryBreakdown.length > 0 && (
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-sm">Category Breakdown</h3>
          </div>
          <div className="space-y-2.5">
            {categoryBreakdown.map(([name, data]) => {
              const pct = totalFiltered > 0 ? ((data.amount / totalFiltered) * 100).toFixed(1) : "0";
              return (
                <div key={name} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-24 shrink-0">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">{name}</span>
                  </div>
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div className={`h-full rounded-full transition-all duration-500 ${data.type === "income" ? "bg-cv-teal" : "bg-cv-coral"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-xs font-mono-data w-20 text-right shrink-0 ${data.type === "income" ? "text-cv-teal" : "text-cv-coral"}`}>
                    ₹{data.amount.toLocaleString()} <span className="text-muted-foreground">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Transaction</DialogTitle>
            <DialogDescription>{editingId ? "Update this" : "Add a new"} income or expense entry.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex rounded-xl bg-secondary p-1">
              {(["income", "expense"] as const).map((t) => (
                <button key={t} type="button" onClick={() => { setType(t); setCategory(""); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${type === t ? (t === "income" ? "bg-cv-teal/20 text-cv-teal" : "bg-cv-coral/20 text-cv-coral") : "text-muted-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
            <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" required />
            <div className="space-y-2 relative" ref={categoryDropdownRef}>
              <p className="text-xs text-muted-foreground">Category *</p>
              <button type="button" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full flex items-center justify-between bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                <span className={category ? "text-foreground" : "text-muted-foreground"}>{category || "Select category"}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
                  {allCategories[type].map((c) => {
                    const isCustom = customCategories[type].includes(c);
                    const isEditing = editCategoryOld === c;
                    const isSelected = category === c;
                    return (
                      <div key={c} className={`group flex items-center gap-2 px-4 py-2.5 text-sm transition-colors border-b border-border/30 last:border-b-0 ${isSelected ? "bg-primary text-primary-foreground" : "text-popover-foreground hover:bg-accent"}`}>
                        {isEditing ? (
                          <>
                            <input value={editCategoryName} onChange={(e) => { e.stopPropagation(); setEditCategoryName(e.target.value); }} onClick={(e) => e.stopPropagation()} className="flex-1 bg-background border border-border rounded-lg px-3 py-1 text-xs text-foreground" autoFocus />
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleEditCategory(); }} className="text-xs px-2.5 py-1 rounded-lg bg-primary/20 text-primary font-medium">Save</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setEditCategoryOld(""); setEditCategoryName(""); }} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 cursor-pointer font-medium" onClick={() => { setCategory(c); setShowCategoryDropdown(false); }}>{c}</span>
                            {isCustom && (
                              <div className={`flex gap-1 shrink-0 ${isSelected ? "opacity-80" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setEditCategoryOld(c); setEditCategoryName(c); setManageCategoryType(type); }} className={`p-1 rounded-md ${isSelected ? "hover:bg-primary-foreground/20" : "hover:bg-primary/10 text-muted-foreground hover:text-primary"}`}><Edit3 className="w-3.5 h-3.5" /></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteCategoryName(c); setManageCategoryType(type); }} className={`p-1 rounded-md ${isSelected ? "hover:bg-primary-foreground/20" : "hover:bg-destructive/10 text-muted-foreground hover:text-cv-coral"}`}><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                  {/* Add custom category inside dropdown */}
                  <div className="px-3 py-2 border-t border-border/50">
                    {!showCategoryForm ? (
                      <button type="button" onClick={() => setShowCategoryForm(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add custom category
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground" autoFocus onClick={(e) => e.stopPropagation()} />
                        <button type="button" onClick={handleAddCategory} className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary font-medium">Add</button>
                        <button type="button" onClick={() => setShowCategoryForm(false)} className="text-xs px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground">✕</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
            <button type="submit" className="w-full gradient-hero text-foreground font-medium py-2.5 rounded-xl btn-press hover:opacity-90 transition-opacity">
              {editingId ? "Update" : "Add"} {type === "income" ? "Income" : "Expense"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Manager Dialog */}
      <Dialog open={showCategoryManager} onOpenChange={(open) => { if (!open) { setShowCategoryManager(false); setEditCategoryOld(""); setEditCategoryName(""); } }}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Custom Categories</DialogTitle>
            <DialogDescription>Edit or delete your custom categories.</DialogDescription>
          </DialogHeader>
          <div className="flex rounded-xl bg-secondary p-1 mb-4">
            {(["income", "expense"] as const).map((t) => (
              <button key={t} onClick={() => { setManageCategoryType(t); setEditCategoryOld(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${manageCategoryType === t ? "bg-primary/15 text-primary shadow-sm" : "text-muted-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
          {customCategories[manageCategoryType].length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No custom categories added for {manageCategoryType}</p>
          ) : (
            <div className="space-y-2">
              {customCategories[manageCategoryType].map((cat) => (
                <div key={cat} className="flex items-center gap-2 p-3 rounded-xl bg-secondary">
                  {editCategoryOld === cat ? (
                    <>
                      <input value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground" />
                      <button onClick={handleEditCategory} className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary">Save</button>
                      <button onClick={() => { setEditCategoryOld(""); setEditCategoryName(""); }} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="flex-1 text-sm">{cat}</span>
                      <button onClick={() => { setEditCategoryOld(cat); setEditCategoryName(cat); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteCategoryName(cat)} className="p-1.5 rounded-lg text-muted-foreground hover:text-cv-coral hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete transaction?" description="This transaction record will be permanently removed." />
      <DeleteConfirmDialog open={!!deleteCategoryName} onClose={() => setDeleteCategoryName(null)} onConfirm={handleDeleteCategory} title="Delete category?" description={`"${deleteCategoryName}" will be removed from custom categories.`} />
    </div>
  );
};

export default FinancePage;
