import React from "react";
import { Shield, Lock, Eye, Server } from "lucide-react";

const PrivacyPolicyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto space-y-8 animate-fade-slide-up">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
        <Shield className="w-5 h-5 text-foreground" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
      </div>
    </div>

    <div className="glass-panel rounded-2xl p-6 space-y-6">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Your Data is Safe</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          DigiVault is built by <strong className="text-foreground">Dream Team Services</strong>. We take your privacy extremely seriously. Your personal data, business cards, financial information, passwords, and all other data stored in DigiVault is encrypted and protected.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-cv-teal" />
          <h2 className="font-display text-lg font-semibold">We Do Not Sell Your Data</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We will <strong className="text-foreground">never</strong> use, share, or sell your data to anyone for any purpose. Your information belongs to you and only you. We do not share your data with third-party advertisers, marketers, or any other entities.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-cv-amber" />
          <h2 className="font-display text-lg font-semibold">Data Storage</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All your data is stored securely using industry-standard encryption and security practices. We employ secure cloud infrastructure to ensure your data remains safe and accessible only to you.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Your Rights</h2>
        <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
          <li>You can access, modify, or delete your data at any time.</li>
          <li>You can export your data whenever you want.</li>
          <li>You can delete your account and all associated data permanently.</li>
        </ul>
      </section>
    </div>
  </div>
);

export default PrivacyPolicyPage;
