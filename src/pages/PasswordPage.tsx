import React, { useState, useMemo, useRef, useEffect } from "react";
import { usePasswords } from "@/hooks/usePasswords";
import { PasswordEntry, DEFAULT_PASSWORD_CATEGORIES } from "@/types/password";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  KeyRound, Plus, Search, Eye, EyeOff, Copy, Edit3, Trash2, Globe, User, Lock, Shield, ExternalLink,
  Wand2, Settings, Tag, X, RefreshCw, Minus, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

const generatePassword = (length = 16, options = { upper: true, lower: true, numbers: true, symbols: true }) => {
  let chars = "";
  if (options.lower) chars += "abcdefghijklmnopqrstuvwxyz";
  if (options.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.numbers) chars += "0123456789";
  if (options.symbols) chars += "!@#$%^&*()_+-=";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const getStrength = (pw: string): { label: string; color: string; percent: number } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-cv-coral", percent: 20 };
  if (score <= 2) return { label: "Fair", color: "bg-cv-amber", percent: 40 };
  if (score <= 3) return { label: "Good", color: "bg-cv-amber", percent: 60 };
  if (score <= 4) return { label: "Strong", color: "bg-cv-teal", percent: 80 };
  return { label: "Very Strong", color: "bg-cv-teal", percent: 100 };
};

type PageView = "manager" | "generator";

const PasswordPage: React.FC = () => {
  const { passwords, loading, addPassword, updatePassword, deletePassword } = usePasswords();
  const [pageView, setPageView] = useState<PageView>("manager");

  // Manager state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Custom categories
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const stored = localStorage.getItem("cv-password-categories");
    return stored ? JSON.parse(stored) : [];
  });
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryOld, setEditCategoryOld] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [deleteCategoryName, setDeleteCategoryName] = useState<string | null>(null);
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

  // Generator state
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [generatedPw, setGeneratedPw] = useState("");

  const allCategories = useMemo(() => [...DEFAULT_PASSWORD_CATEGORIES, ...customCategories], [customCategories]);

  const saveCustomCategories = (cats: string[]) => {
    setCustomCategories(cats);
    localStorage.setItem("cv-password-categories", JSON.stringify(cats));
  };

  const filtered = useMemo(() => {
    let result = passwords;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.siteName.toLowerCase().includes(q) || p.username.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    if (filterCategory !== "all") result = result.filter((p) => p.category === filterCategory);
    return result;
  }, [passwords, search, filterCategory]);

  const resetForm = () => {
    setSiteName(""); setSiteUrl(""); setUsername(""); setPassword(""); setCategory(""); setNotes(""); setEditingId(null); setShowFormPassword(false);
  };

  const openEdit = (p: PasswordEntry) => {
    setSiteName(p.siteName); setSiteUrl(p.siteUrl || ""); setUsername(p.username);
    setPassword(p.password); setCategory(p.category || ""); setNotes(p.notes || "");
    setEditingId(p.id); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim() || !username.trim() || !password) { toast.error("Fill required fields"); return; }
    const data = { siteName: siteName.trim(), siteUrl, username: username.trim(), password, category, notes };
    if (editingId) {
      await updatePassword(editingId, data);
      toast.success("Updated");
    } else {
      await addPassword(data);
      toast.success("Password saved");
    }
    resetForm(); setShowForm(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const toggleVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (deleteId) { await deletePassword(deleteId); toast.success("Deleted"); setDeleteId(null); }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (allCategories.includes(newCategoryName.trim())) { toast.error("Category exists"); return; }
    saveCustomCategories([...customCategories, newCategoryName.trim()]);
    toast.success("Category added");
    setNewCategoryName("");
  };

  const handleEditCategory = () => {
    if (!editCategoryName.trim() || !editCategoryOld) return;
    saveCustomCategories(customCategories.map((c) => c === editCategoryOld ? editCategoryName.trim() : c));
    toast.success("Category renamed");
    setEditCategoryOld(""); setEditCategoryName("");
  };

  const handleDeleteCategory = () => {
    if (deleteCategoryName) {
      saveCustomCategories(customCategories.filter((c) => c !== deleteCategoryName));
      toast.success("Category deleted");
      setDeleteCategoryName(null);
    }
  };

  const handleGenerate = () => {
    setGeneratedPw(generatePassword(genLength, { upper: genUpper, lower: genLower, numbers: genNumbers, symbols: genSymbols }));
  };

  const strength = getStrength(password);
  const genStrength = getStrength(generatedPw);

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Passwords</h1>
            <p className="text-sm text-muted-foreground">{passwords.length} saved</p>
          </div>
        </div>
        {pageView === "manager" && (
          <div className="flex gap-2">
            <button onClick={() => setShowCategoryManager(true)} className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-hero text-foreground font-medium text-xs py-2 px-3.5 rounded-lg btn-press hover:opacity-90 transition-opacity flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        )}
      </div>

      {/* Manager / Generator Toggle */}
      <div className="flex rounded-xl bg-secondary p-1">
        {([
          { key: "manager" as PageView, label: "Password Manager", icon: Lock },
          { key: "generator" as PageView, label: "Generator", icon: Wand2 },
        ]).map((tab) => (
          <button key={tab.key} onClick={() => setPageView(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              pageView === tab.key ? "bg-primary/15 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {pageView === "generator" ? (
        /* ===== GENERATOR VIEW ===== */
        <div className="space-y-5">
          <div className="glass-panel rounded-2xl p-6 space-y-5">
            <h3 className="font-display font-semibold text-sm">Generate Secure Password</h3>

            {/* Generated password display */}
            <div className="bg-secondary rounded-xl p-4 flex items-center gap-3">
              <span className="flex-1 font-mono-data text-sm break-all min-h-[1.5rem]">
                {generatedPw || "Click generate to create a password"}
              </span>
              {generatedPw && (
                <button onClick={() => copyToClipboard(generatedPw, "Password")} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors shrink-0">
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Strength meter */}
            {generatedPw && (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div className={`h-full rounded-full ${genStrength.color} transition-all`} style={{ width: `${genStrength.percent}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{genStrength.label}</span>
              </div>
            )}

            {/* Length slider */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Length</span>
                <span className="font-mono-data text-primary">{genLength}</span>
              </div>
              <input type="range" min={6} max={64} value={genLength} onChange={(e) => setGenLength(Number(e.target.value))}
                className="w-full accent-primary" />
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Uppercase (A-Z)", checked: genUpper, set: setGenUpper },
                { label: "Lowercase (a-z)", checked: genLower, set: setGenLower },
                { label: "Numbers (0-9)", checked: genNumbers, set: setGenNumbers },
                { label: "Symbols (!@#)", checked: genSymbols, set: setGenSymbols },
              ].map((opt) => (
                <label key={opt.label} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={opt.checked} onChange={(e) => opt.set(e.target.checked)}
                    className="rounded border-border accent-primary w-4 h-4" />
                  <span className="text-muted-foreground">{opt.label}</span>
                </label>
              ))}
            </div>

            <button onClick={handleGenerate} className="w-full gradient-hero text-foreground font-medium py-2.5 rounded-xl btn-press hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Generate Password
            </button>
          </div>
        </div>
      ) : (
        /* ===== MANAGER VIEW ===== */
        <>
          {/* Security Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: passwords.length, icon: Lock, color: "text-primary" },
              { label: "Strong", value: passwords.filter((p) => getStrength(p.password).percent >= 80).length, icon: Shield, color: "text-cv-teal" },
              { label: "Weak", value: passwords.filter((p) => getStrength(p.password).percent <= 40).length, icon: Shield, color: "text-cv-coral" },
            ].map((s) => (
              <div key={s.label} className="glass-panel rounded-2xl p-4">
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className={`text-lg font-bold font-mono-data ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search passwords..." className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="text-sm px-4 py-2.5 rounded-xl border border-border bg-secondary text-foreground">
              <option value="all">All Categories</option>
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Password List */}
          <div className="space-y-2">
            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="glass-panel rounded-2xl h-20 skeleton-pulse" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <KeyRound className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{passwords.length === 0 ? "No passwords saved" : "No matching passwords"}</p>
              </div>
            ) : (
              filtered.map((p) => {
                const visible = visiblePasswords.has(p.id);
                const pwStrength = getStrength(p.password);
                return (
                  <div key={p.id} className="glass-panel rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{p.siteName}</p>
                          {p.siteUrl && (
                            <a href={p.siteUrl.startsWith("http") ? p.siteUrl : `https://${p.siteUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {p.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p.category}</span>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-cv-coral hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="space-y-2 ml-[52px]">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground flex-1 truncate font-mono-data">{p.username}</span>
                        <button onClick={() => copyToClipboard(p.username, "Username")} className="p-1 rounded text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground flex-1 truncate font-mono-data">
                          {visible ? p.password : "••••••••••••"}
                        </span>
                        <button onClick={() => toggleVisibility(p.id)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                          {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button onClick={() => copyToClipboard(p.password, "Password")} className="p-1 rounded text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-1.5">
                          <div className={`h-full rounded-full ${pwStrength.color} transition-all`} style={{ width: `${pwStrength.percent}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{pwStrength.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Password</DialogTitle>
            <DialogDescription>Save your credentials securely.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input placeholder="Site Name *" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" required />
            <input placeholder="URL (optional)" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input placeholder="Username / Email *" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" required />
            <div>
              <div className="relative">
                <input type={showFormPassword ? "text" : "password"} placeholder="Password *" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" required />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button type="button" onClick={() => setShowFormPassword(!showFormPassword)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                    {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => setPassword(generatePassword())} className="text-xs text-primary hover:underline mt-1 flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> Generate strong password
              </button>
              {password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-secondary rounded-full h-1.5">
                    <div className={`h-full rounded-full ${strength.color} transition-all`} style={{ width: `${strength.percent}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{strength.label}</span>
                </div>
              )}
            </div>
            <div className="space-y-2 relative" ref={categoryDropdownRef}>
              <p className="text-xs text-muted-foreground">Category</p>
              <button type="button" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full flex items-center justify-between bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                <span className={category ? "text-foreground" : "text-muted-foreground"}>{category || "Select category"}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
                  <div className={`px-4 py-2.5 text-sm cursor-pointer transition-colors border-b border-border/30 font-medium ${category === "" ? "bg-primary text-primary-foreground" : "text-popover-foreground hover:bg-accent"}`} onClick={() => { setCategory(""); setShowCategoryDropdown(false); }}>
                    No category
                  </div>
                  {allCategories.map((c) => {
                    const isCustom = customCategories.includes(c);
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
                                <button type="button" onClick={(e) => { e.stopPropagation(); setEditCategoryOld(c); setEditCategoryName(c); }} className={`p-1 rounded-md ${isSelected ? "hover:bg-primary-foreground/20" : "hover:bg-primary/10 text-muted-foreground hover:text-primary"}`}><Edit3 className="w-3.5 h-3.5" /></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteCategoryName(c); }} className={`p-1 rounded-md ${isSelected ? "hover:bg-primary-foreground/20" : "hover:bg-destructive/10 text-muted-foreground hover:text-cv-coral"}`}><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                  {/* Add custom category inside dropdown */}
                  <div className="px-3 py-2 border-t border-border/50">
                    <div className="flex gap-2">
                      <input placeholder="Add custom category" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground" onClick={(e) => e.stopPropagation()} />
                      <button type="button" onClick={handleAddCategory} className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary font-medium">Add</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none" />
            <button type="submit" className="w-full gradient-hero text-foreground font-medium py-2.5 rounded-xl btn-press hover:opacity-90 transition-opacity">
              {editingId ? "Update" : "Save"} Password
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Manager Dialog */}
      <Dialog open={showCategoryManager} onOpenChange={(open) => { if (!open) { setShowCategoryManager(false); setEditCategoryOld(""); setEditCategoryName(""); } }}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>Add, edit, or delete custom categories.</DialogDescription>
          </DialogHeader>
          {/* Add new */}
          <div className="flex gap-2 mb-4">
            <input placeholder="New category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <button onClick={handleAddCategory} className="px-4 py-2.5 rounded-xl bg-primary/20 text-primary text-sm font-medium">Add</button>
          </div>
          {/* Default (read-only) */}
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-2">Default Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_PASSWORD_CATEGORIES.map((c) => (
                <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">{c}</span>
              ))}
            </div>
          </div>
          {/* Custom (editable) */}
          {customCategories.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Custom Categories</p>
              <div className="space-y-2">
                {customCategories.map((cat) => (
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete password?" description="This password entry will be permanently removed." />
      <DeleteConfirmDialog open={!!deleteCategoryName} onClose={() => setDeleteCategoryName(null)} onConfirm={handleDeleteCategory} title="Delete category?" description={`"${deleteCategoryName}" will be removed.`} />
    </div>
  );
};

export default PasswordPage;
