import { notFound } from "next/navigation";
import { requireActiveCompanyContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole } from "@prisma/client";
import { ForumThreadDetailView } from "@/components/forum/ForumThreadDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ForumDetailPage({ params }: PageProps) {
  const { id } = await params;
  const context = await requireActiveCompanyContext();
  const companyId = context.company!.id;
  const membershipId = context.membership!.id;
  const isManagerOrAdmin =
    context.membership!.role === CompanyRole.MANAGER ||
    context.membership!.role === CompanyRole.COMPANY_ADMIN ||
    context.isPlatformAdmin;

  const thread = await db.forumThread.findFirst({
    where: {
      id,
      companyId, // Strictly prevent cross-company access
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
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          meetingUrl: true,
          location: true,
        },
      },
      replies: {
        where: isManagerOrAdmin ? {} : { isModerated: false },
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
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!thread) {
    notFound();
  }

  return (
    <ForumThreadDetailView
      thread={thread as any}
      currentMembershipId={membershipId}
      isManagerOrAdmin={isManagerOrAdmin}
    />
  );
}
