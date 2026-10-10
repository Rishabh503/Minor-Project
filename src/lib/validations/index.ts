import { z } from "zod";
import { CompanyRole, OnboardingStatus, MembershipStatus } from "@prisma/client";

export const createCompanySchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(80, "Company name cannot exceed 80 characters")
    .trim(),
  slug: z
    .string()
    .min(2, "Workspace slug must be at least 2 characters")
    .max(50, "Workspace slug cannot exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .trim(),
  domain: z
    .string()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Invalid corporate domain format")
    .optional()
    .or(z.literal("")),
});

export const completeProfileSchema = z.object({
  jobTitle: z
    .string()
    .min(2, "Job title must be at least 2 characters")
    .max(100, "Job title cannot exceed 100 characters")
    .trim(),
  departmentId: z.string().optional().or(z.literal("")),
  phoneNumber: z
    .string()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(100, "Location is too long")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, "Department name must be at least 2 characters")
    .max(60, "Department name cannot exceed 60 characters")
    .trim(),
  code: z
    .string()
    .max(10, "Department code must be at most 10 characters")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(250, "Description cannot exceed 250 characters")
    .optional()
    .or(z.literal("")),
});

export const createTrainingBatchSchema = z.object({
  name: z
    .string()
    .min(2, "Batch name must be at least 2 characters")
    .max(80, "Batch name cannot exceed 80 characters")
    .trim(),
  code: z
    .string()
    .max(15, "Batch code must be at most 15 characters")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(250, "Description cannot exceed 250 characters")
    .optional()
    .or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Please provide a valid email address").trim(),
  role: z.nativeEnum(CompanyRole, {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
  departmentId: z.string().optional().or(z.literal("")),
  batchId: z.string().optional().or(z.literal("")),
  managerMembershipId: z.string().optional().or(z.literal("")),
  jobTitle: z.string().max(100).optional().or(z.literal("")),
});

export const updateEmployeeSchema = z.object({
  membershipId: z.string().min(1, "Membership ID is required"),
  jobTitle: z.string().max(100).optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  batchId: z.string().optional().or(z.literal("")),
  managerMembershipId: z.string().optional().or(z.literal("")),
  location: z.string().max(100).optional().or(z.literal("")),
  phoneNumber: z.string().max(20).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  onboardingStatus: z.nativeEnum(OnboardingStatus).optional(),
});

export const assignManagerSchema = z.object({
  membershipId: z.string().min(1, "Membership ID is required"),
  managerMembershipId: z.string().optional().or(z.literal("")),
});

export const toggleMemberStatusSchema = z.object({
  membershipId: z.string().min(1, "Membership ID is required"),
  status: z.nativeEnum(MembershipStatus),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreateTrainingBatchInput = z.infer<typeof createTrainingBatchSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type AssignManagerInput = z.infer<typeof assignManagerSchema>;
export type ToggleMemberStatusInput = z.infer<typeof toggleMemberStatusSchema>;
