export const shoppingListBuckets = ["needs", "wants"] as const;
export type ShoppingListBucket = (typeof shoppingListBuckets)[number];

export type FamilyShoppingItem = {
  id: string;
  label: string;
  bucket: ShoppingListBucket;
  isChecked: boolean;
  createdByName: string;
  createdByUserId: string;
  checkedByUserId: string | null;
  checkedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const maxShoppingItemLabelLength = 120;

export function normalizeShoppingItemLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidShoppingListBucket(value: string): value is ShoppingListBucket {
  return shoppingListBuckets.includes(value as ShoppingListBucket);
}

export function isValidShoppingItemLabel(value: string) {
  return value.length >= 1 && value.length <= maxShoppingItemLabelLength;
}
