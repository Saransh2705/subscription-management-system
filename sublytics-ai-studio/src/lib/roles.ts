export const ROLES = ["ADMIN", "MANAGER", "STAFF", "VIEWER"] as const;

export type AppRole = (typeof ROLES)[number];

export type StaffUser = {
  id: string;
  email: string;
  role: AppRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
};
