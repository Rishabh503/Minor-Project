"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { enforceRole, requireActiveCompanyContext } from "@/lib/auth";
import {
  createWorksheetSchema,
  assignWorksheetSchema,
  saveAssessmentDraftSchema,
  submitAssessmentSchema,
  evaluateAssessmentSchema,
  requestResubmissionSchema,
} from "@/lib/validations/assessment";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import {
  CompanyRole,
  QuestionType,
  AssessmentStatus,
  AssessmentSubmissionStatus,
  EvaluationStatus,
} from "@prisma/client";

/**
 * Creates a new Worksheet with configured questions, rubrics, and max marks.
 */
export async function createWorksheetAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const instructions = (formData.get("instructions") as string) || "";
  const resources = (formData.get("resources") as string) || "";
  const passMarks = parseFloat((formData.get("passMarks") as string) || "50");
  const allowResubmission = formData.get("allowResubmission") === "true";
  const questionsRaw = formData.get("questions") as string;

  let questions = [];
  try {
    questions = JSON.parse(questionsRaw || "[]");
  } catch (err) {
    return { error: "Invalid question structure format" };
  }

  const parsed = createWorksheetSchema.safeParse({
    title,
    description,
    instructions,
    resources,
    passMarks,
    allowResubmission,
    questions,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const data = parsed.data;
  const totalMaxMarks = data.questions.reduce((sum, q) => sum + q.maxMarks, 0);

  try {
    const worksheet = await db.$transaction(async (tx) => {
      const created = await tx.worksheet.create({
        data: {
          companyId,
          creatorMembershipId: callerMembershipId,
          title: data.title,
          description: data.description || null,
          instructions: data.instructions || null,
          resources: data.resources || null,
          maxMarks: totalMaxMarks,
          passMarks: data.passMarks,
          allowResubmission: data.allowResubmission,
          version: 1,
          isPublished: true,
          questions: {
            create: data.questions.map((q, idx) => ({
              type: q.type,
              questionText: q.questionText,
              options: q.type === QuestionType.MCQ ? (q.options as any) : undefined,
              correctOption: q.type === QuestionType.MCQ ? q.correctOption || null : null,
              maxMarks: q.maxMarks,
              order: idx + 1,
              rubric: q.rubric || null,
            })),
          },
        },
      });

      return created;
    });

    await logAuditEvent({
      companyId,
      actorId: context.dbUser.id,
      action: "WORKSHEET_CREATED",
      entityType: "Worksheet",
      entityId: worksheet.id,
      metadata: {
        title: worksheet.title,
        questionsCount: data.questions.length,
        maxMarks: totalMaxMarks,
      },
    });

    revalidatePath("/dashboard/assessments");
    return { success: true, worksheetId: worksheet.id };
  } catch (error) {
    console.error("Error creating worksheet:", error);
    return { error: "Failed to create worksheet. Please verify database constraints." };
  }
}

/**
 * Assigns a worksheet to selected employees.
 */
export async function assignWorksheetAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;

  const worksheetId = formData.get("worksheetId") as string;
  const employeeMembershipIds = formData.getAll("employeeMembershipIds") as string[];
  const dueDate = (formData.get("dueDate") as string) || "";
  const allowResubmission = formData.get("allowResubmission") === "true";

  const parsed = assignWorksheetSchema.safeParse({
    worksheetId,
    employeeMembershipIds,
    dueDate,
    allowResubmission,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const data = parsed.data;

  // Verify worksheet belongs to company
  const worksheet = await db.worksheet.findFirst({
    where: { id: data.worksheetId, companyId },
  });

  if (!worksheet) {
    return { error: "Worksheet not found or unauthorized" };
  }

  try {
    const dueDateTime = data.dueDate ? new Date(data.dueDate) : null;

    let assignedCount = 0;
    for (const empId of data.employeeMembershipIds) {
      const assignment = await db.assessmentAssignment.upsert({
        where: {
          worksheetId_employeeMembershipId: {
            worksheetId: worksheet.id,
            employeeMembershipId: empId,
          },
        },
        update: {
          dueDate: dueDateTime,
          allowResubmission: data.allowResubmission,
        },
        create: {
          companyId,
          worksheetId: worksheet.id,
          employeeMembershipId: empId,
          assignedByMembershipId: callerMembershipId,
          dueDate: dueDateTime,
          allowResubmission: data.allowResubmission,
          status: AssessmentStatus.PENDING,
        },
        include: {
          employee: { include: { user: true } },
        },
      });

      assignedCount++;

      // Send invite email
      if (assignment.employee?.user?.email) {
        sendEmail({
          to: assignment.employee.user.email,
          subject: `New Assessment Assigned: ${worksheet.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0c1e32;">New Assessment Assigned</h2>
              <p>Hello ${assignment.employee.user.firstName || "there"},</p>
              <p>You have been assigned a new assessment: <strong>${worksheet.title}</strong>.</p>
              ${dueDateTime ? `<p><strong>Due Date:</strong> ${dueDateTime.toLocaleDateString()}</p>` : ""}
              <p>Total Max Marks: <strong>${worksheet.maxMarks}</strong></p>
              <p>Please log in to your dashboard to complete the worksheet.</p>
            </div>
          `,
        }).catch((err) => console.error("Email notification failed:", err));
      }
    }

    await logAuditEvent({
      companyId,
      actorId: context.dbUser.id,
      action: "ASSESSMENT_ASSIGNED",
      entityType: "Worksheet",
      entityId: worksheet.id,
      metadata: {
        worksheetTitle: worksheet.title,
        recipientsCount: assignedCount,
      },
    });

    revalidatePath("/dashboard/assessments");
    return { success: true, count: assignedCount };
  } catch (error) {
    console.error("Error assigning worksheet:", error);
    return { error: "Failed to assign worksheet" };
  }
}

/**
 * Saves draft answers for an employee without finalizing submission.
 */
export async function saveAssessmentDraftAction(formData: FormData) {
  const context = await requireActiveCompanyContext();
  const callerMembershipId = context.membership!.id;

  const assignmentId = formData.get("assignmentId") as string;
  const answersRaw = formData.get("answers") as string;

  let answers = [];
  try {
    answers = JSON.parse(answersRaw || "[]");
  } catch (err) {
    return { error: "Invalid answers format" };
  }

  const parsed = saveAssessmentDraftSchema.safeParse({ assignmentId, answers });
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const assignment = await db.assessmentAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      submissions: {
        orderBy: { attemptNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!assignment || assignment.employeeMembershipId !== callerMembershipId) {
    return { error: "Assessment assignment not found or unauthorized" };
  }

  if (assignment.status === AssessmentStatus.SUBMITTED || assignment.status === AssessmentStatus.EVALUATED) {
    return { error: "Cannot modify a submission that is already submitted or evaluated" };
  }

  try {
    await db.$transaction(async (tx) => {
      // Find latest draft or create one
      let submission = assignment.submissions[0];
      if (!submission || submission.status === AssessmentSubmissionStatus.SUBMITTED) {
        submission = await tx.assessmentSubmission.create({
          data: {
            assignmentId,
            attemptNumber: (submission?.attemptNumber || 0) + 1,
            status: AssessmentSubmissionStatus.DRAFT,
          },
        });
      }

      // Upsert answers
      for (const ans of parsed.data.answers) {
        await tx.assessmentAnswer.upsert({
          where: {
            submissionId_questionId: {
              submissionId: submission.id,
              questionId: ans.questionId,
            },
          },
          update: {
            selectedOption: ans.selectedOption || null,
            textAnswer: ans.textAnswer || null,
            fileUrl: ans.fileUrl || null,
          },
          create: {
            submissionId: submission.id,
            questionId: ans.questionId,
            selectedOption: ans.selectedOption || null,
            textAnswer: ans.textAnswer || null,
            fileUrl: ans.fileUrl || null,
          },
        });
      }

      // Update status to IN_PROGRESS if was PENDING
      if (assignment.status === AssessmentStatus.PENDING) {
        await tx.assessmentAssignment.update({
          where: { id: assignmentId },
          data: { status: AssessmentStatus.IN_PROGRESS },
        });
      }
    });

    revalidatePath("/dashboard/assessments");
    return { success: true };
  } catch (error) {
    console.error("Error saving draft:", error);
    return { error: "Failed to save assessment draft" };
  }
}

/**
 * Submits employee answers with objective MCQ auto-grading.
 */
export async function submitAssessmentAction(formData: FormData) {
  const context = await requireActiveCompanyContext();
  const callerMembershipId = context.membership!.id;

  const assignmentId = formData.get("assignmentId") as string;
  const employeeNotes = (formData.get("employeeNotes") as string) || "";
  const answersRaw = formData.get("answers") as string;

  let answers = [];
  try {
    answers = JSON.parse(answersRaw || "[]");
  } catch (err) {
    return { error: "Invalid answers format" };
  }

  const parsed = submitAssessmentSchema.safeParse({ assignmentId, employeeNotes, answers });
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const assignment = await db.assessmentAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      worksheet: {
        include: { questions: true },
      },
      submissions: {
        orderBy: { attemptNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!assignment || assignment.employeeMembershipId !== callerMembershipId) {
    return { error: "Assessment assignment not found or unauthorized" };
  }

  if (assignment.status === AssessmentStatus.SUBMITTED || assignment.status === AssessmentStatus.EVALUATED) {
    return { error: "This assessment has already been submitted or evaluated" };
  }

  const questionsMap = new Map(assignment.worksheet.questions.map((q) => [q.id, q]));

  try {
    await db.$transaction(async (tx) => {
      // Find latest draft or create new attempt
      let submission = assignment.submissions[0];
      if (!submission || submission.status === AssessmentSubmissionStatus.SUBMITTED) {
        submission = await tx.assessmentSubmission.create({
          data: {
            assignmentId,
            attemptNumber: (submission?.attemptNumber || 0) + 1,
            status: AssessmentSubmissionStatus.SUBMITTED,
            submittedAt: new Date(),
            employeeNotes: parsed.data.employeeNotes || null,
          },
        });
      } else {
        await tx.assessmentSubmission.update({
          where: { id: submission.id },
          data: {
            status: AssessmentSubmissionStatus.SUBMITTED,
            submittedAt: new Date(),
            employeeNotes: parsed.data.employeeNotes || null,
          },
        });
      }

      // Upsert answers with MCQ auto-grading
      for (const ans of parsed.data.answers) {
        const question = questionsMap.get(ans.questionId);
        let marksAwarded: number | null = null;
        let autoGraded = false;

        // Auto-grade MCQ if correctOption is defined
        if (question && question.type === QuestionType.MCQ && question.correctOption) {
          const selected = (ans.selectedOption || "").trim().toLowerCase();
          const correct = question.correctOption.trim().toLowerCase();
          marksAwarded = selected === correct ? question.maxMarks : 0;
          autoGraded = true;
        }

        await tx.assessmentAnswer.upsert({
          where: {
            submissionId_questionId: {
              submissionId: submission.id,
              questionId: ans.questionId,
            },
          },
          update: {
            selectedOption: ans.selectedOption || null,
            textAnswer: ans.textAnswer || null,
            fileUrl: ans.fileUrl || null,
            marksAwarded,
            autoGraded,
          },
          create: {
            submissionId: submission.id,
            questionId: ans.questionId,
            selectedOption: ans.selectedOption || null,
            textAnswer: ans.textAnswer || null,
            fileUrl: ans.fileUrl || null,
            marksAwarded,
            autoGraded,
          },
        });
      }

      // Update assignment status
      await tx.assessmentAssignment.update({
        where: { id: assignmentId },
        data: { status: AssessmentStatus.SUBMITTED },
      });
    });

    await logAuditEvent({
      companyId: context.company!.id,
      actorId: context.dbUser.id,
      action: "ASSESSMENT_SUBMITTED",
      entityType: "AssessmentAssignment",
      entityId: assignment.id,
      metadata: {
        worksheetTitle: assignment.worksheet.title,
        attempt: (assignment.submissions[0]?.attemptNumber || 0) + 1,
      },
    });

    revalidatePath("/dashboard/assessments");
    return { success: true };
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return { error: "Failed to submit assessment" };
  }
}

/**
 * Manager evaluates a submission, records marks & rubrics, and optionally releases grades.
 */
export async function evaluateAssessmentAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;

  const submissionId = formData.get("submissionId") as string;
  const releaseNow = formData.get("releaseNow") === "true";
  const overallFeedback = (formData.get("overallFeedback") as string) || "";
  const questionGradesRaw = formData.get("questionGrades") as string;

  let questionGrades = [];
  try {
    questionGrades = JSON.parse(questionGradesRaw || "[]");
  } catch (err) {
    return { error: "Invalid question grades format" };
  }

  const parsed = evaluateAssessmentSchema.safeParse({
    submissionId,
    releaseNow,
    overallFeedback,
    questionGrades,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const submission = await db.assessmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          worksheet: {
            include: { questions: true },
          },
          employee: { include: { user: true } },
        },
      },
      answers: true,
    },
  });

  if (!submission || submission.assignment.companyId !== companyId) {
    return { error: "Submission not found or unauthorized" };
  }

  const questionsMap = new Map(submission.assignment.worksheet.questions.map((q) => [q.id, q]));

  // Validate marks per question
  let totalMarksAwarded = 0;
  for (const grade of parsed.data.questionGrades) {
    const q = questionsMap.get(grade.questionId);
    if (!q) {
      return { error: `Question ${grade.questionId} does not belong to this worksheet` };
    }
    if (grade.marksAwarded > q.maxMarks) {
      return { error: `Marks awarded (${grade.marksAwarded}) exceeds maximum marks (${q.maxMarks}) for question` };
    }
    totalMarksAwarded += grade.marksAwarded;
  }

  const totalMaxMarks = submission.assignment.worksheet.maxMarks;

  try {
    await db.$transaction(async (tx) => {
      // 1. Update each answer's marks and feedback
      for (const grade of parsed.data.questionGrades) {
        await tx.assessmentAnswer.update({
          where: {
            submissionId_questionId: {
              submissionId,
              questionId: grade.questionId,
            },
          },
          data: {
            marksAwarded: grade.marksAwarded,
            feedback: grade.feedback || null,
          },
        });
      }

      // 2. Upsert Evaluation
      const evaluation = await tx.assessmentEvaluation.upsert({
        where: { submissionId },
        update: {
          evaluatorMembershipId: callerMembershipId,
          totalMarksAwarded,
          maxMarks: totalMaxMarks,
          status: releaseNow ? EvaluationStatus.RELEASED : EvaluationStatus.DRAFT,
          feedback: overallFeedback || null,
          evaluatedAt: new Date(),
          releasedAt: releaseNow ? new Date() : null,
        },
        create: {
          submissionId,
          evaluatorMembershipId: callerMembershipId,
          totalMarksAwarded,
          maxMarks: totalMaxMarks,
          status: releaseNow ? EvaluationStatus.RELEASED : EvaluationStatus.DRAFT,
          feedback: overallFeedback || null,
          evaluatedAt: new Date(),
          releasedAt: releaseNow ? new Date() : null,
        },
      });

      // 3. Update assignment status if released
      if (releaseNow) {
        await tx.assessmentAssignment.update({
          where: { id: submission.assignmentId },
          data: { status: AssessmentStatus.EVALUATED },
        });
      }
    });

    // 4. Send email notification if released
    if (releaseNow && submission.assignment.employee?.user?.email) {
      sendEmail({
        to: submission.assignment.employee.user.email,
        subject: `Evaluation Released: ${submission.assignment.worksheet.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0c1e32;">Evaluation Results Released</h2>
            <p>Hello ${submission.assignment.employee.user.firstName || "there"},</p>
            <p>Your assessment evaluation for <strong>${submission.assignment.worksheet.title}</strong> has been released.</p>
            <p><strong>Your Score:</strong> ${totalMarksAwarded} / ${totalMaxMarks} (${Math.round((totalMarksAwarded / totalMaxMarks) * 100)}%)</p>
            ${overallFeedback ? `<p><strong>Feedback:</strong> ${overallFeedback}</p>` : ""}
            <p>Please log in to your dashboard to review detailed question-by-question marks and evaluator notes.</p>
          </div>
        `,
      }).catch((err) => console.error("Email notification failed:", err));
    }

    await logAuditEvent({
      companyId,
      actorId: context.dbUser.id,
      action: releaseNow ? "ASSESSMENT_EVALUATION_RELEASED" : "ASSESSMENT_EVALUATION_DRAFTED",
      entityType: "AssessmentSubmission",
      entityId: submission.id,
      metadata: {
        score: totalMarksAwarded,
        maxMarks: totalMaxMarks,
        releaseNow,
      },
    });

    revalidatePath("/dashboard/assessments");
    return { success: true, released: releaseNow, totalMarks: totalMarksAwarded };
  } catch (error) {
    console.error("Error evaluating assessment:", error);
    return { error: "Failed to evaluate assessment submission" };
  }
}

/**
 * Manager requests a resubmission for an assignment while preserving submission history.
 */
export async function requestResubmissionAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const assignmentId = formData.get("assignmentId") as string;
  const reason = (formData.get("reason") as string) || "";

  const parsed = requestResubmissionSchema.safeParse({ assignmentId, reason });
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const assignment = await db.assessmentAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      worksheet: true,
      employee: { include: { user: true } },
    },
  });

  if (!assignment || assignment.companyId !== companyId) {
    return { error: "Assignment not found or unauthorized" };
  }

  if (!assignment.allowResubmission && !assignment.worksheet.allowResubmission) {
    return { error: "Resubmissions are not permitted for this assessment" };
  }

  try {
    await db.assessmentAssignment.update({
      where: { id: assignmentId },
      data: { status: AssessmentStatus.RESUBMISSION_REQUESTED },
    });

    if (assignment.employee?.user?.email) {
      sendEmail({
        to: assignment.employee.user.email,
        subject: `Resubmission Requested: ${assignment.worksheet.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #e85d42;">Resubmission Requested</h2>
            <p>Hello ${assignment.employee.user.firstName || "there"},</p>
            <p>Your manager has requested a resubmission for <strong>${assignment.worksheet.title}</strong>.</p>
            ${reason ? `<p><strong>Instructions / Remarks:</strong> ${reason}</p>` : ""}
            <p>Please log in to your dashboard to review previous feedback and submit an updated version.</p>
          </div>
        `,
      }).catch((err) => console.error("Email notification failed:", err));
    }

    await logAuditEvent({
      companyId,
      actorId: context.dbUser.id,
      action: "ASSESSMENT_RESUBMISSION_REQUESTED",
      entityType: "AssessmentAssignment",
      entityId: assignment.id,
      metadata: {
        worksheetTitle: assignment.worksheet.title,
        reason,
      },
    });

    revalidatePath("/dashboard/assessments");
    return { success: true };
  } catch (error) {
    console.error("Error requesting resubmission:", error);
    return { error: "Failed to request resubmission" };
  }
}
