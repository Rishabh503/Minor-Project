"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth, getOrCreateDbUser } from "@/lib/auth";
import { createCompanySchema, completeProfileSchema } from "@/lib/validations";
import { logAuditEvent } from "@/lib/audit";
import { sendWelcomeOnboardingEmail } from "@/lib/email";
import { CompanyRole, OnboardingStatus } from "@prisma/client";

export async function createCompanyAction(formData: FormData) {
  const { dbUser } = await requireAuth();

  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    domain: formData.get("domain") || "",
  };

  const parsed = createCompanySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { name, slug, domain } = parsed.data;

  // Check slug uniqueness
  const existingCompany = await db.company.findUnique({
    where: { slug },
  });

  if (existingCompany) {
    return {
      error: "An organization with this workspace URL identifier already exists.",
    };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Create company
      const company = await tx.company.create({
        data: {
          name,
          slug,
          domain: domain || null,
        },
      });

      // 2. Create default departments
      const engDept = await tx.department.create({
        data: {
          companyId: company.id,
          name: "Engineering & Product",
          code: "ENG",
          description: "Technical product architecture and development",
        },
      });

      await tx.department.create({
        data: {
          companyId: company.id,
          name: "Human Resources & Operations",
          code: "HRO",
          description: "People operations, talent, and compliance",
        },
      });

      // 3. Create CompanyMembership with COMPANY_ADMIN
      const membership = await tx.companyMembership.create({
        data: {
          userId: dbUser.id,
          companyId: company.id,
          role: CompanyRole.COMPANY_ADMIN,
          status: "ACTIVE",
        },
      });

      // 4. Create initial EmployeeProfile
      await tx.employeeProfile.create({
        data: {
          membershipId: membership.id,
          departmentId: engDept.id,
          jobTitle: "Founding Administrator",
          onboardingStatus: OnboardingStatus.IN_PROGRESS,
        },
      });

      return { company, membership };
    });

    // 5. Audit Log
    await logAuditEvent({
      action: "COMPANY_CREATED",
      entityType: "Company",
      entityId: result.company.id,
      companyId: result.company.id,
      actorId: dbUser.id,
      metadata: { name: result.company.name, slug: result.company.slug },
    });
  } catch (err: any) {
    console.error("Failed to create organization:", err);
    return { error: err.message || "Failed to create organization." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function completeEmployeeProfileAction(formData: FormData) {
  const { dbUser } = await requireAuth();

  const raw = {
    jobTitle: formData.get("jobTitle"),
    departmentId: formData.get("departmentId") || "",
    phoneNumber: formData.get("phoneNumber") || "",
    location: formData.get("location") || "",
    bio: formData.get("bio") || "",
  };

  const parsed = completeProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { jobTitle, departmentId, phoneNumber, location, bio } = parsed.data;

  // Retrieve user's primary membership
  const membership = await db.companyMembership.findFirst({
    where: { userId: dbUser.id, status: "ACTIVE" },
    include: { employeeProfile: true },
  });

  if (!membership) {
    return {
      error: "You are not affiliated with an active organization. Please create or join one first.",
    };
  }

  try {
    const updatedProfile = await db.employeeProfile.upsert({
      where: { membershipId: membership.id },
      update: {
        jobTitle,
        departmentId: departmentId || null,
        phoneNumber: phoneNumber || null,
        location: location || null,
        bio: bio || null,
        onboardingStatus: OnboardingStatus.COMPLETED,
        onboardingCompletedAt: new Date(),
      },
      create: {
        membershipId: membership.id,
        jobTitle,
        departmentId: departmentId || null,
        phoneNumber: phoneNumber || null,
        location: location || null,
        bio: bio || null,
        onboardingStatus: OnboardingStatus.COMPLETED,
        onboardingCompletedAt: new Date(),
      },
    });

    // Send welcome onboarding email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const userDisplayName = [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ");
    
    // Fetch company name & department name for email
    const company = await db.company.findUnique({
      where: { id: membership.companyId },
      select: { name: true },
    });
    const dept = departmentId
      ? await db.department.findUnique({
          where: { id: departmentId },
          select: { name: true },
        })
      : null;

    await sendWelcomeOnboardingEmail({
      to: dbUser.email,
      userName: userDisplayName || dbUser.email,
      companyName: company?.name || "your organization",
      jobTitle,
      departmentName: dept?.name || "General Department",
      dashboardUrl: `${appUrl}/dashboard`,
    });

    await logAuditEvent({
      action: "EMPLOYEE_PROFILE_COMPLETED",
      entityType: "EmployeeProfile",
      entityId: updatedProfile.id,
      companyId: membership.companyId,
      actorId: dbUser.id,
      metadata: { jobTitle, departmentId },
    });
  } catch (err: any) {
    console.error("Failed to save employee profile:", err);
    return { error: err.message || "Failed to save profile." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
