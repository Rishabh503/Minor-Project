import { z } from "zod";
import { QuestionType, AssessmentStatus, AssessmentSubmissionStatus, EvaluationStatus } from "@prisma/client";

export const questionItemSchema = z
  .object({
    id: z.string().optional(),
    type: z.nativeEnum(QuestionType),
    questionText: z
      .string()
      .min(3, "Question text must be at least 3 characters")
      .max(3000, "Question text cannot exceed 3000 characters")
      .trim(),
    options: z.array(z.string().trim()).optional().default([]),
    correctOption: z.string().trim().optional().or(z.literal("")),
    maxMarks: z
      .number({ invalid_type_error: "Marks must be a valid number" })
      .min(0.5, "Minimum marks per question is 0.5")
      .max(100, "Maximum marks per question is 100"),
    rubric: z.string().max(1000).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.type === QuestionType.MCQ) {
        return (data.options && data.options.length >= 2);
      }
      return true;
    },
    {
      message: "Multiple choice questions must have at least 2 choices",
      path: ["options"],
    }
  );

export const createWorksheetSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters")
    .trim(),
  description: z.string().max(2000).optional().or(z.literal("")),
  instructions: z.string().max(4000).optional().or(z.literal("")),
  resources: z.string().max(2000).optional().or(z.literal("")),
  passMarks: z
    .number({ invalid_type_error: "Pass marks must be a valid number" })
    .min(0, "Pass marks cannot be negative")
    .default(50),
  allowResubmission: z.boolean().default(false),
  questions: z
    .array(questionItemSchema)
    .min(1, "At least one question is required for the worksheet"),
});

export const assignWorksheetSchema = z.object({
  worksheetId: z.string().min(1, "Worksheet ID is required"),
  employeeMembershipIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one employee to assign"),
  dueDate: z.string().optional().or(z.literal("")),
  allowResubmission: z.boolean().default(false),
});

export const answerSubmissionItemSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.string().optional().or(z.literal("")),
  textAnswer: z.string().optional().or(z.literal("")),
  fileUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const saveAssessmentDraftSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  answers: z.array(answerSubmissionItemSchema),
});

export const submitAssessmentSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  employeeNotes: z.string().max(1000).optional().or(z.literal("")),
  answers: z.array(answerSubmissionItemSchema),
});

export const questionGradeItemSchema = z.object({
  questionId: z.string().min(1),
  marksAwarded: z
    .number({ invalid_type_error: "Marks must be a valid number" })
    .min(0, "Marks cannot be negative"),
  feedback: z.string().max(1000).optional().or(z.literal("")),
});

export const evaluateAssessmentSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  releaseNow: z.boolean().default(true),
  overallFeedback: z.string().max(3000).optional().or(z.literal("")),
  questionGrades: z.array(questionGradeItemSchema),
});

export const requestResubmissionSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  reason: z.string().max(1000).optional().or(z.literal("")),
});

export type QuestionItemInput = z.infer<typeof questionItemSchema>;
export type CreateWorksheetInput = z.infer<typeof createWorksheetSchema>;
export type AssignWorksheetInput = z.infer<typeof assignWorksheetSchema>;
export type SaveAssessmentDraftInput = z.infer<typeof saveAssessmentDraftSchema>;
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;
export type QuestionGradeItemInput = z.infer<typeof questionGradeItemSchema>;
export type EvaluateAssessmentInput = z.infer<typeof evaluateAssessmentSchema>;
export type RequestResubmissionInput = z.infer<typeof requestResubmissionSchema>;
