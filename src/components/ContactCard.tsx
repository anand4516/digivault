import React from "react";
import { BusinessCard, INDUSTRY_COLORS } from "@/types/card";
import {
  Star,
  Phone,
  MessageCircle,
  Mail,
  MoreHorizontal,
  MapPin,
  Globe,
  Building,
} from "lucide-react";

interface Props {
  card: BusinessCard;
  onToggleFavorite: (id: string, current: boolean) => void;
  onClick: (card: BusinessCard) => void;
  onCall: (card: BusinessCard) => void;
  onWhatsApp: (card: BusinessCard) => void;
  onEmail: (card: BusinessCard) => void;
}

const ContactCard: React.FC<Props> = ({ card, onToggleFavorite, onClick, onCall, onWhatsApp, onEmail }) => {
  const industryClass = INDUSTRY_COLORS[card.industry] || INDUSTRY_COLORS.Other;
  const initials = (card.firstName?.[0] || "") + (card.lastName?.[0] || "") || card.name?.[0] || "?";

  return (
    <div
      className="glass-panel rounded-2xl overflow-hidden card-hover cursor-pointer group relative"
      onClick={() => onClick(card)}
    >
      {/* Card image strip */}
      {card.cardFrontUrl && (
        <div className="h-28 overflow-hidden relative">
          <img src={card.cardFrontUrl} alt="Card" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
        </div>
      )}

      <div className={`p-5 ${!card.cardFrontUrl ? "pt-5" : "-mt-8 relative"}`}>
        {/* Top row: industry + favorite */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${industryClass}`}>
            {card.industry || "Other"}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(card.id, card.favorite); }}
            className="transition-colors"
          >
            <Star className={`w-4 h-4 ${card.favorite ? "fill-cv-amber text-cv-amber" : "text-muted-foreground hover:text-cv-amber"}`} />
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-foreground shrink-0"
            style={{ background: card.cardColor ? `${card.cardColor}40` : "hsl(var(--primary) / 0.3)" }}
          >
            {initials.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-foreground truncate">{card.name}</h3>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Building className="w-3 h-3 shrink-0" />
              {card.title}{card.title && card.company ? " · " : ""}{card.company}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
          {card.phone?.[0] && (
            <p className="flex items-center gap-2 truncate font-mono-data text-xs">
              <Phone className="w-3.5 h-3.5 shrink-0 text-cv-teal" />
              {card.phone[0]}
            </p>
          )}
          {card.website?.[0] && (
            <p className="flex items-center gap-2 truncate text-xs">
              <Globe className="w-3.5 h-3.5 shrink-0 text-primary" />
              {card.website[0]}
            </p>
          )}
          {card.address?.city && (
            <p className="flex items-center gap-2 truncate text-xs">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-cv-coral" />
              {[card.address.city, card.address.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 pt-3 border-t border-border">
          <button
            onClick={(e) => { e.stopPropagation(); onCall(card); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-cv-teal hover:bg-cv-teal/10 transition-colors btn-press"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onWhatsApp(card); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-cv-teal hover:bg-cv-teal/10 transition-colors btn-press"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WA
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEmail(card); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors btn-press"
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactCard;
