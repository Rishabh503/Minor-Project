import { requireActiveCompanyContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole, MembershipStatus } from "@prisma/client";
import { ScheduleCalendarView } from "@/components/schedule/ScheduleCalendarView";

export default async function SchedulePage() {
  const context = await requireActiveCompanyContext();
  const companyId = context.company!.id;
  const membershipId = context.membership!.id;
  const isManagerOrAdmin =
    context.membership!.role === CompanyRole.MANAGER ||
    context.membership!.role === CompanyRole.COMPANY_ADMIN ||
    context.isPlatformAdmin;

  // Query authorized meetings
  const meetings = await db.meeting.findMany({
    where: {
      companyId,
      ...(isManagerOrAdmin
        ? {}
        : {
            OR: [
              { organizerMembershipId: membershipId },
              { participants: { some: { membershipId } } },
            ],
          }),
    },
    include: {
      organizer: {
        include: { user: true },
      },
      participants: {
        include: {
          membership: {
            include: { user: true },
          },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // Query doubts
  const doubts = await db.employeeDoubt.findMany({
    where: {
      companyId,
      ...(isManagerOrAdmin ? {} : { studentMembershipId: membershipId }),
    },
    include: {
      student: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Query available members to invite
  const availableMembers = await db.companyMembership.findMany({
    where: {
      companyId,
      status: MembershipStatus.ACTIVE,
    },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Calendar Schedule & Sessions
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Track upcoming training workshops, team standups, 1-on-1 check-ins, and dedicated doubt resolution sessions for {context.company!.name}.
        </p>
      </div>

      <ScheduleCalendarView
        initialMeetings={meetings as any}
        doubts={doubts as any}
        availableMembers={availableMembers.map((m) => ({
          id: m.id,
          name: [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.email,
          email: m.user.email,
        }))}
        currentMembershipId={membershipId}
        isManagerOrAdmin={isManagerOrAdmin}
      />
    </div>
  );
}
