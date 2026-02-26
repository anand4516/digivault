import React, { useState } from "react";
import { BusinessCard } from "@/types/card";
import { X, Send } from "lucide-react";

interface Props {
  card: BusinessCard;
  onClose: () => void;
  userName?: string;
  userCompany?: string;
}

const EmailModal: React.FC<Props> = ({ card, onClose, userName = "", userCompany = "" }) => {
  const email = card.email?.[0] || "";
  const [subject, setSubject] = useState(`Great connecting with you, ${card.firstName || card.name}!`);
  const [body, setBody] = useState(
    `Hi ${card.firstName || card.name},\n\nIt was a pleasure meeting you. I'm ${userName} from ${userCompany}.\n\nI'd love to stay connected and explore how we might work together.\n\nBest regards,\n${userName}`
  );

  const handleSend = () => {
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_self");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel rounded-2xl w-full max-w-lg animate-fade-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-display font-semibold text-lg">Email to {card.firstName || card.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">To</label>
            <input value={email} readOnly className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-muted-foreground text-sm font-mono-data" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm" />
          </div>
          <button onClick={handleSend} disabled={!email} className="w-full gradient-hero text-foreground font-semibold py-3 rounded-xl btn-press hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Open in Mail Client
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
