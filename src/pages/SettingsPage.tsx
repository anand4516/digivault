import React, { useState, useRef } from "react";
import { getGeminiKey, setGeminiKey } from "@/lib/gemini";
import { useAuth } from "@/contexts/AuthContext";
import { Key, User, Shield, Check, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [geminiKey, setGeminiKeyState] = useState(getGeminiKey());
  const [userName, setUserName] = useState(localStorage.getItem("cv_user_name") || user?.displayName || "");
  const [userCompany, setUserCompany] = useState(localStorage.getItem("cv_user_company") || "");

  // PIN state
  const currentPin = user ? localStorage.getItem(`cv-pin-${user.uid}`) : null;
  const [pinDigits, setPinDigits] = useState(["", "", "", ""]);
  const [confirmPinDigits, setConfirmPinDigits] = useState(["", "", "", ""]);
  const [pinStep, setPinStep] = useState<"set" | "confirm">("set");
  const [pinError, setPinError] = useState("");
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const saveGeminiKey = () => {
    setGeminiKey(geminiKey);
    toast.success("Gemini API key updated");
  };

  const saveProfile = () => {
    localStorage.setItem("cv_user_name", userName);
    localStorage.setItem("cv_user_company", userCompany);
    toast.success("Profile saved");
  };

  const handlePinInput = (index: number, value: string, isConfirm: boolean) => {
    if (!/^\d*$/.test(value)) return;
    const digits = isConfirm ? [...confirmPinDigits] : [...pinDigits];
    const refs = isConfirm ? confirmPinRefs : pinRefs;
    digits[index] = value.slice(-1);
    isConfirm ? setConfirmPinDigits(digits) : setPinDigits(digits);
    setPinError("");

    if (value && index < 3) refs.current[index + 1]?.focus();
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean) => {
    const digits = isConfirm ? confirmPinDigits : pinDigits;
    const refs = isConfirm ? confirmPinRefs : pinRefs;
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleSetPin = () => {
    const pin = pinDigits.join("");
    if (pin.length !== 4) { setPinError("Enter all 4 digits"); return; }

    if (pinStep === "set") {
      setPinStep("confirm");
      setConfirmPinDigits(["", "", "", ""]);
      setTimeout(() => confirmPinRefs.current[0]?.focus(), 100);
      return;
    }

    const confirmPin = confirmPinDigits.join("");
    if (pin !== confirmPin) {
      setPinError("PINs don't match");
      setConfirmPinDigits(["", "", "", ""]);
      confirmPinRefs.current[0]?.focus();
      return;
    }

    if (user) {
      localStorage.setItem(`cv-pin-${user.uid}`, pin);
      sessionStorage.setItem(`cv-pin-verified-${user.uid}`, "true");
    }
    toast.success("Security PIN set successfully");
    setPinDigits(["", "", "", ""]);
    setConfirmPinDigits(["", "", "", ""]);
    setPinStep("set");
  };

  const removePin = () => {
    if (user) {
      localStorage.removeItem(`cv-pin-${user.uid}`);
      sessionStorage.removeItem(`cv-pin-verified-${user.uid}`);
    }
    toast.success("Security PIN removed");
    setPinDigits(["", "", "", ""]);
    setConfirmPinDigits(["", "", "", ""]);
    setPinStep("set");
  };

  const renderPinInputs = (digits: string[], isConfirm: boolean) => (
    <div className="flex gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { (isConfirm ? confirmPinRefs : pinRefs).current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handlePinInput(i, e.target.value, isConfirm)}
          onKeyDown={(e) => handlePinKeyDown(i, e, isConfirm)}
          className="w-11 h-11 text-center text-lg font-bold rounded-xl border-2 bg-secondary text-foreground focus:outline-none transition-all border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-slide-up">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold">My Info (for templates)</h3>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Your Name</label>
          <input value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Your Company</label>
          <input value={userCompany} onChange={(e) => setUserCompany(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
        <button onClick={saveProfile} className="gradient-hero text-foreground font-medium text-sm py-2.5 px-5 rounded-xl btn-press hover:opacity-90 flex items-center gap-2">
          <Check className="w-4 h-4" /> Save
        </button>
      </div>

      {/* Security PIN */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-cv-teal" />
            <h3 className="font-display font-semibold">Security PIN</h3>
          </div>
          {currentPin && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-cv-teal/20 text-cv-teal font-medium">Active</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {currentPin
            ? "Your PIN is active. You'll be asked to enter it each time you open the app."
            : "Set a 4-digit PIN for an extra layer of security when opening the app."
          }
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              {currentPin ? "New PIN" : pinStep === "confirm" ? "Confirm PIN" : "Enter PIN"}
            </label>
            {pinStep === "set" ? renderPinInputs(pinDigits, false) : renderPinInputs(confirmPinDigits, true)}
          </div>
          {pinError && <p className="text-xs text-destructive">{pinError}</p>}
          <div className="flex gap-2">
            <button onClick={handleSetPin} className="gradient-hero text-foreground font-medium text-sm py-2.5 px-5 rounded-xl btn-press hover:opacity-90 flex items-center gap-2">
              <Check className="w-4 h-4" /> {pinStep === "confirm" ? "Confirm PIN" : currentPin ? "Change PIN" : "Set PIN"}
            </button>
            {pinStep === "confirm" && (
              <button onClick={() => { setPinStep("set"); setPinError(""); }} className="text-sm px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
                Back
              </button>
            )}
            {currentPin && pinStep === "set" && (
              <button onClick={removePin} className="text-sm px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-cv-coral hover:border-cv-coral/30 transition-colors flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Remove PIN
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gemini Key */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-5 h-5 text-cv-amber" />
          <h3 className="font-display font-semibold">Gemini API Key</h3>
        </div>
        <input
          type="password"
          value={geminiKey}
          onChange={(e) => setGeminiKeyState(e.target.value)}
          placeholder="Enter Gemini API key"
          className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <p className="text-xs text-muted-foreground">
          Get your key at{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" className="text-primary hover:underline">aistudio.google.com</a>
        </p>
        <button onClick={saveGeminiKey} className="gradient-hero text-foreground font-medium text-sm py-2.5 px-5 rounded-xl btn-press hover:opacity-90 flex items-center gap-2">
          <Check className="w-4 h-4" /> Save Key
        </button>
      </div>

      {/* Account */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-cv-teal" />
          <h3 className="font-display font-semibold">Account</h3>
        </div>
        <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
      </div>
    </div>
  );
};

export default SettingsPage;
