export interface BankDetail {
  id: string;
  // Bank Information
  bankName: string;
  customerId: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: "savings" | "current" | "other";
  // Debit Card Details
  debitCardNumber: string;
  cardExpiry: string;
  cvv: string;
  atmPin: string;
  // Mobile & App Banking
  registeredMobile: string;
  mobileAppLoginPin: string;
  mobileBankingPin: string;
  // Net Banking
  netBankingUserId: string;
  netBankingPassword: string;
  // UPI
  upiId: string;
  upiPin: string;
  // Meta
  notes: string;
  passbookUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const BANK_COLORS: Record<string, string> = {
  "sbi": "from-blue-600 to-blue-900",
  "hdfc": "from-red-600 to-red-900",
  "icici": "from-orange-500 to-orange-800",
  "axis": "from-purple-600 to-purple-900",
  "bob": "from-orange-600 to-red-800",
  "pnb": "from-indigo-600 to-indigo-900",
  "kotak": "from-red-500 to-red-800",
  "default": "from-teal-600 to-teal-900",
};

export const getBankGradient = (bankName: string): string => {
  const lower = (bankName || "").toLowerCase();
  for (const key of Object.keys(BANK_COLORS)) {
    if (key !== "default" && lower.includes(key)) return BANK_COLORS[key];
  }
  return BANK_COLORS.default;
};
