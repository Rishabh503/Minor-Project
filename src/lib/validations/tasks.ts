import { z } from "zod";
import { TaskType, TaskPriority, AssignmentStatus, ReviewDecision } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(120, "Task title cannot exceed 120 characters")
    .trim(),
  description: z.string().max(1000).optional().or(z.literal("")),
  instructions: z.string().max(3000).optional().or(z.literal("")),
  type: z.nativeEnum(TaskType, {
    errorMap: () => ({ message: "Please select a valid task type" }),
  }),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  startDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  resourceLinks: z.string().optional().or(z.literal("")),
  isTemplate: z.boolean().default(false),
  isHistorical: z.boolean().default(false),
  assigneeMode: z.enum(["individual", "all", "department", "batch"]).default("individual"),
  targetId: z.string().optional().or(z.literal("")),
  assigneeIds: z.array(z.string()).optional(),
});

export const submitTaskWorkSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  submissionText: z.string().max(4000).optional().or(z.literal("")),
  links: z.string().optional().or(z.literal("")),
});

export const reviewSubmissionSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  submissionId: z.string().optional().or(z.literal("")),
  decision: z.nativeEnum(ReviewDecision, {
    errorMap: () => ({ message: "Decision must be APPROVED, CHANGES_REQUESTED, or FEEDBACK_ONLY" }),
  }),
  feedback: z
    .string()
    .min(2, "Feedback note must be at least 2 characters")
    .max(2000, "Feedback cannot exceed 2000 characters")
    .trim(),
});

export const importHistoricalRecordSchema = z.object({
  title: z
    .string()
    .min(2, "Activity title must be at least 2 characters")
    .max(120, "Activity title cannot exceed 120 characters"),
  description: z.string().max(1000).optional().or(z.literal("")),
  completionDate: z.string().min(1, "Completion date is required"),
  employeeMembershipIds: z
    .array(z.string())
    .min(1, "Please select at least one employee who completed this record"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type SubmitTaskWorkInput = z.infer<typeof submitTaskWorkSchema>;
export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;
export type ImportHistoricalRecordInput = z.infer<typeof importHistoricalRecordSchema>;
