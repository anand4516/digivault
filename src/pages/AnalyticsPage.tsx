import React, { useMemo } from "react";
import { useStats } from "@/hooks/useStats";
import { useCards } from "@/hooks/useCards";
import { useFinance } from "@/hooks/useFinance";
import { usePasswords } from "@/hooks/usePasswords";
import { useTodos } from "@/hooks/useTodos";
import { useWalletCards } from "@/hooks/useWalletCards";
import { useIdentityCards } from "@/hooks/useIdentityCards";
import { useBankDetails } from "@/hooks/useBankDetails";
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, KeyRound, CheckSquare,
  IdCard, Landmark, Shield, PieChart, Activity, CreditCard, AlertTriangle,
  Zap, Target, Clock, Calendar, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const AnalyticsPage: React.FC = () => {
  const stats = useStats();
  const { cards } = useCards();
  const { transactions } = useFinance();
  const { passwords } = usePasswords();
  const { todos } = useTodos();
  const { cards: walletCards } = useWalletCards();
  const { cards: identityCards } = useIdentityCards();
  const { banks } = useBankDetails();

  // ── Security Score ──
  const securityScore = useMemo(() => {
    let score = 0, max = 0;
    // Password strength
    max += passwords.length * 5;
    passwords.forEach((p) => {
      let s = 0;
      if (p.password.length >= 8) s++;
      if (p.password.length >= 12) s++;
      if (/[A-Z]/.test(p.password) && /[a-z]/.test(p.password)) s++;
      if (/\d/.test(p.password)) s++;
      if (/[^A-Za-z0-9]/.test(p.password)) s++;
      score += s;
    });
    // Bonus for having data secured
    if (walletCards.length > 0) { score += 10; max += 10; }
    if (identityCards.length > 0) { score += 10; max += 10; }
    if (banks.length > 0) { score += 10; max += 10; }
    if (passwords.length > 0) { score += 5; max += 5; }
    return max > 0 ? Math.min(Math.round((score / max) * 100), 100) : 0;
  }, [passwords, walletCards, identityCards, banks]);

  const securityGrade = securityScore >= 80 ? "A" : securityScore >= 60 ? "B" : securityScore >= 40 ? "C" : "D";
  const securityColor = securityScore >= 80 ? "text-cv-teal" : securityScore >= 60 ? "text-cv-amber" : "text-cv-coral";

  // ── Password breakdown ──
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

  // ── Finance ──
  const finance = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense, total: transactions.length };
  }, [transactions]);

  // ── Monthly trend (last 6 months) ──
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { income: 0, expense: 0 };
    }
    transactions.forEach((t) => {
      const key = t.date.substring(0, 7);
      if (months[key]) months[key][t.type] += t.amount;
    });
    return Object.entries(months).map(([month, data]) => ({
      month: new Date(month + "-01").toLocaleDateString("en", { month: "short" }),
      ...data,
      net: data.income - data.expense,
    }));
  }, [transactions]);
  const maxMonthly = Math.max(...monthlyTrend.map((m) => Math.max(m.income, m.expense)), 1);

  // ── Top categories ──
  const topCategories = useMemo(() => {
    const map: Record<string, { amount: number; type: string; count: number }> = {};
    transactions.forEach((t) => {
      if (!map[t.category]) map[t.category] = { amount: 0, type: t.type, count: 0 };
      map[t.category].amount += t.amount;
      map[t.category].count++;
    });
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount).slice(0, 6);
  }, [transactions]);
  const maxCatAmount = topCategories[0]?.[1]?.amount || 1;

  // ── Todo stats ──
  const todoStats = useMemo(() => {
    const done = todos.filter((t) => t.status === "done").length;
    return { total: todos.length, done, pending: todos.length - done, rate: todos.length > 0 ? Math.round((done / todos.length) * 100) : 0 };
  }, [todos]);

  // ── Data inventory ──
  const dataItems = [
    { label: "Business Cards", count: cards.length, icon: CreditCard, color: "from-cv-violet to-primary" },
    { label: "Wallet Cards", count: walletCards.length, icon: CreditCard, color: "from-cv-teal to-accent" },
    { label: "Identity Docs", count: identityCards.length, icon: IdCard, color: "from-cv-amber to-cv-coral" },
    { label: "Bank Accounts", count: banks.length, icon: Landmark, color: "from-primary to-cv-violet" },
    { label: "Passwords", count: passwords.length, icon: KeyRound, color: "from-cv-coral to-cv-amber" },
    { label: "Transactions", count: transactions.length, icon: DollarSign, color: "from-cv-teal to-cv-violet" },
    { label: "Todos", count: todos.length, icon: CheckSquare, color: "from-cv-amber to-primary" },
  ];
  const totalItems = dataItems.reduce((s, d) => s + d.count, 0);

  // ── Recent activity (last 7 days) ──
  const week = Date.now() - 7 * 86400000;
  const recentCards = useMemo(() => cards.filter((c) => new Date(c.createdAt).getTime() > week).length, [cards]);
  const recentTransactions = useMemo(() => transactions.filter((t) => new Date(t.createdAt).getTime() > week).length, [transactions]);

  // ── Insights ──
  const insights = useMemo(() => {
    const list: { text: string; type: "warning" | "success" | "info" }[] = [];
    if (pwStats.weak > 0) list.push({ text: `${pwStats.weak} password${pwStats.weak > 1 ? "s are" : " is"} weak — consider updating`, type: "warning" });
    if (pwStats.strong === pwStats.total && pwStats.total > 0) list.push({ text: "All passwords are strong — great security!", type: "success" });
    if (finance.expense > finance.income && finance.total > 0) list.push({ text: "Expenses exceed income this period", type: "warning" });
    if (finance.balance > 0 && finance.total > 0) list.push({ text: `Net savings: ₹${finance.balance.toLocaleString()}`, type: "success" });
    if (todoStats.rate >= 80 && todoStats.total > 3) list.push({ text: `${todoStats.rate}% task completion — excellent productivity!`, type: "success" });
    if (todoStats.pending > 5) list.push({ text: `${todoStats.pending} pending tasks need attention`, type: "info" });
    if (recentCards > 0) list.push({ text: `${recentCards} new card${recentCards > 1 ? "s" : ""} added this week`, type: "info" });
    if (list.length === 0) list.push({ text: "Start adding data to unlock insights", type: "info" });
    return list.slice(0, 5);
  }, [pwStats, finance, todoStats, recentCards]);

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Advanced insights across your data</p>
        </div>
      </div>

      {/* ── Row 1: Security Score + Smart Insights ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Security Score */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-cv-teal" />
            <h3 className="font-display font-semibold">Security Score</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke={securityScore >= 80 ? "hsl(var(--accent))" : securityScore >= 60 ? "hsl(40 90% 55%)" : "hsl(0 80% 60%)"} strokeWidth="3"
                  strokeDasharray={`${(securityScore / 100) * 97.4} 97.4`} strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold font-mono-data ${securityColor}`}>{securityGrade}</span>
                <span className="text-[10px] text-muted-foreground">{securityScore}%</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {[
                { label: "Strong passwords", value: pwStats.strong, color: "bg-cv-teal" },
                { label: "Fair passwords", value: pwStats.fair, color: "bg-cv-amber" },
                { label: "Weak passwords", value: pwStats.weak, color: "bg-cv-coral" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono-data">{item.value}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pwStats.total ? (item.value / pwStats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Insights */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-cv-amber" />
            <h3 className="font-display font-semibold">Smart Insights</h3>
          </div>
          <div className="space-y-2.5">
            {insights.map((insight, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl text-sm ${
                insight.type === "warning" ? "bg-cv-coral/10" : insight.type === "success" ? "bg-cv-teal/10" : "bg-secondary/50"
              }`}>
                {insight.type === "warning" ? <AlertTriangle className="w-4 h-4 text-cv-coral shrink-0 mt-0.5" /> :
                 insight.type === "success" ? <Target className="w-4 h-4 text-cv-teal shrink-0 mt-0.5" /> :
                 <Activity className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                <span className="text-muted-foreground">{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Financial Trend Chart ── */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Financial Trend</h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-cv-teal/70" /><span className="text-muted-foreground">Income</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-cv-coral/70" /><span className="text-muted-foreground">Expense</span></div>
          </div>
        </div>
        {finance.total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Add transactions to see trends</p>
        ) : (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Total Income", value: finance.income, icon: ArrowUpRight, color: "text-cv-teal" },
                { label: "Total Expenses", value: finance.expense, icon: ArrowDownRight, color: "text-cv-coral" },
                { label: "Net Balance", value: finance.balance, icon: DollarSign, color: finance.balance >= 0 ? "text-cv-teal" : "text-cv-coral" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-secondary/50 text-center">
                  <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                  <p className={`text-sm font-bold font-mono-data ${s.color}`}>₹{Math.abs(s.value).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Bar chart */}
            <div className="flex items-end gap-2 h-32">
              {monthlyTrend.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end" style={{ height: "100px" }}>
                    <div className="flex-1 bg-cv-teal/60 rounded-t transition-all duration-500"
                      style={{ height: `${(m.income / maxMonthly) * 100}%`, minHeight: m.income > 0 ? "4px" : "0" }} />
                    <div className="flex-1 bg-cv-coral/60 rounded-t transition-all duration-500"
                      style={{ height: `${(m.expense / maxMonthly) * 100}%`, minHeight: m.expense > 0 ? "4px" : "0" }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.month}</span>
                  <span className={`text-[9px] font-mono-data ${m.net >= 0 ? "text-cv-teal" : "text-cv-coral"}`}>
                    {m.net >= 0 ? "+" : ""}₹{Math.abs(m.net).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Row 3: Spending Categories + Todo Productivity ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categories */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Spending by Category</h3>
          </div>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map(([name, data]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground truncate flex-1">{name}</span>
                    <span className="text-[10px] text-muted-foreground mr-2">{data.count} txns</span>
                    <span className={`font-mono-data text-xs ${data.type === "income" ? "text-cv-teal" : "text-cv-coral"}`}>
                      ₹{data.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className={`h-full rounded-full transition-all duration-500 ${data.type === "income" ? "bg-cv-teal" : "bg-cv-coral"}`}
                      style={{ width: `${(data.amount / maxCatAmount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Todo Productivity */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-cv-amber" />
            <h3 className="font-display font-semibold">Task Productivity</h3>
          </div>
          {todoStats.total === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--accent))" strokeWidth="3"
                      strokeDasharray={`${(todoStats.done / todoStats.total) * 97.4} 97.4`}
                      strokeLinecap="round" className="transition-all duration-700" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold font-mono-data">{todoStats.rate}%</span>
                    <span className="text-[9px] text-muted-foreground">done</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-mono-data text-cv-teal">{todoStats.done}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-mono-data text-cv-amber">{todoStats.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-mono-data font-bold">{todoStats.total}</span>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Completion rate</span>
                  <span className={`font-mono-data ${todoStats.rate >= 70 ? "text-cv-teal" : todoStats.rate >= 40 ? "text-cv-amber" : "text-cv-coral"}`}>{todoStats.rate}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className={`h-full rounded-full transition-all duration-700 ${todoStats.rate >= 70 ? "bg-cv-teal" : todoStats.rate >= 40 ? "bg-cv-amber" : "bg-cv-coral"}`}
                    style={{ width: `${todoStats.rate}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Data Inventory ── */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cv-violet" />
            <h3 className="font-display font-semibold">Data Inventory</h3>
          </div>
          <span className="text-sm font-mono-data text-muted-foreground">{totalItems} total items</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {dataItems.map((item, i) => (
            <div key={item.label} className="p-3 rounded-xl bg-secondary/50 animate-fade-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-3.5 h-3.5 text-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <p className="text-xl font-bold font-mono-data">{item.count}</p>
              {totalItems > 0 && (
                <div className="mt-1.5 w-full bg-secondary rounded-full h-1">
                  <div className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                    style={{ width: `${(item.count / totalItems) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 5: Weekly Snapshot ── */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-cv-coral" />
          <h3 className="font-display font-semibold">This Week's Activity</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "New Cards", value: recentCards, icon: CreditCard },
            { label: "Transactions", value: recentTransactions, icon: DollarSign },
            { label: "Tasks Done", value: todoStats.done, icon: CheckSquare },
            { label: "Total Actions", value: stats.callsMade + stats.whatsappSent + stats.emailsSent, icon: Activity },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-secondary/50 text-center">
              <item.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold font-mono-data">{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
