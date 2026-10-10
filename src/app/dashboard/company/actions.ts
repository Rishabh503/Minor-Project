"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { enforceRole } from "@/lib/auth";
import { createDepartmentSchema, inviteMemberSchema } from "@/lib/validations";
import { logAuditEvent } from "@/lib/audit";
import { sendWorkspaceInvitationEmail } from "@/lib/email";
import { CompanyRole } from "@prisma/client";

export async function createDepartmentAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const raw = {
    name: formData.get("name"),
    code: formData.get("code") || "",
    description: formData.get("description") || "",
  };

  const parsed = createDepartmentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { name, code, description } = parsed.data;

  // Check unique department name in this company
  const existing = await db.department.findUnique({
    where: {
      companyId_name: {
        companyId,
        name,
      },
    },
  });

  if (existing) {
    return { error: `Department "${name}" already exists in this organization.` };
  }

  try {
    const dept = await db.department.create({
      data: {
        companyId,
        name,
        code: code || null,
        description: description || null,
      },
    });

    await logAuditEvent({
      action: "DEPARTMENT_CREATED",
      entityType: "Department",
      entityId: dept.id,
      companyId,
      actorId: context.dbUser.id,
      metadata: { name, code },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to create department." };
  }

  revalidatePath("/dashboard/company/departments");
  return { success: true };
}

export async function inviteMemberAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const raw = {
    email: formData.get("email"),
    role: formData.get("role"),
    departmentId: formData.get("departmentId") || "",
    batchId: formData.get("batchId") || "",
    managerMembershipId: formData.get("managerMembershipId") || "",
    jobTitle: formData.get("jobTitle") || "",
  };

  const parsed = inviteMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { email, role, departmentId, batchId, managerMembershipId, jobTitle } = parsed.data;

  try {
    // Find or create user stub
    let targetUser = await db.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      targetUser = await db.user.create({
        data: {
          clerkId: `invited_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          email,
        },
      });
    }

    // Check if membership already exists
    const existingMembership = await db.companyMembership.findUnique({
      where: {
        userId_companyId: {
          userId: targetUser.id,
          companyId,
        },
      },
    });

    if (existingMembership) {
      return { error: "This user is already a member of this organization." };
    }

    const membership = await db.companyMembership.create({
      data: {
        userId: targetUser.id,
        companyId,
        role,
        status: "ACTIVE",
      },
    });

    // Create profile
    await db.employeeProfile.create({
      data: {
        membershipId: membership.id,
        departmentId: departmentId || null,
        batchId: batchId || null,
        managerMembershipId: managerMembershipId || null,
        jobTitle: jobTitle || null,
      },
    });

    // Send official invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviterFullName = [context.dbUser.firstName, context.dbUser.lastName]
      .filter(Boolean)
      .join(" ");

    const emailResult = await sendWorkspaceInvitationEmail({
      to: email,
      inviterName: inviterFullName || context.dbUser.email,
      companyName: context.company!.name,
      role,
      inviteUrl: `${appUrl}/sign-up?company=${encodeURIComponent(context.company!.slug)}`,
    });

    await logAuditEvent({
      action: "MEMBER_INVITED",
      entityType: "CompanyMembership",
      entityId: membership.id,
      companyId,
      actorId: context.dbUser.id,
      metadata: {
        invitedEmail: email,
        role,
        emailProvider: emailResult.provider,
        emailSuccess: emailResult.success,
      },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to invite member." };
  }

  revalidatePath("/dashboard/company/members");
  return { success: true };
}
