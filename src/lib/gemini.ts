import { GoogleGenAI } from "@google/genai";

export const getGeminiKey = () => localStorage.getItem("gemini_api_key") || "";
export const setGeminiKey = (key: string) => localStorage.setItem("gemini_api_key", key);

const GEMINI_MODEL = "gemini-2.5-flash";

const EXTRACTION_PROMPT = `You are an expert OCR and business card data extraction AI. Analyze the provided business card image(s) carefully and extract ALL information visible.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "name": "Full name of person",
  "firstName": "First name",
  "lastName": "Last name",
  "title": "Job title / designation",
  "company": "Company/organization name",
  "industry": "Inferred industry (Tech/Finance/Healthcare/Education/Legal/Real Estate/Marketing/Consulting/Manufacturing/Retail/Other)",
  "email": ["primary@email.com"],
  "phone": ["+91XXXXXXXXXX"],
  "whatsapp": "WhatsApp number if different from phone, else same as first phone",
  "website": ["https://website.com"],
  "address": {
    "street": "",
    "city": "",
    "state": "",
    "country": "",
    "pincode": "",
    "full": "Complete formatted address"
  },
  "social": {
    "linkedin": "",
    "twitter": "",
    "instagram": "",
    "facebook": "",
    "youtube": ""
  },
  "tagline": "Company tagline or slogan if visible",
  "services": [],
  "notes": "Any other relevant information found on the card",
  "cardColor": "#000000",
  "confidence": 0.95
}

Extract every single piece of text visible. If a field is not found, use null.`;

const WALLET_EXTRACTION_PROMPT = `You are an expert OCR AI that reads credit/debit card images. Analyze the provided card image(s) and extract ALL visible information.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "cardHolder": "Name on card",
  "cardNumber": "Full card number (digits only, no spaces)",
  "expiryDate": "MM/YY",
  "cvv": "3 or 4 digit CVV/CVC from the back of the card",
  "bankName": "Issuing bank name",
  "cardType": "visa or mastercard or rupay or amex or other",
  "cardCategory": "credit or debit or other",
  "notes": "Any other text visible on card (reward points, card variant, etc.)"
}

Rules:
- Read every character carefully including embossed/printed text
- For cardType: detect from card network logo (Visa, Mastercard, RuPay, Amex)
- For cvv: look on the back of the card near the signature strip, usually 3 digits (4 for Amex)
- For cardCategory: look for "CREDIT" or "DEBIT" text printed on the card
- If the number is partially visible, extract what you can see
- If a field is not found, use empty string ""`;
export interface ExtractedWalletCard {
  cardHolder: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  pin: string;
  bankName: string;
  cardType: "visa" | "mastercard" | "rupay" | "amex" | "other";
  cardCategory: "credit" | "debit" | "other";
  notes: string;
}

export interface ExtractedCard {
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
  cardColor: string;
  confidence: number;
}

export const extractCardData = async (frontUrl: string, backUrl?: string): Promise<ExtractedCard> => {
  const key = getGeminiKey();
  if (!key) throw new Error("Gemini API key not set");

  const ai = new GoogleGenAI({ apiKey: key });

  // Build parts: text prompt + image(s) as URLs
  const parts: any[] = [
    { text: EXTRACTION_PROMPT },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: await fetchImageAsBase64(frontUrl),
      },
    },
  ];

  if (backUrl) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: await fetchImageAsBase64(backUrl),
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
    });

    const text = response.text || "";
    // Clean potential markdown wrapping
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error: any) {
    const msg = error?.message?.toLowerCase() || "";
    if (msg.includes("quota") || msg.includes("429") || msg.includes("rate")) {
      throw new Error("API rate limit reached. Please wait a moment and try again.");
    }
    if (msg.includes("invalid") || msg.includes("401")) {
      throw new Error("Invalid Gemini API key. Please check your key in Settings.");
    }
    throw new Error(error?.message || "Gemini AI extraction failed. Please try again.");
  }
};

export const extractWalletCardData = async (frontUrl: string, backUrl?: string): Promise<ExtractedWalletCard> => {
  const key = getGeminiKey();
  if (!key) throw new Error("Gemini API key not set. Go to Settings to add it.");

  const ai = new GoogleGenAI({ apiKey: key });

  const parts: any[] = [
    { text: WALLET_EXTRACTION_PROMPT },
    { inlineData: { mimeType: "image/jpeg", data: await fetchImageAsBase64(frontUrl) } },
  ];

  if (backUrl) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: await fetchImageAsBase64(backUrl) } });
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
    });

    const text = response.text || "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error: any) {
    const msg = error?.message?.toLowerCase() || "";
    if (msg.includes("quota") || msg.includes("429") || msg.includes("rate")) {
      throw new Error("API rate limit reached. Please wait and try again.");
    }
    if (msg.includes("invalid") || msg.includes("401")) {
      throw new Error("Invalid Gemini API key. Check Settings.");
    }
    throw new Error(error?.message || "AI extraction failed.");
  }
};

const IDENTITY_EXTRACTION_PROMPT = `You are an expert OCR AI that reads identity documents (Aadhar Card, PAN Card, Passport, Driving Licence, etc). Analyze the provided document image(s) and extract ALL visible information.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "docType": "aadhar or pan or passport or driving_license or other",
  "holderName": "Full name on document",
  "documentNumber": "Document number (Aadhar number, PAN number, Passport number, DL number, etc.)",
  "dateOfBirth": "DD/MM/YYYY or as printed",
  "issueDate": "Issue date if visible",
  "expiryDate": "Expiry/validity date if visible",
  "address": "Full address if visible",
  "gender": "Male/Female/Other",
  "fatherName": "Father's/Guardian's name if visible",
  "notes": "Any other relevant text found on the document"
}

Rules:
- For docType: detect from document layout/logo - "AADHAAR" = aadhar, "INCOME TAX" or "Permanent Account Number" = pan, "PASSPORT" = passport, "Driving Licence" = driving_license
- Read every character carefully including printed and embossed text
- For Aadhar: look for 12-digit number, name, DOB, gender, address
- For PAN: look for 10-character alphanumeric number, name, father's name, DOB
- For Passport: look for passport number, name, nationality, DOB, issue/expiry dates
- For DL: look for licence number, name, DOB, validity, address
- If a field is not found, use empty string ""`;

export interface ExtractedIdentityCard {
  docType: "aadhar" | "pan" | "passport" | "driving_license" | "other";
  holderName: string;
  documentNumber: string;
  dateOfBirth: string;
  issueDate: string;
  expiryDate: string;
  address: string;
  gender: string;
  fatherName: string;
  notes: string;
}

export const extractIdentityCardData = async (frontUrl: string, backUrl?: string): Promise<ExtractedIdentityCard> => {
  const key = getGeminiKey();
  if (!key) throw new Error("Gemini API key not set. Go to Settings to add it.");

  const ai = new GoogleGenAI({ apiKey: key });
  const parts: any[] = [
    { text: IDENTITY_EXTRACTION_PROMPT },
    { inlineData: { mimeType: "image/jpeg", data: await fetchImageAsBase64(frontUrl) } },
  ];
  if (backUrl) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: await fetchImageAsBase64(backUrl) } });
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
    });
    const text = response.text || "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error: any) {
    const msg = error?.message?.toLowerCase() || "";
    if (msg.includes("quota") || msg.includes("429") || msg.includes("rate")) {
      throw new Error("API rate limit reached. Please wait and try again.");
    }
    if (msg.includes("invalid") || msg.includes("401")) {
      throw new Error("Invalid Gemini API key. Check Settings.");
    }
    throw new Error(error?.message || "AI extraction failed.");
  }
};

const BANK_EXTRACTION_PROMPT = `You are an expert OCR AI that reads bank passbook front pages, bank account statements, and bank documents. Analyze the provided image(s) and extract ALL visible banking information.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "bankName": "Bank name (e.g. STATE BANK OF INDIA, BANK OF BARODA, HDFC BANK)",
  "customerId": "Customer ID if visible",
  "accountHolder": "Account holder full name",
  "accountNumber": "Bank account number",
  "ifscCode": "IFSC code (11 character alphanumeric)",
  "branchName": "Branch name if visible",
  "accountType": "savings or current or other"
}

Rules:
- Read every character carefully including printed text
- For IFSC: usually starts with 4 letter bank code followed by 0 and 6 digits (e.g. BARB0GHATIX)
- For account number: extract full number, usually 10-18 digits
- Look for "Savings" or "Current" to determine account type
- If a field is not found, use empty string ""`;

export interface ExtractedBankDetail {
  bankName: string;
  customerId: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: "savings" | "current" | "other";
}

export const extractBankData = async (imageUrl: string): Promise<ExtractedBankDetail> => {
  const key = getGeminiKey();
  if (!key) throw new Error("Gemini API key not set. Go to Settings to add it.");

  const ai = new GoogleGenAI({ apiKey: key });
  const parts: any[] = [
    { text: BANK_EXTRACTION_PROMPT },
    { inlineData: { mimeType: "image/jpeg", data: await fetchImageAsBase64(imageUrl) } },
  ];

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
    });
    const text = response.text || "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error: any) {
    const msg = error?.message?.toLowerCase() || "";
    if (msg.includes("quota") || msg.includes("429") || msg.includes("rate")) {
      throw new Error("API rate limit reached. Please wait and try again.");
    }
    if (msg.includes("invalid") || msg.includes("401")) {
      throw new Error("Invalid Gemini API key. Check Settings.");
    }
    throw new Error(error?.message || "AI extraction failed.");
  }
};

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
