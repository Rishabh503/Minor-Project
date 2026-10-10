import { requireActiveCompanyContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmployeeTasksClient } from "./EmployeeTasksClient";

export default async function EmployeeTasksPage() {
  const context = await requireActiveCompanyContext();
  const membershipId = context.membership!.id;

  const assignments = await db.taskAssignment.findMany({
    where: {
      employeeMembershipId: membershipId,
      task: { isArchived: false },
    },
    include: {
      task: true,
      submissions: {
        orderBy: { submissionNumber: "desc" },
      },
      reviews: {
        include: {
          reviewer: {
            include: { user: true },
          },
        },
        orderBy: { reviewedAt: "desc" },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const formatted = assignments.map((a) => ({
    id: a.id,
    status: a.status,
    dueDate: a.dueDate,
    completedAt: a.completedAt,
    task: {
      id: a.task.id,
      title: a.task.title,
      description: a.task.description,
      instructions: a.task.instructions,
      type: a.task.type,
      priority: a.task.priority,
      resourceLinks: (a.task.resourceLinks as any) || null,
      isHistorical: a.task.isHistorical,
    },
    submissions: a.submissions.map((s) => ({
      id: s.id,
      submissionNumber: s.submissionNumber,
      submissionText: s.submissionText,
      links: (s.links as any) || null,
      submittedAt: s.submittedAt,
    })),
    reviews: a.reviews.map((r) => ({
      id: r.id,
      decision: r.decision,
      feedback: r.feedback,
      reviewedAt: r.reviewedAt,
      reviewer: {
        user: {
          firstName: r.reviewer.user.firstName,
          lastName: r.reviewer.user.lastName,
          email: r.reviewer.user.email,
        },
      },
    })),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          My Onboarding Tasks & Deliverables
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Access assigned curricula, submit work deliverables, view deadline schedules, and track manager review feedback.
        </p>
      </div>

      <EmployeeTasksClient assignments={formatted} />
    </div>
  );
}
