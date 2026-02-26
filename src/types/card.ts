export interface BusinessCard {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  industry: string;
  email: string[];
  phone: string[];
  whatsapp: string;
  website: string[];
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    full: string;
  };
  social: {
    linkedin: string;
    twitter: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
  tagline: string;
  services: string[];
  notes: string;
  tags: string[];
  cardFrontUrl: string;
  cardBackUrl: string;
  cardColor: string;
  confidence: number;
  favorite: boolean;
  groups: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: "call" | "whatsapp" | "email" | "sms" | "note";
  message?: string;
  timestamp: string;
}

export const INDUSTRY_COLORS: Record<string, string> = {
  Tech: "bg-cv-violet/20 text-cv-violet",
  Finance: "bg-cv-amber/20 text-cv-amber",
  Healthcare: "bg-cv-teal/20 text-cv-teal",
  Education: "bg-primary/20 text-primary",
  Legal: "bg-cv-coral/20 text-cv-coral",
  "Real Estate": "bg-cv-amber/20 text-cv-amber",
  Marketing: "bg-cv-violet/20 text-cv-violet",
  Consulting: "bg-cv-teal/20 text-cv-teal",
  Manufacturing: "bg-muted text-muted-foreground",
  Retail: "bg-cv-coral/20 text-cv-coral",
  Other: "bg-muted text-muted-foreground",
};
