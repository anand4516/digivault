import React, { useEffect, useState } from "react";
import { useStats } from "@/hooks/useStats";
import { CreditCard, Phone, MessageCircle, Mail, TrendingUp } from "lucide-react";

const statConfig = [
  { key: "totalCards" as const, label: "Total Cards", icon: CreditCard, color: "from-cv-violet to-primary" },
  { key: "callsMade" as const, label: "Calls Made", icon: Phone, color: "from-cv-teal to-accent" },
  { key: "whatsappSent" as const, label: "WhatsApp Sent", icon: MessageCircle, color: "from-cv-teal to-cv-violet" },
  { key: "emailsSent" as const, label: "Emails Sent", icon: Mail, color: "from-cv-amber to-cv-coral" },
];

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span className="font-mono-data">{display}</span>;
};

const StatsCards: React.FC = () => {
  const stats = useStats();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statConfig.map((s, i) => (
        <div
          key={s.key}
          className="glass-panel rounded-xl p-3 card-hover animate-fade-slide-up"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
              <s.icon className="w-4 h-4 text-foreground" />
            </div>
            <TrendingUp className="w-3.5 h-3.5 text-cv-teal" />
          </div>
          <p className="text-lg font-bold">
            <AnimatedNumber value={stats[s.key]} />
          </p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
