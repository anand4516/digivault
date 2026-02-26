import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCards } from "@/hooks/useCards";
import WhatsAppModal from "@/components/WhatsAppModal";
import EmailModal from "@/components/EmailModal";
import { BusinessCard, INDUSTRY_COLORS } from "@/types/card";
import {
  ArrowLeft, Star, Phone, MessageCircle, Mail, MessageSquare,
  Share2, FileDown, Edit, Trash2, Globe, MapPin, Linkedin,
  Twitter, Instagram, Building, Briefcase, Tag, Clock, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const CardDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cards, toggleFavorite, removeCard } = useCards();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [showWA, setShowWA] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const found = cards.find((c) => c.id === id);
    if (found) setCard(found);
  }, [cards, id]);

  if (!card) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="skeleton-pulse w-full max-w-2xl h-96 rounded-2xl" />
      </div>
    );
  }

  const industryClass = INDUSTRY_COLORS[card.industry] || INDUSTRY_COLORS.Other;
  const initials = (card.firstName?.[0] || "") + (card.lastName?.[0] || "") || card.name?.[0] || "?";

  const handleCall = () => {
    const phone = card.phone?.[0];
    if (phone) { window.open(`tel:${phone}`); toast.success(`Opening dialer for ${card.name}`); }
    else toast.error("No phone number");
  };

  const handleSMS = () => {
    const phone = card.phone?.[0];
    if (phone) window.open(`sms:${phone}`);
    else toast.error("No phone number");
  };

  const handleShare = async () => {
    const text = `${card.name}\n${card.title} at ${card.company}\n${card.phone?.[0] || ""}\n${card.email?.[0] || ""}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Contact info copied!");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleDelete = async () => {
    await removeCard(card.id);
    toast.success("Card deleted");
    navigate("/businessinfo");
  };

  const actions = [
    { icon: Phone, label: "Call", color: "text-cv-teal", onClick: handleCall },
    { icon: MessageCircle, label: "WhatsApp", color: "text-cv-teal", onClick: () => setShowWA(true) },
    { icon: Mail, label: "Email", color: "text-primary", onClick: () => setShowEmail(true) },
    { icon: MessageSquare, label: "SMS", color: "text-cv-amber", onClick: handleSMS },
    { icon: Share2, label: "Share", color: "text-foreground", onClick: handleShare },
  ];

  return (
    <div className="max-w-3xl mx-auto animate-fade-slide-up">
      {/* Back button */}
      <button onClick={() => navigate("/businessinfo")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Business Info
      </button>

      {/* Banner */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden mb-6"
        style={{ background: card.cardColor ? `linear-gradient(135deg, ${card.cardColor}40, ${card.cardColor}10)` : "hsl(var(--primary) / 0.15)" }}
      >
        {card.cardFrontUrl && (
          <img src={card.cardFrontUrl} alt="Card" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        )}
        <div className="relative flex items-start gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-2xl text-foreground shrink-0"
            style={{ background: card.cardColor ? `${card.cardColor}60` : "hsl(var(--primary) / 0.3)" }}
          >
            {initials.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-2xl font-bold truncate">{card.name}</h1>
              <button onClick={() => toggleFavorite(card.id, card.favorite)}>
                <Star className={`w-5 h-5 ${card.favorite ? "fill-cv-amber text-cv-amber" : "text-muted-foreground hover:text-cv-amber"}`} />
              </button>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 shrink-0" />
              {card.title}{card.title && card.company ? " at " : ""}{card.company}
            </p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${industryClass}`}>{card.industry || "Other"}</span>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Added {new Date(card.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="glass-panel rounded-xl p-4 text-center card-hover btn-press"
          >
            <a.icon className={`w-5 h-5 mx-auto mb-1.5 ${a.color}`} />
            <span className="text-xs font-medium">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Contact info */}
      <div className="glass-panel rounded-2xl p-6 space-y-5 mb-6">
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">Contact Information</h3>

        {card.phone?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone</p>
            {card.phone.map((p, i) => (
              <a key={i} href={`tel:${p}`} className="block text-sm font-mono-data text-foreground hover:text-primary">{p}</a>
            ))}
          </div>
        )}

        {card.email?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</p>
            {card.email.map((e, i) => (
              <a key={i} href={`mailto:${e}`} className="block text-sm font-mono-data text-foreground hover:text-primary">{e}</a>
            ))}
          </div>
        )}

        {card.website?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Website</p>
            {card.website.map((w, i) => (
              <a key={i} href={w} target="_blank" className="block text-sm text-foreground hover:text-primary flex items-center gap-1">{w} <ExternalLink className="w-3 h-3" /></a>
            ))}
          </div>
        )}

        {card.address?.full && (
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1"><MapPin className="w-3.5 h-3.5" /> Address</p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(card.address.full)}`}
              target="_blank"
              className="text-sm text-foreground hover:text-primary flex items-center gap-1"
            >
              {card.address.full} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {(card.social?.linkedin || card.social?.twitter || card.social?.instagram) && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Social</p>
            <div className="flex gap-3">
              {card.social.linkedin && <a href={card.social.linkedin.startsWith("http") ? card.social.linkedin : `https://linkedin.com/in/${card.social.linkedin}`} target="_blank" className="text-muted-foreground hover:text-primary"><Linkedin className="w-5 h-5" /></a>}
              {card.social.twitter && <a href={`https://twitter.com/${card.social.twitter}`} target="_blank" className="text-muted-foreground hover:text-primary"><Twitter className="w-5 h-5" /></a>}
              {card.social.instagram && <a href={`https://instagram.com/${card.social.instagram}`} target="_blank" className="text-muted-foreground hover:text-primary"><Instagram className="w-5 h-5" /></a>}
            </div>
          </div>
        )}

        {card.tagline && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tagline</p>
            <p className="text-sm italic text-foreground">"{card.tagline}"</p>
          </div>
        )}

        {card.services?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {card.services.map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">{s}</span>
              ))}
            </div>
          </div>
        )}

        {card.tags?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mb-2"><Tag className="w-3.5 h-3.5" /> Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((t, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">{t}</span>
              ))}
            </div>
          </div>
        )}

        {card.notes && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{card.notes}</p>
          </div>
        )}
      </div>

      {/* Card images */}
      {(card.cardFrontUrl || card.cardBackUrl) && (
        <div className="glass-panel rounded-2xl p-6 mb-6">
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Card Images</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {card.cardFrontUrl && <img src={card.cardFrontUrl} alt="Front" className="rounded-xl border border-border" />}
            {card.cardBackUrl && <img src={card.cardBackUrl} alt="Back" className="rounded-xl border border-border" />}
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="flex gap-3 mb-20 md:mb-6">
        <button onClick={() => navigate(`/capture`)} className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors btn-press flex items-center justify-center gap-2">
          <Edit className="w-4 h-4" /> Edit
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="py-3 px-6 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors btn-press flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="glass-panel rounded-2xl p-6 max-w-sm w-full animate-fade-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-lg mb-2">Delete Card</h3>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete {card.name}'s card? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground btn-press">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium btn-press">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showWA && <WhatsAppModal card={card} onClose={() => setShowWA(false)} />}
      {showEmail && <EmailModal card={card} onClose={() => setShowEmail(false)} />}
    </div>
  );
};

export default CardDetailPage;
