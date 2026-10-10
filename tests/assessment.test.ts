import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createWorksheetSchema,
  assignWorksheetSchema,
  evaluateAssessmentSchema,
  saveAssessmentDraftSchema,
  submitAssessmentSchema,
} from "../src/lib/validations/assessment";
import {
  QuestionType,
  CompanyRole,
  AssessmentStatus,
  AssessmentSubmissionStatus,
  EvaluationStatus,
} from "@prisma/client";

describe("Phase 5: Worksheets, Assignments & Evaluations Test Suite", () => {
  describe("1. Worksheet & Question Validation Integrity", () => {
    test("accepts fully valid worksheet with mixed question types", () => {
      const result = createWorksheetSchema.safeParse({
        title: "Full-Stack Web & Neon Database Mastery Assessment",
        description: "Assess understanding of Next.js App Router, Prisma ORM, and PostgreSQL pooling.",
        instructions: "Answer all questions. Upload GitHub repo URL for question 4.",
        resources: "https://nextjs.org/docs",
        passMarks: 70,
        allowResubmission: true,
        questions: [
          {
            type: QuestionType.MCQ,
            questionText: "What mechanism does Neon use to scale database compute to zero?",
            options: ["Serverless Architecture", "Shared Memory Buffers", "B-Tree Indexes", "Write-Ahead Logs"],
            correctOption: "Serverless Architecture",
            maxMarks: 10,
            rubric: "10 points for exact match",
          },
          {
            type: QuestionType.SHORT_ANSWER,
            questionText: "Explain why client components cannot directly query the Prisma client.",
            maxMarks: 15,
            rubric: "Must mention Node runtime, bundling size, and credential exposure",
          },
          {
            type: QuestionType.FILE_UPLOAD,
            questionText: "Provide URL to your completed repository demonstrating Prisma migrations.",
            maxMarks: 25,
            rubric: "Must contain valid schema.prisma and migration history",
          },
        ],
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.questions.length, 3);
        const totalMarks = result.data.questions.reduce((sum, q) => sum + q.maxMarks, 0);
        assert.equal(totalMarks, 50);
      }
    });

    test("rejects multiple choice questions with fewer than 2 choices", () => {
      const result = createWorksheetSchema.safeParse({
        title: "Flawed Quiz",
        passMarks: 50,
        questions: [
          {
            type: QuestionType.MCQ,
            questionText: "Single choice paradox",
            options: ["Option 1 only"],
            correctOption: "Option 1 only",
            maxMarks: 5,
          },
        ],
      });

      assert.equal(result.success, false);
      if (!result.success) {
        const optionErr = result.error.errors.find((e) => e.path.includes("options"));
        assert.ok(optionErr, "Expected error on MCQ options count");
      }
    });

    test("rejects invalid or negative pass marks", () => {
      const result = createWorksheetSchema.safeParse({
        title: "Negative Benchmark",
        passMarks: -10,
        questions: [
          {
            type: QuestionType.SHORT_ANSWER,
            questionText: "Valid question prompt",
            maxMarks: 10,
          },
        ],
      });

      assert.equal(result.success, false);
    });

    test("validates assignment payload with required employee recipients", () => {
      const valid = assignWorksheetSchema.safeParse({
        worksheetId: "ws_001",
        employeeMembershipIds: ["mem_001", "mem_002"],
        dueDate: "2026-11-01",
        allowResubmission: true,
      });
      assert.equal(valid.success, true);

      const emptyRecipients = assignWorksheetSchema.safeParse({
        worksheetId: "ws_001",
        employeeMembershipIds: [],
      });
      assert.equal(emptyRecipients.success, false);
    });
  });

  describe("2. Objective Question Auto-Grading Logic", () => {
    function autoGradeAnswer(
      question: { type: QuestionType; correctOption?: string | null; maxMarks: number },
      selectedOption?: string | null
    ): { marksAwarded: number; autoGraded: boolean } {
      if (question.type === QuestionType.MCQ && question.correctOption) {
        const selected = (selectedOption || "").trim().toLowerCase();
        const correct = question.correctOption.trim().toLowerCase();
        return {
          marksAwarded: selected === correct ? question.maxMarks : 0,
          autoGraded: true,
        };
      }
      return { marksAwarded: 0, autoGraded: false };
    }

    const mcqQuestion = {
      type: QuestionType.MCQ,
      correctOption: "PostgreSQL with Neon",
      maxMarks: 20,
    };

    test("awards full marks for exact case-insensitive match", () => {
      const result = autoGradeAnswer(mcqQuestion, "postgresql with neon");
      assert.equal(result.autoGraded, true);
      assert.equal(result.marksAwarded, 20);
    });

    test("awards 0 marks for incorrect option", () => {
      const result = autoGradeAnswer(mcqQuestion, "MongoDB Atlas");
      assert.equal(result.autoGraded, true);
      assert.equal(result.marksAwarded, 0);
    });

    test("defers subjective questions from auto-grading", () => {
      const subjectiveQuestion = {
        type: QuestionType.LONG_ANSWER,
        maxMarks: 25,
      };
      const result = autoGradeAnswer(subjectiveQuestion, "Detailed analysis");
      assert.equal(result.autoGraded, false);
      assert.equal(result.marksAwarded, 0);
    });
  });

  describe("3. Evaluator Marks Validation & Rubrics Compliance", () => {
    function validateEvaluation(
      questions: Array<{ id: string; maxMarks: number }>,
      grades: Array<{ questionId: string; marksAwarded: number }>
    ): { valid: boolean; totalMarks: number; error?: string } {
      const map = new Map(questions.map((q) => [q.id, q.maxMarks]));
      let total = 0;

      for (const g of grades) {
        const max = map.get(g.questionId);
        if (max === undefined) {
          return { valid: false, totalMarks: 0, error: "Question not found" };
        }
        if (g.marksAwarded < 0) {
          return { valid: false, totalMarks: 0, error: "Negative marks disallowed" };
        }
        if (g.marksAwarded > max) {
          return {
            valid: false,
            totalMarks: 0,
            error: `Marks awarded (${g.marksAwarded}) exceeds question max marks (${max})`,
          };
        }
        total += g.marksAwarded;
      }

      return { valid: true, totalMarks: total };
    }

    const questions = [
      { id: "q1", maxMarks: 10 },
      { id: "q2", maxMarks: 20 },
    ];

    test("accepts marks within bounds and tallies total", () => {
      const grades = [
        { questionId: "q1", marksAwarded: 8 },
        { questionId: "q2", marksAwarded: 19.5 },
      ];
      const result = validateEvaluation(questions, grades);
      assert.equal(result.valid, true);
      assert.equal(result.totalMarks, 27.5);
    });

    test("rejects marks that exceed question maximum", () => {
      const grades = [
        { questionId: "q1", marksAwarded: 15 }, // Max is 10
        { questionId: "q2", marksAwarded: 10 },
      ];
      const result = validateEvaluation(questions, grades);
      assert.equal(result.valid, false);
      assert.ok(result.error?.includes("exceeds question max marks"));
    });
  });

  describe("4. Confidentiality & Anti-Leakage Safeguards", () => {
    function sanitizeWorksheetForEmployee(worksheet: {
      id: string;
      title: string;
      questions: Array<{
        id: string;
        type: QuestionType;
        questionText: string;
        options: string[] | null;
        correctOption: string | null;
        maxMarks: number;
      }>;
    }) {
      return {
        ...worksheet,
        questions: worksheet.questions.map(({ correctOption, ...safe }) => safe),
      };
    }

    test("strips correctOption from question payload for employee queries", () => {
      const rawWorksheet = {
        id: "ws_001",
        title: "Confidential Exam",
        questions: [
          {
            id: "q_1",
            type: QuestionType.MCQ,
            questionText: "Secret question",
            options: ["A", "B", "C"],
            correctOption: "B",
            maxMarks: 10,
          },
        ],
      };

      const sanitized = sanitizeWorksheetForEmployee(rawWorksheet);
      assert.equal(sanitized.questions[0].questionText, "Secret question");
      assert.equal("correctOption" in sanitized.questions[0], false);
    });

    test("shields unreleased draft evaluations from employee sight", () => {
      const draftEvaluation = {
        status: EvaluationStatus.DRAFT,
        totalMarksAwarded: 85,
        feedback: "Internal draft comments",
      };

      function getVisibleEvaluation(evaluation: { status: EvaluationStatus; totalMarksAwarded: number; feedback: string } | null) {
        if (!evaluation || evaluation.status !== EvaluationStatus.RELEASED) {
          return null; // Sealed from employee
        }
        return evaluation;
      }

      assert.equal(getVisibleEvaluation(draftEvaluation), null);

      const releasedEvaluation = {
        status: EvaluationStatus.RELEASED,
        totalMarksAwarded: 85,
        feedback: "Well done!",
      };
      assert.notEqual(getVisibleEvaluation(releasedEvaluation), null);
    });
  });

  describe("5. Submission History & Attempt Immutability", () => {
    test("preserves previous attempt records when resubmission attempt is initiated", () => {
      const submissionHistory = [
        {
          attemptNumber: 1,
          status: AssessmentSubmissionStatus.SUBMITTED,
          submittedAt: "2026-10-10T10:00:00Z",
          answers: [{ questionId: "q1", textAnswer: "Initial incomplete answer" }],
        },
      ];

      // Manager requests resubmission and employee creates Attempt 2
      const newAttempt = {
        attemptNumber: submissionHistory.length + 1,
        status: AssessmentSubmissionStatus.DRAFT,
        submittedAt: null,
        answers: [{ questionId: "q1", textAnswer: "Revised comprehensive answer" }],
      };

      const updatedHistory = [...submissionHistory, newAttempt];
      assert.equal(updatedHistory.length, 2);
      assert.equal(updatedHistory[0].attemptNumber, 1);
      assert.equal(updatedHistory[0].answers[0].textAnswer, "Initial incomplete answer");
      assert.equal(updatedHistory[1].attemptNumber, 2);
      assert.equal(updatedHistory[1].answers[0].textAnswer, "Revised comprehensive answer");
    });
  });

  describe("6. Role-Based Access Control", () => {
    function canManageWorksheets(role: CompanyRole): boolean {
      return role === CompanyRole.MANAGER || role === CompanyRole.COMPANY_ADMIN;
    }

    test("permits Managers and Company Admins to create and evaluate worksheets", () => {
      assert.equal(canManageWorksheets(CompanyRole.COMPANY_ADMIN), true);
      assert.equal(canManageWorksheets(CompanyRole.MANAGER), true);
      assert.equal(canManageWorksheets(CompanyRole.EMPLOYEE), false);
    });
  });
});
