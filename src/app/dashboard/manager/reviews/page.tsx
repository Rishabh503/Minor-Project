import { enforceRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole, AssignmentStatus } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReviewQueueClient } from "./ReviewQueueClient";
import { ClipboardCheck, CheckCircle } from "lucide-react";

export default async function ManagerReviewsPage() {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;
  const isCompanyAdmin = context.membership!.role === CompanyRole.COMPANY_ADMIN;

  // Query pending submissions
  const pendingAssignments = await db.taskAssignment.findMany({
    where: {
      task: { companyId, isArchived: false },
      status: { in: [AssignmentStatus.SUBMITTED, AssignmentStatus.UNDER_REVIEW, AssignmentStatus.CHANGES_REQUESTED] },
      ...(isCompanyAdmin
        ? {}
        : {
            employeeMembership: {
              employeeProfile: {
                managerMembershipId: callerMembershipId,
              },
            },
          }),
    },
    include: {
      task: true,
      employeeMembership: {
        include: {
          user: true,
          employeeProfile: {
            include: { department: true },
          },
        },
      },
      submissions: {
        orderBy: { submissionNumber: "desc" },
        take: 1,
      },
      reviews: {
        orderBy: { reviewedAt: "desc" },
        take: 3,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formattedItems = pendingAssignments.map((a) => ({
    assignmentId: a.id,
    status: a.status,
    dueDate: a.dueDate,
    task: {
      id: a.task.id,
      title: a.task.title,
      type: a.task.type,
      priority: a.task.priority,
    },
    employee: {
      id: a.employeeMembership.id,
      email: a.employeeMembership.user.email,
      name: [a.employeeMembership.user.firstName, a.employeeMembership.user.lastName]
        .filter(Boolean)
        .join(" ") || a.employeeMembership.user.email,
      jobTitle: a.employeeMembership.employeeProfile?.jobTitle || null,
      department: a.employeeMembership.employeeProfile?.department?.name || null,
    },
    latestSubmission: a.submissions[0]
      ? {
          id: a.submissions[0].id,
          submissionNumber: a.submissions[0].submissionNumber,
          submissionText: a.submissions[0].submissionText,
          links: (a.submissions[0].links as any) || null,
          submittedAt: a.submissions[0].submittedAt,
        }
      : null,
    previousReviews: a.reviews.map((r) => ({
      id: r.id,
      decision: r.decision,
      feedback: r.feedback,
      reviewedAt: r.reviewedAt,
    })),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Task Submissions & Review Queue
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Evaluate submitted employee deliverables, provide guidance, approve completions, or request changes.
        </p>
      </div>

      {formattedItems.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Review queue is completely clear"
          description="There are currently no active employee submissions awaiting review. Check back when your team members submit their deliverables."
        />
      ) : (
        <ReviewQueueClient items={formattedItems} />
      )}
    </div>
  );
}
