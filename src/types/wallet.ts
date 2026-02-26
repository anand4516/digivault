export interface WalletCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  pin: string;
  cardCategory: "credit" | "debit" | "other";
  cardType: "visa" | "mastercard" | "rupay" | "amex" | "other";
  bankName: string;
  cardFrontUrl: string;
  cardBackUrl: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const CARD_TYPE_COLORS: Record<string, string> = {
  visa: "from-blue-600 to-blue-900",
  mastercard: "from-red-600 to-orange-700",
  rupay: "from-emerald-600 to-teal-800",
  amex: "from-slate-500 to-slate-800",
  other: "from-violet-600 to-purple-900",
};
