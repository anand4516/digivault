import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCards } from "@/hooks/useCards";

import ContactCard from "@/components/ContactCard";
import WhatsAppModal from "@/components/WhatsAppModal";
import EmailModal from "@/components/EmailModal";
import { BusinessCard } from "@/types/card";
import { Search, PlusCircle, Grid3X3, List, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

const Dashboard: React.FC = () => {
  const { cards, loading, toggleFavorite } = useCards();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "recent" | "favorites">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [waCard, setWaCard] = useState<BusinessCard | null>(null);
  const [emailCard, setEmailCard] = useState<BusinessCard | null>(null);

  const filtered = useMemo(() => {
    let result = cards;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        [c.name, c.company, c.title, c.industry, ...(c.email || []), ...(c.phone || []), ...(c.tags || [])]
          .some((f) => f?.toLowerCase().includes(q))
      );
    }
    if (filter === "favorites") result = result.filter((c) => c.favorite);
    if (filter === "recent") {
      const week = Date.now() - 7 * 86400000;
      result = result.filter((c) => new Date(c.createdAt).getTime() > week);
    }
    return result;
  }, [cards, search, filter]);

  const handleCall = (card: BusinessCard) => {
    const phone = card.phone?.[0];
    if (phone) {
      window.open(`tel:${phone}`);
      toast.success(`Opening dialer for ${card.name}`);
    } else {
      toast.error("No phone number available");
    }
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Business Info</h1>
        <button
          onClick={() => navigate("/capture")}
          className="gradient-hero text-foreground font-medium text-xs py-2 px-3.5 rounded-lg btn-press hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Add Card
        </button>
      </div>

      

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards..."
            className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "recent", "favorites"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors btn-press capitalize ${
                filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {cards.length} cards
      </p>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl h-64 skeleton-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">
            {cards.length === 0 ? "No cards yet" : "No matching cards"}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {cards.length === 0 ? "Add your first business card to get started" : "Try different search terms"}
          </p>
          {cards.length === 0 && (
            <button onClick={() => navigate("/capture")} className="gradient-hero text-foreground font-medium text-sm py-2.5 px-5 rounded-xl btn-press">
              <PlusCircle className="w-4 h-4 inline mr-2" />
              Add First Card
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
          {filtered.map((card) => (
            <ContactCard
              key={card.id}
              card={card}
              onToggleFavorite={toggleFavorite}
              onClick={(c) => navigate(`/card/${c.id}`)}
              onCall={handleCall}
              onWhatsApp={setWaCard}
              onEmail={setEmailCard}
            />
          ))}
        </div>
      )}

      {waCard && <WhatsAppModal card={waCard} onClose={() => setWaCard(null)} />}
      {emailCard && <EmailModal card={emailCard} onClose={() => setEmailCard(null)} />}
    </div>
  );
};

export default Dashboard;
