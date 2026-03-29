import { BusinessCard } from "@/types/card";
import { toast } from "sonner";

/**
 * Opens WhatsApp directly with the contact's phone number
 * Skips the modal and immediately launches WhatsApp
 */
export const openWhatsAppDirect = (card: BusinessCard) => {
  const phone = card.whatsapp || card.phone?.[0] || "";

  if (!phone) {
    toast.error("No phone number available");
    return;
  }

  // Clean phone number: remove all non-numeric characters except +
  let cleanPhone = phone.replace(/[^0-9+]/g, "");

  // Remove + from the beginning if present (wa.me doesn't need it in the URL)
  if (cleanPhone.startsWith("+")) {
    cleanPhone = cleanPhone.substring(1);
  }

  // Validate that we have a valid phone number (at least 10 digits)
  if (!cleanPhone || cleanPhone.length < 10) {
    toast.error("Invalid phone number format");
    return;
  }

  // Open WhatsApp without pre-filled message (user can type their own message)
  const whatsappUrl = `https://wa.me/${cleanPhone}`;
  window.open(whatsappUrl, "_blank");
  toast.success(`Opening WhatsApp for ${card.firstName || card.name}...`);
};
