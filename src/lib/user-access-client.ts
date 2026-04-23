export const familyRoles = ["admin", "family_leader", "family_member"] as const;

export type FamilyRole = (typeof familyRoles)[number];

export type FamilyUserAccessProfileItem = {
  userId: string;
  role: FamilyRole;
  privateStorageLimitBytes: number;
};

export type AdminUserAccessItem = {
  userId: string;
  name: string;
  email: string;
  role: FamilyRole;
  privateStorageLimitBytes: number;
};

export const defaultPrivateStorageLimitBytes = 5 * 1024 * 1024 * 1024;
export const minPrivateStorageLimitBytes = 100 * 1024 * 1024;
export const maxPrivateStorageLimitBytes = 500 * 1024 * 1024 * 1024;

export function isFamilyRole(value: string): value is FamilyRole {
  return familyRoles.includes(value as FamilyRole);
}

export function getFamilyRoleLabel(role: FamilyRole) {
  const labels: Record<FamilyRole, string> = {
    admin: "Admin",
    family_leader: "Family leader",
    family_member: "Family member",
  };

  return labels[role];
}

export function formatBytesToGiB(bytes: number) {
  return bytes / (1024 * 1024 * 1024);
}

export function gibToBytes(gib: number) {
  return Math.round(gib * 1024 * 1024 * 1024);
}
