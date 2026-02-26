import React from "react";
import { HeartHandshake, Phone, Mail, MessageCircle, Shield } from "lucide-react";

const SupportPage: React.FC = () => (
  <div className="max-w-3xl mx-auto space-y-8 animate-fade-slide-up">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
        <HeartHandshake className="w-5 h-5 text-foreground" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold">Support</h1>
        <p className="text-sm text-muted-foreground">We're here to help</p>
      </div>
    </div>

    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="font-display text-lg font-semibold">Dream Team Services</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Dream Team Services</strong> created this platform for you. We keep your data safe and do not use or sell it to anyone. For any support, please reach out to us through the channels below.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Call */}
      <a
        href="tel:9959935203"
        className="glass-panel rounded-2xl p-6 card-hover flex items-center gap-4 group"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cv-teal to-accent flex items-center justify-center shrink-0">
          <Phone className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold group-hover:text-primary transition-colors">Call Us</p>
          <p className="text-sm text-muted-foreground">9959935203</p>
        </div>
      </a>

      {/* WhatsApp */}
      <a
        href="https://wa.me/919959935203"
        target="_blank"
        rel="noopener noreferrer"
        className="glass-panel rounded-2xl p-6 card-hover flex items-center gap-4 group"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cv-teal to-cv-violet flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold group-hover:text-primary transition-colors">WhatsApp</p>
          <p className="text-sm text-muted-foreground">9959935203</p>
        </div>
      </a>

      {/* Email */}
      <a
        href="mailto:thedreamteamservicespvt@gmail.com"
        className="glass-panel rounded-2xl p-6 card-hover flex items-center gap-4 group sm:col-span-2"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cv-amber to-cv-coral flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold group-hover:text-primary transition-colors">Email</p>
          <p className="text-sm text-muted-foreground break-all">thedreamteamservicespvt@gmail.com</p>
        </div>
      </a>
    </div>

    <div className="glass-panel rounded-2xl p-6">
      <h3 className="font-display font-semibold mb-3">Frequently Asked Questions</h3>
      <div className="space-y-4">
        {[
          { q: "Is my data safe?", a: "Yes! We use industry-standard encryption and never share your data with anyone." },
          { q: "Can I delete my account?", a: "Yes, you can delete your account and all data permanently from Settings." },
          { q: "How do I report a bug?", a: "Contact us via WhatsApp or email and we'll fix it as soon as possible." },
        ].map((faq) => (
          <div key={faq.q}>
            <p className="text-sm font-medium">{faq.q}</p>
            <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SupportPage;
