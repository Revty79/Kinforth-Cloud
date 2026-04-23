export type FamilyContactItem = {
  id: string;
  fullName: string;
  relation?: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
};

export function isLikelyPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function normalizePhoneForDial(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
