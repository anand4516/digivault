export type IdentityDocType = "aadhar" | "pan" | "passport" | "driving_license" | "other";

export interface IdentityCard {
  id: string;
  docType: IdentityDocType;
  holderName: string;
  documentNumber: string;
  dateOfBirth: string;
  issueDate: string;
  expiryDate: string;
  address: string;
  gender: string;
  fatherName: string;
  notes: string;
  frontUrl: string;
  backUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const DOC_TYPE_LABELS: Record<IdentityDocType, string> = {
  aadhar: "Aadhar Card",
  pan: "PAN Card",
  passport: "Passport",
  driving_license: "Driving Licence",
  other: "Other ID",
};

export const DOC_TYPE_COLORS: Record<IdentityDocType, string> = {
  aadhar: "from-orange-500 to-orange-800",
  pan: "from-sky-500 to-blue-800",
  passport: "from-indigo-600 to-indigo-900",
  driving_license: "from-emerald-500 to-green-800",
  other: "from-slate-500 to-slate-800",
};
