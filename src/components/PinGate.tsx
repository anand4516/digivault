import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Lock, ArrowRight } from "lucide-react";

const PinGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [verified, setVerified] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const storedPin = user ? localStorage.getItem(`cv-pin-${user.uid}`) : null;

  // If no PIN is set, skip gate
  useEffect(() => {
    if (!storedPin) setVerified(true);
  }, [storedPin]);

  // Check if already verified this session
  useEffect(() => {
    if (storedPin && user) {
      const sessionVerified = sessionStorage.getItem(`cv-pin-verified-${user.uid}`);
      if (sessionVerified === "true") setVerified(true);
    }
  }, [storedPin, user]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (newPin.every((d) => d !== "")) {
      const entered = newPin.join("");
      if (entered === storedPin) {
        if (user) sessionStorage.setItem(`cv-pin-verified-${user.uid}`, "true");
        setVerified(true);
      } else {
        setError("Incorrect PIN");
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (verified) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background grain-overlay flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center animate-fade-slide-up">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center">
            <Shield className="w-8 h-8 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Security PIN</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your 4-digit PIN to continue</p>
          </div>
        </div>

        <div className={`flex justify-center gap-3 ${shake ? "animate-shake" : ""}`}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-14 h-14 text-center text-xl font-bold rounded-xl border-2 bg-secondary text-foreground focus:outline-none transition-all ${
                error ? "border-destructive" : digit ? "border-primary" : "border-border"
              } focus:border-primary focus:ring-2 focus:ring-primary/20`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>PIN can be changed in Settings</span>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.6s ease-in-out; }
      `}</style>
    </div>
  );
};

export default PinGate;
