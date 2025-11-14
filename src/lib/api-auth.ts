import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

/**
 * Check if user is authenticated
 * Returns session if authenticated, or NextResponse with 401 if not
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Check if user has one of the required roles
 */
export function requireRole(
  session: { user: { role?: { name: string } } } | null,
  allowedRoles: string[]
) {
  const userRole = session?.user?.role?.name;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      ),
      authorized: false,
    };
  }

  return { error: null, authorized: true };
}

/**
 * Check if user belongs to the specified company
 */
export function requireCompany(
  session: { user: { company?: { code: string }; role?: { name: string } } } | null,
  companyCode: string
) {
  const userCompany = session?.user?.company?.code;
  const userRole = session?.user?.role?.name;

  // Admin can access all companies
  if (userRole === "Admin") {
    return { error: null, authorized: true };
  }

  if (userCompany !== companyCode) {
    return {
      error: NextResponse.json(
        { error: "Forbidden - Access denied to this company" },
        { status: 403 }
      ),
      authorized: false,
    };
  }

  return { error: null, authorized: true };
}

/**
 * Combined auth check with role and optional company verification
 */
export async function requireAuthWithRole(
  allowedRoles: string[],
  companyCode?: string
) {
  const { error: authError, session } = await requireAuth();
  if (authError) return { error: authError, session: null };

  const { error: roleError } = requireRole(session, allowedRoles);
  if (roleError) return { error: roleError, session: null };

  if (companyCode) {
    const { error: companyError } = requireCompany(session, companyCode);
    if (companyError) return { error: companyError, session: null };
  }

  return { error: null, session };
}
