"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { enforceRole } from "@/lib/auth";
import {
  assignManagerSchema,
  updateEmployeeSchema,
  toggleMemberStatusSchema,
  createTrainingBatchSchema,
} from "@/lib/validations";
import { logAuditEvent } from "@/lib/audit";
import { CompanyRole, MembershipStatus } from "@prisma/client";

/**
 * Assigns, reassigns, or clears the primary manager for an employee.
 * Enforces company boundaries and server-side RBAC.
 */
export async function assignManagerAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const raw = {
    membershipId: formData.get("membershipId"),
    managerMembershipId: formData.get("managerMembershipId") || "",
  };

  const parsed = assignManagerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const { membershipId, managerMembershipId } = parsed.data;

  // 1. Verify target employee belongs to this company
  const targetMembership = await db.companyMembership.findFirst({
    where: { id: membershipId, companyId },
    include: { employeeProfile: true, user: true },
  });

  if (!targetMembership) {
    return { error: "Employee record not found within this organization." };
  }

  // 2. If assigning a manager, verify manager belongs to same company
  if (managerMembershipId) {
    if (managerMembershipId === membershipId) {
      return { error: "An employee cannot be assigned as their own reporting manager." };
    }

    const managerRecord = await db.companyMembership.findFirst({
      where: { id: managerMembershipId, companyId, status: MembershipStatus.ACTIVE },
      include: { user: true },
    });

    if (!managerRecord) {
      return { error: "Selected manager was not found or is not active in this organization." };
    }
  }

  try {
    const previousManagerId = targetMembership.employeeProfile?.managerMembershipId;

    await db.employeeProfile.upsert({
      where: { membershipId },
      update: {
        managerMembershipId: managerMembershipId || null,
      },
      create: {
        membershipId,
        managerMembershipId: managerMembershipId || null,
      },
    });

    await logAuditEvent({
      action: managerMembershipId ? "MANAGER_ASSIGNED" : "MANAGER_REMOVED",
      entityType: "EmployeeProfile",
      entityId: targetMembership.employeeProfile?.id || membershipId,
      companyId,
      actorId: context.dbUser.id,
      metadata: {
        employeeEmail: targetMembership.user.email,
        previousManagerId,
        newManagerId: managerMembershipId || null,
      },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to update manager assignment." };
  }

  revalidatePath(`/dashboard/company/members`);
  revalidatePath(`/dashboard/company/employees/${membershipId}`);
  return { success: true };
}

/**
 * Updates full employee profile details (department, designation, batch, location, etc.)
 */
export async function updateEmployeeRecordAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const raw = {
    membershipId: formData.get("membershipId"),
    jobTitle: formData.get("jobTitle") || "",
    departmentId: formData.get("departmentId") || "",
    batchId: formData.get("batchId") || "",
    managerMembershipId: formData.get("managerMembershipId") || "",
    location: formData.get("location") || "",
    phoneNumber: formData.get("phoneNumber") || "",
    startDate: formData.get("startDate") || "",
    onboardingStatus: formData.get("onboardingStatus") || undefined,
  };

  const parsed = updateEmployeeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const {
    membershipId,
    jobTitle,
    departmentId,
    batchId,
    managerMembershipId,
    location,
    phoneNumber,
    startDate,
    onboardingStatus,
  } = parsed.data;

  // Verify target membership belongs to active company
  const targetMembership = await db.companyMembership.findFirst({
    where: { id: membershipId, companyId },
    include: { employeeProfile: true },
  });

  if (!targetMembership) {
    return { error: "Employee record not found within this organization." };
  }

  // Validate department if provided
  if (departmentId) {
    const dept = await db.department.findFirst({
      where: { id: departmentId, companyId },
    });
    if (!dept) return { error: "Invalid department selected." };
  }

  // Validate batch if provided
  if (batchId) {
    const batch = await db.trainingBatch.findFirst({
      where: { id: batchId, companyId },
    });
    if (!batch) return { error: "Invalid training batch selected." };
  }

  // Validate manager if provided
  if (managerMembershipId) {
    if (managerMembershipId === membershipId) {
      return { error: "Employee cannot be their own manager." };
    }
    const mgr = await db.companyMembership.findFirst({
      where: { id: managerMembershipId, companyId },
    });
    if (!mgr) return { error: "Selected manager not found in company." };
  }

  try {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;

    await db.employeeProfile.upsert({
      where: { membershipId },
      update: {
        jobTitle: jobTitle || null,
        departmentId: departmentId || null,
        batchId: batchId || null,
        managerMembershipId: managerMembershipId || null,
        location: location || null,
        phoneNumber: phoneNumber || null,
        ...(parsedStartDate ? { startDate: parsedStartDate } : {}),
        ...(onboardingStatus ? { onboardingStatus } : {}),
      },
      create: {
        membershipId,
        jobTitle: jobTitle || null,
        departmentId: departmentId || null,
        batchId: batchId || null,
        managerMembershipId: managerMembershipId || null,
        location: location || null,
        phoneNumber: phoneNumber || null,
        ...(parsedStartDate ? { startDate: parsedStartDate } : {}),
        ...(onboardingStatus ? { onboardingStatus } : {}),
      },
    });

    await logAuditEvent({
      action: "EMPLOYEE_UPDATED",
      entityType: "EmployeeProfile",
      entityId: targetMembership.employeeProfile?.id || membershipId,
      companyId,
      actorId: context.dbUser.id,
      metadata: { jobTitle, departmentId, batchId, managerMembershipId },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to update employee profile." };
  }

  revalidatePath(`/dashboard/company/members`);
  revalidatePath(`/dashboard/company/employees/${membershipId}`);
  return { success: true };
}

/**
 * Activates or deactivates an employee's organizational access.
 * Historical records and audit logs are permanently preserved.
 */
export async function toggleEmployeeStatusAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const raw = {
    membershipId: formData.get("membershipId"),
    status: formData.get("status"),
  };

  const parsed = toggleMemberStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const { membershipId, status } = parsed.data;

  // Prevent self-deactivation
  if (membershipId === context.membership!.id) {
    return { error: "You cannot deactivate your own administrative membership." };
  }

  const targetMembership = await db.companyMembership.findFirst({
    where: { id: membershipId, companyId },
    include: { user: true },
  });

  if (!targetMembership) {
    return { error: "Membership record not found in this company." };
  }

  try {
    await db.companyMembership.update({
      where: { id: membershipId },
      data: { status },
    });

    await logAuditEvent({
      action: status === MembershipStatus.DEACTIVATED ? "MEMBER_DEACTIVATED" : "MEMBER_ACTIVATED",
      entityType: "CompanyMembership",
      entityId: membershipId,
      companyId,
      actorId: context.dbUser.id,
      metadata: {
        affectedEmail: targetMembership.user.email,
        oldStatus: targetMembership.status,
        newStatus: status,
      },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to update membership status." };
  }

  revalidatePath(`/dashboard/company/members`);
  revalidatePath(`/dashboard/company/employees/${membershipId}`);
  return { success: true };
}

/**
 * Creates a new training cohort / batch within the active company.
 */
export async function createTrainingBatchAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const raw = {
    name: formData.get("name"),
    code: formData.get("code") || "",
    description: formData.get("description") || "",
    startDate: formData.get("startDate") || "",
    endDate: formData.get("endDate") || "",
  };

  const parsed = createTrainingBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const { name, code, description, startDate, endDate } = parsed.data;

  // Check unique batch name in this company
  const existing = await db.trainingBatch.findUnique({
    where: {
      companyId_name: {
        companyId,
        name,
      },
    },
  });

  if (existing) {
    return { error: `Batch "${name}" already exists in this organization.` };
  }

  try {
    const batch = await db.trainingBatch.create({
      data: {
        companyId,
        name,
        code: code || null,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    await logAuditEvent({
      action: "TRAINING_BATCH_CREATED",
      entityType: "TrainingBatch",
      entityId: batch.id,
      companyId,
      actorId: context.dbUser.id,
      metadata: { name, code },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to create training batch." };
  }

  revalidatePath("/dashboard/company/tracks");
  revalidatePath("/dashboard/company/members");
  return { success: true };
}
