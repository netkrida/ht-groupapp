import { type Session } from "next-auth";

// Define permissions
export const PERMISSIONS = {
  // Company permissions
  COMPANY_VIEW: "company:view",
  COMPANY_CREATE: "company:create",
  COMPANY_UPDATE: "company:update",
  COMPANY_DELETE: "company:delete",

  // User permissions
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // Dashboard permissions
  DASHBOARD_VIEW: "dashboard:view",

  // Report permissions
  REPORT_VIEW: "report:view",
  REPORT_CREATE: "report:create",
  REPORT_EXPORT: "report:export",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Define roles with their permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  Admin: [
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.COMPANY_CREATE,
    PERMISSIONS.COMPANY_UPDATE,
    PERMISSIONS.COMPANY_DELETE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_EXPORT,
  ],
  Manager: [
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_EXPORT,
  ],
  User: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORT_VIEW,
  ],
};

// Check if user has permission
export function hasPermission(
  session: Session | null,
  permission: Permission
): boolean {
  if (!session?.user?.role) return false;

  const roleName = session.user.role.name;
  const rolePermissions = ROLE_PERMISSIONS[roleName] ?? [];

  return rolePermissions.includes(permission);
}

// Check if user has any of the permissions
export function hasAnyPermission(
  session: Session | null,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(session, permission));
}

// Check if user has all of the permissions
export function hasAllPermissions(
  session: Session | null,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(session, permission));
}

// Check if user has role
export function hasRole(session: Session | null, roleName: string): boolean {
  if (!session?.user?.role) return false;
  return session.user.role.name === roleName;
}

// Check if user belongs to company
export function belongsToCompany(
  session: Session | null,
  companyCode: string
): boolean {
  if (!session?.user?.company) return false;
  return session.user.company.code === companyCode;
}

// Get user's accessible companies
export function getAccessibleCompanies(session: Session | null): string[] {
  if (!session?.user?.company) return [];
  
  // Admin can access all companies (we'll check this in the actual implementation)
  if (hasRole(session, "Admin")) {
    // Return all company codes - in real scenario, fetch from database
    return ["PT-PKS", "PT-HTK", "PT-NILO", "PT-ZTA"];
  }

  // Regular users can only access their own company
  return [session.user.company.code];
}
