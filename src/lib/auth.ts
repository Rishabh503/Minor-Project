import { currentUser, auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { CompanyRole, GlobalRole } from "@prisma/client";
import { redirect } from "next/navigation";

export interface AuthenticatedUserContext {
  dbUser: NonNullable<Awaited<ReturnType<typeof getOrCreateDbUser>>>;
  clerkId: string;
}

export interface CompanyAuthContext extends AuthenticatedUserContext {
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  membership: {
    id: string;
    role: CompanyRole;
    status: string;
    createdAt?: Date;
  };
  isPlatformAdmin: boolean;
}

/**
 * Retrieves the current Clerk user and syncs with our local database.
 */
export async function getOrCreateDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("Authenticated Clerk user has no associated email address.");
  }

  // Find or create the user in our database
  let user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: {
      memberships: {
        include: {
          company: true,
          employeeProfile: true,
        },
      },
    },
  });

  if (!user) {
    // If not found by clerkId, check by email (in case invited beforehand)
    const existingByEmail = await db.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            company: true,
            employeeProfile: true,
          },
        },
      },
    });

    if (existingByEmail) {
      user = await db.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkId: clerkUser.id,
          firstName: clerkUser.firstName || existingByEmail.firstName,
          lastName: clerkUser.lastName || existingByEmail.lastName,
          imageUrl: clerkUser.imageUrl || existingByEmail.imageUrl,
        },
        include: {
          memberships: {
            include: {
              company: true,
              employeeProfile: true,
            },
          },
        },
      });
    } else {
      user = await db.user.create({
        data: {
          clerkId: clerkUser.id,
          email,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        },
        include: {
          memberships: {
            include: {
              company: true,
              employeeProfile: true,
            },
          },
        },
      });
    }
  }

  return user;
}

/**
 * Asserts the user is authenticated. Redirects to /sign-in if not.
 */
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    redirect("/sign-in");
  }

  return { dbUser, clerkId: userId };
}

/**
 * Asserts the user has completed onboarding and has at least one active company membership.
 * If user has no company membership, redirects to /onboarding.
 */
export async function requireActiveCompanyContext(requestedCompanyId?: string) {
  const { dbUser, clerkId } = await requireAuth();

  const isPlatformAdmin = dbUser.globalRole === GlobalRole.PLATFORM_ADMIN;

  // Strictly search for ACTIVE membership in company
  let activeMembership = requestedCompanyId
    ? dbUser.memberships.find(
        (m) => m.companyId === requestedCompanyId && m.status === "ACTIVE"
      )
    : dbUser.memberships.find((m) => m.status === "ACTIVE");

  // If user has no ACTIVE memberships
  if (!activeMembership) {
    if (isPlatformAdmin) {
      // Platform admin can navigate platform admin views without a company
      return {
        dbUser,
        clerkId,
        company: null,
        membership: null,
        isPlatformAdmin: true,
      };
    }

    // Check if user was deactivated by company admin
    const hasDeactivated = dbUser.memberships.some((m) => m.status === "DEACTIVATED");
    if (hasDeactivated) {
      redirect("/account-deactivated");
    }

    redirect("/onboarding");
  }

  return {
    dbUser,
    clerkId,
    company: {
      id: activeMembership.company.id,
      name: activeMembership.company.name,
      slug: activeMembership.company.slug,
      logoUrl: activeMembership.company.logoUrl,
    },
    membership: {
      id: activeMembership.id,
      role: activeMembership.role,
      status: activeMembership.status,
      createdAt: activeMembership.createdAt,
    },
    isPlatformAdmin,
  };
}

/**
 * Server-side authorization check enforcing allowed roles within the active company.
 * Never trusts client-supplied roles.
 */
export async function enforceRole(
  allowedRoles: CompanyRole[],
  companyId?: string
) {
  const context = await requireActiveCompanyContext(companyId);

  // Platform admin can access all management views
  if (context.isPlatformAdmin) {
    return context;
  }

  if (!context.membership || !allowedRoles.includes(context.membership.role)) {
    throw new Error("403_FORBIDDEN: Insufficient permissions for this company resource.");
  }

  return context;
}
