"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { enforceRole, requireActiveCompanyContext } from "@/lib/auth";
import {
  createTaskSchema,
  submitTaskWorkSchema,
  reviewSubmissionSchema,
  importHistoricalRecordSchema,
} from "@/lib/validations/tasks";
import { logAuditEvent } from "@/lib/audit";
import {
  CompanyRole,
  AssignmentStatus,
  TaskType,
  ReviewDecision,
  MembershipStatus,
} from "@prisma/client";

/**
 * Creates and assigns a task to one or multiple employees in a single transaction.
 */
export async function createTaskAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;
  const isCompanyAdmin = context.membership!.role === CompanyRole.COMPANY_ADMIN;

  // Extract raw form data
  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || "",
    instructions: formData.get("instructions") || "",
    type: formData.get("type"),
    priority: formData.get("priority") || "MEDIUM",
    startDate: formData.get("startDate") || "",
    dueDate: formData.get("dueDate") || "",
    resourceLinks: formData.get("resourceLinks") || "",
    isTemplate: formData.get("isTemplate") === "true",
    isHistorical: false,
    assigneeMode: formData.get("assigneeMode") || "individual",
    targetId: formData.get("targetId") || "",
    assigneeIds: formData.getAll("assigneeIds") as string[],
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const data = parsed.data;

  // Resolve target employee memberships
  let targetMembershipIds: string[] = [];

  if (data.assigneeMode === "all") {
    // If company admin, all company employees; if manager, manager's reports
    const members = await db.companyMembership.findMany({
      where: {
        companyId,
        status: MembershipStatus.ACTIVE,
        ...(isCompanyAdmin ? {} : { employeeProfile: { managerMembershipId: callerMembershipId } }),
      },
      select: { id: true },
    });
    targetMembershipIds = members.map((m) => m.id);
  } else if (data.assigneeMode === "department" && data.targetId) {
    const members = await db.companyMembership.findMany({
      where: {
        companyId,
        status: MembershipStatus.ACTIVE,
        employeeProfile: { departmentId: data.targetId },
      },
      select: { id: true },
    });
    targetMembershipIds = members.map((m) => m.id);
  } else if (data.assigneeMode === "batch" && data.targetId) {
    const members = await db.companyMembership.findMany({
      where: {
        companyId,
        status: MembershipStatus.ACTIVE,
        employeeProfile: { batchId: data.targetId },
      },
      select: { id: true },
    });
    targetMembershipIds = members.map((m) => m.id);
  } else {
    // Individual memberships
    targetMembershipIds = data.assigneeIds || [];
    if (formData.get("singleAssigneeId")) {
      targetMembershipIds = [formData.get("singleAssigneeId") as string];
    }
  }

  // Parse resource links if any
  let parsedLinks: Array<{ title: string; url: string }> = [];
  if (data.resourceLinks) {
    try {
      parsedLinks = JSON.parse(data.resourceLinks);
    } catch {
      // Allow newline separated URLs
      parsedLinks = data.resourceLinks
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((url) => ({ title: url, url }));
    }
  }

  try {
    const task = await db.$transaction(async (tx) => {
      // 1. Create Task Record
      const createdTask = await tx.task.create({
        data: {
          companyId,
          creatorMembershipId: callerMembershipId,
          title: data.title,
          description: data.description || null,
          instructions: data.instructions || null,
          type: data.type,
          priority: data.priority,
          startDate: data.startDate ? new Date(data.startDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          resourceLinks: parsedLinks.length > 0 ? (parsedLinks as any) : undefined,
          isTemplate: data.isTemplate,
          isHistorical: false,
        },
      });

      // 2. Create TaskAssignments for target members
      if (targetMembershipIds.length > 0 && !data.isTemplate) {
        await tx.taskAssignment.createMany({
          data: targetMembershipIds.map((mId) => ({
            taskId: createdTask.id,
            employeeMembershipId: mId,
            assignedByMembershipId: callerMembershipId,
            status: AssignmentStatus.NOT_STARTED,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
          })),
          skipDuplicates: true,
        });
      }

      return createdTask;
    });

    await logAuditEvent({
      action: "TASK_CREATED_AND_ASSIGNED",
      entityType: "Task",
      entityId: task.id,
      companyId,
      actorId: context.dbUser.id,
      metadata: {
        title: task.title,
        type: task.type,
        assignedCount: targetMembershipIds.length,
      },
    });
  } catch (err: any) {
    console.error("Failed to create task:", err);
    return { error: err.message || "Failed to create task." };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/employee/tasks");
  return { success: true };
}

/**
 * Submits employee work, links, or text notes for an assigned task.
 * Enforces employee ownership and prevents invalid transitions.
 */
export async function submitTaskWorkAction(formData: FormData) {
  const context = await requireActiveCompanyContext();
  const callerMembershipId = context.membership!.id;

  const raw = {
    assignmentId: formData.get("assignmentId"),
    submissionText: formData.get("submissionText") || "",
    links: formData.get("links") || "",
  };

  const parsed = submitTaskWorkSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const { assignmentId, submissionText, links } = parsed.data;

  // 1. Fetch assignment and verify ownership
  const assignment = await db.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      task: true,
      submissions: { orderBy: { submissionNumber: "desc" } },
    },
  });

  if (!assignment) {
    return { error: "Task assignment was not found." };
  }

  if (assignment.employeeMembershipId !== callerMembershipId) {
    return { error: "403_FORBIDDEN: You can only submit work for your own assigned tasks." };
  }

  // 2. Prevent invalid status transitions
  if (assignment.status === AssignmentStatus.COMPLETED) {
    return { error: "This task has already been certified as completed." };
  }

  const nextSubmissionNumber = (assignment.submissions[0]?.submissionNumber || 0) + 1;

  // Parse links
  let parsedLinks: Array<{ title: string; url: string }> = [];
  if (links) {
    parsedLinks = links
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((url) => ({ title: url, url }));
  }

  try {
    await db.$transaction(async (tx) => {
      // Record submission
      await tx.taskSubmission.create({
        data: {
          assignmentId: assignment.id,
          submissionNumber: nextSubmissionNumber,
          submissionText: submissionText || null,
          links: parsedLinks.length > 0 ? (parsedLinks as any) : undefined,
        },
      });

      // Advance assignment state to SUBMITTED
      await tx.taskAssignment.update({
        where: { id: assignment.id },
        data: {
          status: AssignmentStatus.SUBMITTED,
        },
      });
    });

    await logAuditEvent({
      action: "TASK_WORK_SUBMITTED",
      entityType: "TaskAssignment",
      entityId: assignment.id,
      companyId: context.company!.id,
      actorId: context.dbUser.id,
      metadata: {
        taskTitle: assignment.task.title,
        submissionNumber: nextSubmissionNumber,
      },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to submit work." };
  }

  revalidatePath("/dashboard/employee/tasks");
  revalidatePath("/dashboard/manager/reviews");
  return { success: true };
}

/**
 * Manager review submission: Approve (COMPLETED), Request Changes (CHANGES_REQUESTED), or Feedback.
 */
export async function reviewSubmissionAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const callerMembershipId = context.membership!.id;
  const isCompanyAdmin = context.membership!.role === CompanyRole.COMPANY_ADMIN;

  const raw = {
    assignmentId: formData.get("assignmentId"),
    submissionId: formData.get("submissionId") || "",
    decision: formData.get("decision"),
    feedback: formData.get("feedback"),
  };

  const parsed = reviewSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const { assignmentId, submissionId, decision, feedback } = parsed.data;

  // 1. Fetch assignment and verify manager scope
  const assignment = await db.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      task: true,
      employeeMembership: {
        include: {
          employeeProfile: true,
          user: true,
        },
      },
    },
  });

  if (!assignment) {
    return { error: "Task assignment was not found." };
  }

  // If caller is Manager, verify target employee reports to them or is in their department
  if (!isCompanyAdmin) {
    const isDirectReport =
      assignment.employeeMembership.employeeProfile?.managerMembershipId === callerMembershipId;
    if (!isDirectReport) {
      return { error: "403_FORBIDDEN: You can only review submissions for your assigned direct reports." };
    }
  }

  // 2. Determine next status
  let nextStatus: AssignmentStatus = assignment.status;
  let completedAt: Date | null = assignment.completedAt;

  if (decision === ReviewDecision.APPROVED) {
    nextStatus = AssignmentStatus.COMPLETED;
    completedAt = new Date();
  } else if (decision === ReviewDecision.CHANGES_REQUESTED) {
    nextStatus = AssignmentStatus.CHANGES_REQUESTED;
    completedAt = null;
  } else {
    nextStatus = AssignmentStatus.UNDER_REVIEW;
  }

  try {
    await db.$transaction(async (tx) => {
      // 1. Record Review History
      await tx.taskReview.create({
        data: {
          assignmentId: assignment.id,
          submissionId: submissionId || null,
          reviewerMembershipId: callerMembershipId,
          decision,
          feedback,
        },
      });

      // 2. Update Assignment state
      await tx.taskAssignment.update({
        where: { id: assignment.id },
        data: {
          status: nextStatus,
          completedAt,
        },
      });
    });

    await logAuditEvent({
      action: "TASK_SUBMISSION_REVIEWED",
      entityType: "TaskAssignment",
      entityId: assignment.id,
      companyId: context.company!.id,
      actorId: context.dbUser.id,
      metadata: {
        taskTitle: assignment.task.title,
        employeeEmail: assignment.employeeMembership.user.email,
        decision,
      },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to record review." };
  }

  revalidatePath("/dashboard/manager/reviews");
  revalidatePath("/dashboard/employee/tasks");
  revalidatePath("/dashboard/tasks");
  return { success: true };
}

/**
 * Imports past training activities as completed historical records.
 * Explicitly separates historical records from pending work.
 */
export async function importHistoricalRecordAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || "",
    completionDate: formData.get("completionDate") || "",
    employeeMembershipIds: formData.getAll("employeeMembershipIds") as string[],
  };

  const parsed = importHistoricalRecordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const { title, description, completionDate, employeeMembershipIds } = parsed.data;

  try {
    const compDate = new Date(completionDate);

    await db.$transaction(async (tx) => {
      // 1. Create Historical Task
      const task = await tx.task.create({
        data: {
          companyId,
          creatorMembershipId: callerMembershipId,
          title,
          description: description || null,
          type: TaskType.HISTORICAL_RECORD,
          isHistorical: true,
          dueDate: compDate,
        },
      });

      // 2. Create completed assignments directly without pending tasks
      await tx.taskAssignment.createMany({
        data: employeeMembershipIds.map((mId) => ({
          taskId: task.id,
          employeeMembershipId: mId,
          assignedByMembershipId: callerMembershipId,
          status: AssignmentStatus.COMPLETED,
          completedAt: compDate,
        })),
        skipDuplicates: true,
      });
    });

    await logAuditEvent({
      action: "HISTORICAL_TRAINING_IMPORTED",
      entityType: "Task",
      companyId,
      actorId: context.dbUser.id,
      metadata: { title, recordCount: employeeMembershipIds.length },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to import historical record." };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/employee/tasks");
  return { success: true };
}

/**
 * Duplicates a task for reuse.
 */
export async function duplicateTaskAction(taskId: string) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const original = await db.task.findFirst({
    where: { id: taskId, companyId },
  });

  if (!original) return { error: "Task not found." };

  try {
    const copy = await db.task.create({
      data: {
        companyId,
        creatorMembershipId: context.membership!.id,
        title: `Copy of ${original.title}`,
        description: original.description,
        instructions: original.instructions,
        type: original.type,
        priority: original.priority,
        resourceLinks: (original.resourceLinks as any) ?? undefined,
        isTemplate: original.isTemplate,
        isHistorical: false,
      },
    });

    await logAuditEvent({
      action: "TASK_DUPLICATED",
      entityType: "Task",
      entityId: copy.id,
      companyId,
      actorId: context.dbUser.id,
      metadata: { originalId: taskId, newTitle: copy.title },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to duplicate task." };
  }

  revalidatePath("/dashboard/tasks");
  return { success: true };
}

/**
 * Archives an existing task.
 */
export async function archiveTaskAction(taskId: string) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const original = await db.task.findFirst({
    where: { id: taskId, companyId },
  });

  if (!original) return { error: "Task not found." };

  try {
    await db.task.update({
      where: { id: taskId },
      data: { isArchived: true },
    });

    await logAuditEvent({
      action: "TASK_ARCHIVED",
      entityType: "Task",
      entityId: taskId,
      companyId,
      actorId: context.dbUser.id,
    });
  } catch (err: any) {
    return { error: err.message || "Failed to archive task." };
  }

  revalidatePath("/dashboard/tasks");
  return { success: true };
}
