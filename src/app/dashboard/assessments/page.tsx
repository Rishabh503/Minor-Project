import { requireActiveCompanyContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole, MembershipStatus, EvaluationStatus, AssessmentSubmissionStatus } from "@prisma/client";
import { AssessmentManagerView } from "@/components/assessments/AssessmentManagerView";
import { AssessmentEmployeeView } from "@/components/assessments/AssessmentEmployeeView";

export default async function AssessmentsPage() {
  const context = await requireActiveCompanyContext();
  const companyId = context.company!.id;
  const membershipId = context.membership!.id;
  const isManagerOrAdmin =
    context.membership!.role === CompanyRole.MANAGER ||
    context.membership!.role === CompanyRole.COMPANY_ADMIN ||
    context.isPlatformAdmin;

  if (isManagerOrAdmin) {
    // 1. Manager & Admin View
    const [worksheets, pendingSubmissions, allSubmissions, availableMembers] = await Promise.all([
      db.worksheet.findMany({
        where: { companyId },
        include: {
          questions: { orderBy: { order: "asc" } },
          assignments: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.assessmentSubmission.findMany({
        where: {
          assignment: { companyId },
          status: AssessmentSubmissionStatus.SUBMITTED,
          OR: [
            { evaluation: null },
            { evaluation: { status: EvaluationStatus.DRAFT } },
          ],
        },
        include: {
          assignment: {
            include: {
              employee: { include: { user: true } },
              worksheet: {
                include: {
                  questions: { orderBy: { order: "asc" } },
                },
              },
            },
          },
          answers: true,
          evaluation: true,
        },
        orderBy: { submittedAt: "asc" },
      }),
      db.assessmentSubmission.findMany({
        where: {
          assignment: { companyId },
          status: AssessmentSubmissionStatus.SUBMITTED,
        },
        include: {
          assignment: {
            include: {
              employee: { include: { user: true } },
              worksheet: {
                include: {
                  questions: { orderBy: { order: "asc" } },
                },
              },
            },
          },
          answers: true,
          evaluation: true,
        },
        orderBy: { submittedAt: "desc" },
      }),
      db.companyMembership.findMany({
        where: {
          companyId,
          status: MembershipStatus.ACTIVE,
        },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
            Worksheets, Assessments & Evaluations
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Create structured assessment rubrics, evaluate candidate responses with auto-grading, and release marks for {context.company!.name}.
          </p>
        </div>

        <AssessmentManagerView
          worksheets={worksheets as any}
          pendingSubmissions={pendingSubmissions as any}
          allSubmissions={allSubmissions as any}
          availableMembers={availableMembers.map((m) => ({
            id: m.id,
            name: [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.email,
            email: m.user.email,
          }))}
        />
      </div>
    );
  }

  // 2. Employee View
  const rawAssignments = await db.assessmentAssignment.findMany({
    where: {
      companyId,
      employeeMembershipId: membershipId,
    },
    include: {
      worksheet: {
        include: {
          questions: { orderBy: { order: "asc" } },
        },
      },
      submissions: {
        orderBy: { attemptNumber: "desc" },
        take: 1,
        include: {
          answers: true,
          evaluation: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Strict Sanitization: Never expose correctOption or unreleased evaluation marks!
  const sanitizedAssignments = rawAssignments.map((assignment) => {
    const latest = assignment.submissions[0];
    const isReleased = latest?.evaluation?.status === EvaluationStatus.RELEASED;

    return {
      id: assignment.id,
      status: assignment.status,
      dueDate: assignment.dueDate,
      allowResubmission: assignment.allowResubmission,
      worksheet: {
        id: assignment.worksheet.id,
        title: assignment.worksheet.title,
        description: assignment.worksheet.description,
        instructions: assignment.worksheet.instructions,
        resources: assignment.worksheet.resources,
        maxMarks: assignment.worksheet.maxMarks,
        passMarks: assignment.worksheet.passMarks,
        questions: assignment.worksheet.questions.map((q) => ({
          id: q.id,
          type: q.type,
          questionText: q.questionText,
          options: q.options,
          // CRITICAL: correctOption is excluded!
          maxMarks: q.maxMarks,
          order: q.order,
          rubric: q.rubric,
        })),
      },
      latestSubmission: latest
        ? {
            id: latest.id,
            attemptNumber: latest.attemptNumber,
            status: latest.status,
            submittedAt: latest.submittedAt,
            employeeNotes: latest.employeeNotes,
            answers: latest.answers.map((a) => ({
              id: a.id,
              questionId: a.questionId,
              selectedOption: a.selectedOption,
              textAnswer: a.textAnswer,
              fileUrl: a.fileUrl,
              // Only reveal marksAwarded and feedback if evaluation has been RELEASED
              marksAwarded: isReleased ? a.marksAwarded : null,
              feedback: isReleased ? a.feedback : null,
            })),
            evaluation: isReleased ? latest.evaluation : null,
          }
        : null,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Worksheets & Training Evaluations
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Complete your assigned curriculum worksheets, track feedback, and review evaluated submissions for {context.company!.name}.
        </p>
      </div>

      <AssessmentEmployeeView assignments={sanitizedAssignments as any} />
    </div>
  );
}
