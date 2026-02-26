import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCards } from "@/hooks/useCards";
import { useFinance } from "@/hooks/useFinance";
import { usePasswords } from "@/hooks/usePasswords";
import { useTodos } from "@/hooks/useTodos";
import { useWalletCards } from "@/hooks/useWalletCards";
import { useIdentityCards } from "@/hooks/useIdentityCards";
import { useBankDetails } from "@/hooks/useBankDetails";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, TrendingUp, TrendingDown, Calendar, ArrowRight, CreditCard, IdCard, Landmark,
  Briefcase, DollarSign, CheckSquare, KeyRound, BarChart3, Camera, Settings, SlidersHorizontal,
  Shield, PieChart,
} from "lucide-react";

type WidgetKey = "recentCards" | "financeSummary" | "topCategories" | "todoProgress" | "passwordSecurity" | "walletCards" | "identityDocs" | "bankAccounts";

const WIDGET_CONFIG: { key: WidgetKey; label: string; icon: React.ElementType }[] = [
  { key: "recentCards", label: "Added This Week", icon: Calendar },
  { key: "financeSummary", label: "Finance Summary", icon: DollarSign },
  { key: "topCategories", label: "Top Spending", icon: PieChart },
  { key: "todoProgress", label: "Todo Progress", icon: CheckSquare },
  { key: "passwordSecurity", label: "Password Security", icon: Shield },
  { key: "walletCards", label: "Wallet Cards", icon: CreditCard },
  { key: "identityDocs", label: "Identity Documents", icon: IdCard },
  { key: "bankAccounts", label: "Bank Accounts", icon: Landmark },
];

const defaultWidgets: Record<WidgetKey, boolean> = {
  recentCards: false, financeSummary: false,
  topCategories: false, todoProgress: false, passwordSecurity: false,
  walletCards: false, identityDocs: false, bankAccounts: false,
};

const getStoredWidgets = (uid: string): Record<WidgetKey, boolean> => {
  try {
    const stored = localStorage.getItem(`cv-dashboard-widgets-${uid}`);
    if (stored) return { ...defaultWidgets, ...JSON.parse(stored) };
  } catch {}
  return defaultWidgets;
};

const HomePage: React.FC = () => {
  const { user } = useAuth();
  
  const { cards } = useCards();
  const { transactions } = useFinance();
  const { passwords } = usePasswords();
  const { todos } = useTodos();
  const { cards: walletCards } = useWalletCards();
  const { cards: identityCards } = useIdentityCards();
  const { banks } = useBankDetails();
  const navigate = useNavigate();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<Record<WidgetKey, boolean>>(
    () => getStoredWidgets(user?.uid || "")
  );

  const toggleWidget = (key: WidgetKey) => {
    const updated = { ...visibleWidgets, [key]: !visibleWidgets[key] };
    setVisibleWidgets(updated);
    if (user) localStorage.setItem(`cv-dashboard-widgets-${user.uid}`, JSON.stringify(updated));
  };

  // --- Computed data ---

  const week = Date.now() - 7 * 86400000;
  const recentCards = useMemo(() => cards.filter((c) => new Date(c.createdAt).getTime() > week), [cards]);

  const finance = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const topCategories = useMemo(() => {
    const map: Record<string, { amount: number; type: string }> = {};
    transactions.forEach((t) => {
      if (!map[t.category]) map[t.category] = { amount: 0, type: t.type };
      map[t.category].amount += t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount).slice(0, 5);
  }, [transactions]);

  const todoStats = useMemo(() => {
    const done = todos.filter((t) => t.status === "done").length;
    return { total: todos.length, done, pending: todos.length - done };
  }, [todos]);

  const pwStats = useMemo(() => {
    let strong = 0, weak = 0;
    passwords.forEach((p) => {
      let s = 0;
      if (p.password.length >= 8) s++; if (p.password.length >= 12) s++;
      if (/[A-Z]/.test(p.password) && /[a-z]/.test(p.password)) s++;
      if (/\d/.test(p.password)) s++; if (/[^A-Za-z0-9]/.test(p.password)) s++;
      if (s >= 4) strong++; else if (s <= 2) weak++;
    });
    return { total: passwords.length, strong, weak, fair: passwords.length - strong - weak };
  }, [passwords]);

  const quickLinks = [
    { label: "Business Info", icon: Briefcase, to: "/businessinfo", color: "from-cv-violet to-primary" },
    { label: "Capture Card", icon: Camera, to: "/capture", color: "from-primary to-cv-violet" },
    { label: "My Cards", icon: CreditCard, to: "/wallet", color: "from-cv-teal to-accent" },
    { label: "Identity", icon: IdCard, to: "/identity", color: "from-accent to-cv-teal" },
    { label: "Bank Details", icon: Landmark, to: "/bank", color: "from-cv-amber to-cv-coral" },
    { label: "Finance", icon: DollarSign, to: "/finance", color: "from-cv-coral to-cv-amber" },
    { label: "Todos", icon: CheckSquare, to: "/todos", color: "from-cv-teal to-cv-violet" },
    { label: "Passwords", icon: KeyRound, to: "/passwords", color: "from-cv-violet to-cv-coral" },
    { label: "Analytics", icon: BarChart3, to: "/analytics", color: "from-primary to-cv-teal" },
    { label: "Settings", icon: Settings, to: "/settings", color: "from-muted-foreground to-secondary-foreground" },
  ];

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Your networking overview</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowWidgetPicker(!showWidgetPicker)}
            className={`p-2.5 rounded-xl border transition-colors ${
              showWidgetPicker ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
            title="Customize widgets"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          {showWidgetPicker && (
            <div className="absolute right-0 top-12 z-50 w-72 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-popover shadow-xl p-3 space-y-1.5 animate-fade-slide-up">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1 font-semibold mb-1">Dashboard Widgets</p>
              {WIDGET_CONFIG.map((w) => {
                const active = visibleWidgets[w.key];
                return (
                  <button
                    key={w.key}
                    onClick={() => toggleWidget(w.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      active ? "bg-primary/10 border border-primary/30" : "border border-transparent hover:bg-secondary"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active ? "bg-primary/20" : "bg-secondary"}`}>
                      <w.icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className={`flex-1 text-left font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>{w.label}</span>
                    <div className={`w-9 h-5 rounded-full relative transition-colors ${active ? "bg-primary" : "bg-secondary"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all ${active ? "left-[18px]" : "left-0.5"}`} />
                    </div>
                  </button>
                );
              })}
              <p className="text-[10px] text-muted-foreground px-1 pt-1">Toggle sections to customize your dashboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {quickLinks.map((link, i) => (
          <button key={link.to} onClick={() => navigate(link.to)}
            className="glass-panel rounded-2xl p-4 card-hover text-left group animate-fade-slide-up"
            style={{ animationDelay: `${i * 40}ms` }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-3`}>
              <link.icon className="w-5 h-5 text-foreground" />
            </div>
            <p className="text-sm font-medium flex items-center gap-1">
              {link.label}
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </button>
        ))}
      </div>

      {/* ===== WIDGETS ===== */}

      {/* Row: Finance Summary + Top Spending */}
      {(visibleWidgets.financeSummary || visibleWidgets.topCategories) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleWidgets.financeSummary && (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-cv-amber" />
                <h3 className="font-display font-semibold">Finance Summary</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Income", value: finance.income, color: "text-cv-teal", icon: TrendingUp },
                  { label: "Expenses", value: finance.expense, color: "text-cv-coral", icon: TrendingDown },
                  { label: "Balance", value: finance.balance, color: finance.balance >= 0 ? "text-cv-teal" : "text-cv-coral", icon: DollarSign },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-xl bg-secondary/50">
                    <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                    <p className={`text-sm font-bold font-mono-data ${s.color}`}>₹{Math.abs(s.value).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border flex justify-between text-sm">
                <span className="text-muted-foreground">Total Transactions</span>
                <span className="font-mono-data font-bold">{transactions.length}</span>
              </div>
            </div>
          )}
          {visibleWidgets.topCategories && (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold">Top Spending</h3>
              </div>
              {topCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {topCategories.map(([name, data]) => {
                    const total = topCategories.reduce((s, [, d]) => s + d.amount, 0);
                    const pct = total > 0 ? ((data.amount / total) * 100).toFixed(0) : "0";
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground truncate">{name}</span>
                          <span className={`font-mono-data text-xs ${data.type === "income" ? "text-cv-teal" : "text-cv-coral"}`}>₹{data.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className={`h-full rounded-full transition-all duration-500 ${data.type === "income" ? "bg-cv-teal" : "bg-cv-coral"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Row: Todo Progress + Password Security */}
      {(visibleWidgets.todoProgress || visibleWidgets.passwordSecurity) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleWidgets.todoProgress && (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare className="w-5 h-5 text-cv-amber" />
                <h3 className="font-display font-semibold">Todo Progress</h3>
              </div>
              {todoStats.total === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No todos yet</p>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--accent))" strokeWidth="3"
                        strokeDasharray={`${(todoStats.done / todoStats.total) * 97.4} 97.4`} strokeLinecap="round" className="transition-all duration-700" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold font-mono-data">{Math.round((todoStats.done / todoStats.total) * 100)}%</span>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Completed</span><span className="font-mono-data text-cv-teal">{todoStats.done}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pending</span><span className="font-mono-data text-cv-amber">{todoStats.pending}</span></div>
                    <div className="flex justify-between text-sm pt-2 border-t border-border"><span className="text-muted-foreground">Total</span><span className="font-mono-data font-bold">{todoStats.total}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
          {visibleWidgets.passwordSecurity && (
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-cv-teal" />
                <h3 className="font-display font-semibold">Password Security</h3>
              </div>
              {pwStats.total === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No passwords saved</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "Strong", value: pwStats.strong, color: "bg-cv-teal" },
                    { label: "Fair", value: pwStats.fair, color: "bg-cv-amber" },
                    { label: "Weak", value: pwStats.weak, color: "bg-cv-coral" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">{item.label}</span><span className="font-mono-data">{item.value}</span></div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pwStats.total ? (item.value / pwStats.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-border flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span><span className="font-mono-data font-bold">{pwStats.total}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Row: Wallet + Identity + Bank */}
      {(visibleWidgets.walletCards || visibleWidgets.identityDocs || visibleWidgets.bankAccounts) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visibleWidgets.walletCards && (
            <div className="glass-panel rounded-2xl p-6 cursor-pointer card-hover" onClick={() => navigate("/wallet")}>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-cv-teal" />
                <h3 className="font-display font-semibold text-sm">Wallet Cards</h3>
              </div>
              <p className="text-2xl font-bold font-mono-data">{walletCards.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Cards saved</p>
            </div>
          )}
          {visibleWidgets.identityDocs && (
            <div className="glass-panel rounded-2xl p-6 cursor-pointer card-hover" onClick={() => navigate("/identity")}>
              <div className="flex items-center gap-2 mb-3">
                <IdCard className="w-5 h-5 text-cv-amber" />
                <h3 className="font-display font-semibold text-sm">Identity Documents</h3>
              </div>
              <p className="text-2xl font-bold font-mono-data">{identityCards.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Documents saved</p>
            </div>
          )}
          {visibleWidgets.bankAccounts && (
            <div className="glass-panel rounded-2xl p-6 cursor-pointer card-hover" onClick={() => navigate("/bank")}>
              <div className="flex items-center gap-2 mb-3">
                <Landmark className="w-5 h-5 text-cv-coral" />
                <h3 className="font-display font-semibold text-sm">Bank Accounts</h3>
              </div>
              <p className="text-2xl font-bold font-mono-data">{banks.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Accounts saved</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Cards */}
      {visibleWidgets.recentCards && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cv-coral" />
              <h3 className="font-display font-semibold">Added This Week</h3>
            </div>
            <span className="text-sm font-mono-data text-muted-foreground">{recentCards.length} cards</span>
          </div>
          {recentCards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No cards added this week</p>
          ) : (
            <div className="space-y-2">
              {recentCards.slice(0, 5).map((card) => (
                <div key={card.id} onClick={() => navigate(`/card/${card.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
                  <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                    {(card.name?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{card.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{card.company || card.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono-data">{new Date(card.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
