export interface PasswordEntry {
  id: string;
  siteName: string;
  siteUrl: string;
  username: string;
  password: string;
  category: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PASSWORD_CATEGORIES = [
  "Social Media", "Email", "Banking", "Shopping", "Work", "Entertainment", "Development", "Other"
];
