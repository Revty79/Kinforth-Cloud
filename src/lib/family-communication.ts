export type FamilyBillboardPostItem = {
  id: string;
  title: string;
  message: string;
  createdByName: string;
  createdByUserId: string;
  createdAt: string;
};

export type FamilyChatMessageItem = {
  id: string;
  message: string;
  sentByName: string;
  sentByUserId: string;
  createdAt: string;
};

export const maxBillboardTitleLength = 120;
export const maxBillboardMessageLength = 1200;
export const maxChatMessageLength = 500;

export function normalizeSingleLineText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeMultiLineText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function isValidBillboardTitle(value: string) {
  return value.length >= 3 && value.length <= maxBillboardTitleLength;
}

export function isValidBillboardMessage(value: string) {
  return value.length >= 3 && value.length <= maxBillboardMessageLength;
}

export function isValidChatMessage(value: string) {
  return value.length >= 1 && value.length <= maxChatMessageLength;
}
