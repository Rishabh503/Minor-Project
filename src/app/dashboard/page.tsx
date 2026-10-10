import { requireActiveCompanyContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole } from "@prisma/client";
import { PlatformAdminDashboard } from "@/components/dashboard/PlatformAdminDashboard";
import { CompanyAdminDashboard } from "@/components/dashboard/CompanyAdminDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";

export default async function DashboardPage() {
  const context = await requireActiveCompanyContext();

  // 1. Platform Admin view
  if (context.isPlatformAdmin) {
    const [companies, totalUsers, auditLogs] = await Promise.all([
      db.company.findMany({
        include: {
          _count: {
            select: { memberships: true, departments: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.user.count(),
      db.auditLog.findMany({
        include: {
          actor: { select: { email: true } },
          company: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    return (
      <PlatformAdminDashboard
        companies={companies}
        totalUsers={totalUsers}
        auditLogs={auditLogs}
      />
    );
  }

  const companyId = context.company!.id;
  const membershipId = context.membership!.id;
  const role = context.membership!.role;

  // 2. Company Admin view
  if (role === CompanyRole.COMPANY_ADMIN) {
    const [
      totalMembers,
      totalDepartments,
      inProgressOnboardings,
      completedOnboardings,
      members,
      departments,
      auditLogs,
    ] = await Promise.all([
      db.companyMembership.count({ where: { companyId } }),
      db.department.count({ where: { companyId } }),
      db.employeeProfile.count({
        where: {
          membership: { companyId },
          onboardingStatus: "IN_PROGRESS",
        },
      }),
      db.employeeProfile.count({
        where: {
          membership: { companyId },
          onboardingStatus: "COMPLETED",
        },
      }),
      db.companyMembership.findMany({
        where: { companyId },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          employeeProfile: {
            include: {
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.department.findMany({
        where: { companyId },
        include: {
          _count: {
            select: { employees: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      db.auditLog.findMany({
        where: { companyId },
        include: {
          actor: { select: { email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    return (
      <CompanyAdminDashboard
        company={context.company!}
        metrics={{
          totalMembers,
          totalDepartments,
          inProgressOnboardings,
          completedOnboardings,
        }}
        members={members}
        departments={departments}
        auditLogs={auditLogs}
      />
    );
  }

  // 3. Manager view
  if (role === CompanyRole.MANAGER) {
    const managerProfile = await db.employeeProfile.findUnique({
      where: { membershipId },
    });

    const [directReports, departmentMembers, managerUpcomingMeetings] = await Promise.all([
      db.employeeProfile.findMany({
        where: { managerMembershipId: membershipId },
        include: {
          department: { select: { name: true } },
          membership: {
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      managerProfile?.departmentId
        ? db.employeeProfile.findMany({
            where: {
              departmentId: managerProfile.departmentId,
              NOT: { membershipId },
            },
            include: {
              membership: {
                include: {
                  user: {
                    select: {
                      email: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
            take: 6,
          })
        : Promise.resolve([]),
      db.meeting.findMany({
        where: {
          companyId,
          status: { not: "CANCELLED" },
          endTime: { gte: new Date() },
          OR: [
            { organizerMembershipId: membershipId },
            { participants: { some: { membershipId } } },
          ],
        },
        include: {
          organizer: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
          participants: {
            include: {
              membership: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, email: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { startTime: "asc" },
        take: 6,
      }),
    ]);

    return (
      <ManagerDashboard
        company={context.company!}
        directReports={directReports}
        departmentMembers={departmentMembers}
        upcomingMeetings={managerUpcomingMeetings as any}
      />
    );
  }

  // 4. Employee view
  const [profile, employeeUpcomingMeetings] = await Promise.all([
    db.employeeProfile.findUnique({
      where: { membershipId },
      include: {
        department: true,
        manager: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    db.meeting.findMany({
      where: {
        companyId,
        status: { not: "CANCELLED" },
        endTime: { gte: new Date() },
        OR: [
          { organizerMembershipId: membershipId },
          { participants: { some: { membershipId } } },
        ],
      },
      include: {
        organizer: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        participants: {
          include: {
            membership: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
      take: 4,
    }),
  ]);

  return (
    <EmployeeDashboard
      user={{
        firstName: context.dbUser.firstName,
        lastName: context.dbUser.lastName,
        email: context.dbUser.email,
      }}
      company={context.company!}
      profile={profile}
      upcomingMeetings={employeeUpcomingMeetings as any}
    />
  );
}
