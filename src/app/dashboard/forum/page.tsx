import { requireActiveCompanyContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole } from "@prisma/client";
import { ForumThreadListView } from "@/components/forum/ForumThreadListView";

export default async function ForumPage() {
  const context = await requireActiveCompanyContext();
  const companyId = context.company!.id;
  const membershipId = context.membership!.id;
  const isManagerOrAdmin =
    context.membership!.role === CompanyRole.MANAGER ||
    context.membership!.role === CompanyRole.COMPANY_ADMIN ||
    context.isPlatformAdmin;

  const [threads, availableTasks, availableWorksheets] = await Promise.all([
    db.forumThread.findMany({
      where: {
        companyId,
        // If not manager/admin, hide moderated content
        ...(isManagerOrAdmin ? {} : { isModerated: false }),
      },
      include: {
        author: {
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
        task: {
          select: { id: true, title: true },
        },
        worksheet: {
          select: { id: true, title: true },
        },
        meeting: {
          select: { id: true, title: true, startTime: true },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.task.findMany({
      where: { companyId, isArchived: false },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    db.worksheet.findMany({
      where: { companyId, isPublished: true },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Discussion Forum & Doubt Resolution
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Ask questions, get help from mentors and peers, share solutions, and resolve training roadblocks for {context.company!.name}.
        </p>
      </div>

      <ForumThreadListView
        threads={threads as any}
        availableTasks={availableTasks}
        availableWorksheets={availableWorksheets}
        currentMembershipId={membershipId}
        isManagerOrAdmin={isManagerOrAdmin}
      />
    </div>
  );
}
