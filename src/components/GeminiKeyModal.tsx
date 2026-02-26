import React, { useState } from "react";
import { getGeminiKey, setGeminiKey } from "@/lib/gemini";
import { Zap, Key } from "lucide-react";

const GeminiKeyModal: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [key, setKey] = useState(getGeminiKey());

  const handleSave = () => {
    if (key.trim()) {
      setGeminiKey(key.trim());
      onDone();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
      <div className="glass-panel rounded-2xl w-full max-w-md animate-fade-slide-up p-8 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-5">
          <Key className="w-8 h-8 text-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Setup Gemini AI</h2>
        <p className="text-muted-foreground text-sm mb-6">
          DigiVault uses Google Gemini to extract business card data. Enter your API key to get started.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter your Gemini API key"
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all mb-4 text-sm"
        />
        <p className="text-xs text-muted-foreground mb-6">
          Get your key at{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" className="text-primary hover:underline">
            aistudio.google.com
          </a>
        </p>
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="w-full gradient-hero text-foreground font-semibold py-3 rounded-xl btn-press hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Save & Continue
        </button>
      </div>
    </div>
  );
};

export default GeminiKeyModal;
