import React, { useState } from "react";
import { BusinessCard } from "@/types/card";
import { X, Send } from "lucide-react";

interface Props {
  card: BusinessCard;
  onClose: () => void;
  userName?: string;
  userCompany?: string;
}

const templates = [
  { label: "👋 Introduction", id: "intro" },
  { label: "🤝 Follow-up", id: "followup" },
  { label: "🎯 Service Pitch", id: "pitch" },
  { label: "🎉 Festival Greeting", id: "festival" },
  { label: "🚀 Product Promo", id: "promo" },
  { label: "💼 Partnership", id: "partnership" },
  { label: "✏️ Custom", id: "custom" },
];

const getTemplate = (id: string, card: BusinessCard, userName: string, userCompany: string) => {
  const name = card.firstName || card.name;
  const m: Record<string, string> = {
    intro: `Hi ${name}! 👋 It was a pleasure meeting you. I'm ${userName} from ${userCompany}. I'd love to stay connected and explore how we can work together!`,
    followup: `Hi ${name}, following up from our recent meeting. Do you have 15 minutes this week to discuss further? Looking forward to connecting!`,
    pitch: `Hi ${name}! 🌟 I wanted to share how our services at ${userCompany} could benefit ${card.company}. Would love to tell you more!`,
    festival: `Hi ${name}! 🎉 Wishing you and your team a wonderful season! May this bring success and joy to ${card.company}!`,
    promo: `Hi ${name}! 🚀 Exciting news from ${userCompany}! Given your work at ${card.company}, I thought you'd find this valuable. Can I share more details?`,
    partnership: `Hi ${name}! 🤝 I believe there's great synergy between ${card.company} and ${userCompany}. I'd love to explore a potential collaboration. Are you open to a call?`,
    custom: "",
  };
  return m[id] || "";
};

const WhatsAppModal: React.FC<Props> = ({ card, onClose, userName = "there", userCompany = "our company" }) => {
  const [selectedTemplate, setSelectedTemplate] = useState("intro");
  const [message, setMessage] = useState(getTemplate("intro", card, userName, userCompany));
  const phone = card.whatsapp || card.phone?.[0] || "";

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(id);
    setMessage(getTemplate(id, card, userName, userCompany));
  };

  const handleSend = () => {
    const cleanPhone = phone.replace(/[^0-9+]/g, "").replace("+", "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-display font-semibold text-lg">WhatsApp to {card.firstName || card.name}</h3>
            <p className="text-sm text-muted-foreground font-mono-data">{phone}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Template</label>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors btn-press ${
                    selectedTemplate === t.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!phone || !message}
            className="w-full gradient-hero text-foreground font-semibold py-3 rounded-xl btn-press hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;
