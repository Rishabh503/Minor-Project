import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeCompositePerformanceScore,
  sortLeaderboard,
  calculateAssessmentAverage,
  PERFORMANCE_SCORE_FORMULA,
  EmployeeMetricItem,
} from "../src/lib/analytics";

describe("Phase 7: Performance Analytics & Leaderboards Test Suite", () => {
  describe("1. Composite Performance Formula & Mathematical Correctness", () => {
    test("calculates composite score when both assessments and tasks are present", () => {
      // Formula: 45% Assessment Average + 35% Task Completion + 20% On-Time Rate
      // 0.45 * 90 + 0.35 * 80 + 0.20 * 100 = 40.5 + 28.0 + 20.0 = 88.5 -> Math.round = 89
      const score = computeCompositePerformanceScore(90, 80, 100);
      assert.equal(score, 89);
    });

    test("calculates composite score with low on-time rate correctly", () => {
      // 0.45 * 80 + 0.35 * 100 + 0.20 * 20 = 36.0 + 35.0 + 4.0 = 75
      const score = computeCompositePerformanceScore(80, 100, 20);
      assert.equal(score, 75);
    });

    test("falls back to tasks-only weighting when no graded assessments exist", () => {
      // Formula: 65% Task Completion + 35% On-Time Rate
      // 0.65 * 100 + 0.35 * 80 = 65.0 + 28.0 = 93
      const score = computeCompositePerformanceScore(null, 100, 80);
      assert.equal(score, 93);
    });

    test("falls back to assessments-only weighting when no tasks are assigned", () => {
      // Formula: 100% Assessment Score
      const score = computeCompositePerformanceScore(88, null, null);
      assert.equal(score, 88);
    });

    test("returns null (unranked) when there is insufficient data", () => {
      const score = computeCompositePerformanceScore(null, null, null);
      assert.equal(score, null);
    });

    test("distinguishes genuine zero score from unranked null (insufficient data)", () => {
      // Genuine 0% on test with no tasks assigned: score should be 0, not null
      const genuineZeroAssessment = computeCompositePerformanceScore(0, null, null);
      assert.equal(genuineZeroAssessment, 0);

      // Genuine 0% on tasks with 0% on-time: score should be 0, not null
      const genuineZeroTasks = computeCompositePerformanceScore(null, 0, 0);
      assert.equal(genuineZeroTasks, 0);

      // Null data: score is null
      const insufficientData = computeCompositePerformanceScore(null, null, null);
      assert.equal(insufficientData, null);

      assert.notEqual(genuineZeroAssessment, insufficientData);
    });
  });

  describe("2. Assessment Score Averaging & Resubmission Deduplication", () => {
    test("calculates weighted average across multiple worksheets with varying max marks", () => {
      const items = [
        { maxMarks: 50, marksAwarded: 45 },  // 90%
        { maxMarks: 100, marksAwarded: 75 }, // 75%
      ];
      // Total awarded: 120, Total max: 150 -> 120 / 150 = 80%
      const avg = calculateAssessmentAverage(items);
      assert.equal(avg, 80);
    });

    test("handles genuine zero marks awarded across assessments", () => {
      const items = [
        { maxMarks: 50, marksAwarded: 0 },
        { maxMarks: 50, marksAwarded: 0 },
      ];
      const avg = calculateAssessmentAverage(items);
      assert.equal(avg, 0);
    });

    test("returns null for empty assessment records (insufficient data)", () => {
      const avg = calculateAssessmentAverage([]);
      assert.equal(avg, null);
    });

    test("prevents double-counting resubmissions by using latest attempt only", () => {
      // Simulate multiple submission attempts for an assessment
      const submissions = [
        { attemptNumber: 1, evaluation: { status: "RELEASED", totalMarksAwarded: 20 }, maxMarks: 50 },
        { attemptNumber: 2, evaluation: { status: "RELEASED", totalMarksAwarded: 45 }, maxMarks: 50 },
      ];

      // Anti-double-counting policy: only the highest attemptNumber (latest attempt) is taken
      const latestAttempt = submissions.sort((a, b) => b.attemptNumber - a.attemptNumber)[0];
      const avg = calculateAssessmentAverage([
        { maxMarks: latestAttempt.maxMarks, marksAwarded: latestAttempt.evaluation.totalMarksAwarded },
      ]);

      assert.equal(avg, 90); // 45 / 50 = 90% (attempt 1's 20 marks is not aggregated)
    });

    test("excludes unreleased and draft evaluations from graded calculations", () => {
      const rawAssessments = [
        { maxMarks: 50, evaluation: { status: "RELEASED", totalMarksAwarded: 40 } },
        { maxMarks: 50, evaluation: { status: "DRAFT", totalMarksAwarded: 10 } }, // Manager hasn't released
        { maxMarks: 50, evaluation: null }, // Ungraded
      ];

      const releasedOnly = rawAssessments
        .filter((a) => a.evaluation?.status === "RELEASED")
        .map((a) => ({ maxMarks: a.maxMarks, marksAwarded: a.evaluation!.totalMarksAwarded }));

      assert.equal(releasedOnly.length, 1);
      const avg = calculateAssessmentAverage(releasedOnly);
      assert.equal(avg, 80); // 40 / 50 = 80%
    });
  });

  describe("3. Leaderboard Ranking & Deterministic Tie-Breaking", () => {
    test("ranks employees in strictly descending order of performance score", () => {
      const items: EmployeeMetricItem[] = [
        {
          membershipId: "m1",
          name: "Alice",
          email: "alice@example.com",
          departmentName: "Engineering",
          batchName: "Cohort 1",
          totalAssignedTasks: 10,
          completedTasks: 10,
          overdueTasks: 0,
          onTimeTasks: 10,
          taskCompletionRate: 100,
          onTimeRate: 100,
          totalAssignedAssessments: 2,
          gradedAssessments: 2,
          assessmentAverageScore: 95,
          pendingReviews: 0,
          performanceScore: 98,
        },
        {
          membershipId: "m2",
          name: "Bob",
          email: "bob@example.com",
          departmentName: "Engineering",
          batchName: "Cohort 1",
          totalAssignedTasks: 10,
          completedTasks: 8,
          overdueTasks: 1,
          onTimeTasks: 7,
          taskCompletionRate: 80,
          onTimeRate: 88,
          totalAssignedAssessments: 2,
          gradedAssessments: 2,
          assessmentAverageScore: 80,
          pendingReviews: 0,
          performanceScore: 82,
        },
        {
          membershipId: "m3",
          name: "Charlie",
          email: "charlie@example.com",
          departmentName: "Product",
          batchName: "Cohort 1",
          totalAssignedTasks: 5,
          completedTasks: 5,
          overdueTasks: 0,
          onTimeTasks: 5,
          taskCompletionRate: 100,
          onTimeRate: 100,
          totalAssignedAssessments: 1,
          gradedAssessments: 1,
          assessmentAverageScore: 90,
          pendingReviews: 0,
          performanceScore: 95,
        },
      ];

      const ranked = sortLeaderboard(items);

      assert.equal(ranked[0].name, "Alice");
      assert.equal(ranked[0].rank, 1);

      assert.equal(ranked[1].name, "Charlie");
      assert.equal(ranked[1].rank, 2);

      assert.equal(ranked[2].name, "Bob");
      assert.equal(ranked[2].rank, 3);
    });

    test("breaks ties first by higher assessment score, then by on-time rate", () => {
      const items: EmployeeMetricItem[] = [
        {
          membershipId: "m1",
          name: "Dan (High Assessment)",
          email: "dan@example.com",
          departmentName: "Sales",
          batchName: null,
          totalAssignedTasks: 10,
          completedTasks: 8,
          overdueTasks: 0,
          onTimeTasks: 8,
          taskCompletionRate: 80,
          onTimeRate: 100,
          totalAssignedAssessments: 1,
          gradedAssessments: 1,
          assessmentAverageScore: 95, // higher assessment
          pendingReviews: 0,
          performanceScore: 85,
        },
        {
          membershipId: "m2",
          name: "Eve (Lower Assessment)",
          email: "eve@example.com",
          departmentName: "Sales",
          batchName: null,
          totalAssignedTasks: 10,
          completedTasks: 9,
          overdueTasks: 0,
          onTimeTasks: 9,
          taskCompletionRate: 90,
          onTimeRate: 100,
          totalAssignedAssessments: 1,
          gradedAssessments: 1,
          assessmentAverageScore: 80, // lower assessment
          pendingReviews: 0,
          performanceScore: 85, // identical composite score
        },
      ];

      const ranked = sortLeaderboard(items);

      assert.equal(ranked[0].name, "Dan (High Assessment)");
      assert.equal(ranked[0].rank, 1);
      assert.equal(ranked[1].name, "Eve (Lower Assessment)");
      assert.equal(ranked[1].rank, 2);
    });

    test("places unranked employees (insufficient data) at the end without rank", () => {
      const items: EmployeeMetricItem[] = [
        {
          membershipId: "m1",
          name: "Unranked User",
          email: "new@example.com",
          departmentName: "Design",
          batchName: null,
          totalAssignedTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          onTimeTasks: 0,
          taskCompletionRate: null,
          onTimeRate: null,
          totalAssignedAssessments: 0,
          gradedAssessments: 0,
          assessmentAverageScore: null,
          pendingReviews: 0,
          performanceScore: null, // Insufficient data
        },
        {
          membershipId: "m2",
          name: "Active User",
          email: "active@example.com",
          departmentName: "Design",
          batchName: null,
          totalAssignedTasks: 5,
          completedTasks: 4,
          overdueTasks: 0,
          onTimeTasks: 4,
          taskCompletionRate: 80,
          onTimeRate: 100,
          totalAssignedAssessments: 1,
          gradedAssessments: 1,
          assessmentAverageScore: 70,
          pendingReviews: 0,
          performanceScore: 76,
        },
      ];

      const ranked = sortLeaderboard(items);

      assert.equal(ranked[0].name, "Active User");
      assert.equal(ranked[0].rank, 1);

      assert.equal(ranked[1].name, "Unranked User");
      assert.equal(ranked[1].rank, undefined); // Unranked
    });
  });

  describe("4. Formula Documentation Metadata Integrity", () => {
    test("exports verified weighting rules and policy statements", () => {
      assert.ok(PERFORMANCE_SCORE_FORMULA.weights.bothData.assessmentWeight === 0.45);
      assert.ok(PERFORMANCE_SCORE_FORMULA.weights.bothData.taskCompletionWeight === 0.35);
      assert.ok(PERFORMANCE_SCORE_FORMULA.weights.bothData.onTimeWeight === 0.20);

      // Sum of weights for both data must equal 1.0 (100%)
      const sumBoth =
        PERFORMANCE_SCORE_FORMULA.weights.bothData.assessmentWeight +
        PERFORMANCE_SCORE_FORMULA.weights.bothData.taskCompletionWeight +
        PERFORMANCE_SCORE_FORMULA.weights.bothData.onTimeWeight;
      assert.equal(Math.round(sumBoth * 100), 100);

      // Sum of weights for tasks-only must equal 1.0 (100%)
      const sumTasks =
        PERFORMANCE_SCORE_FORMULA.weights.tasksOnly.taskCompletionWeight +
        PERFORMANCE_SCORE_FORMULA.weights.tasksOnly.onTimeWeight;
      assert.equal(Math.round(sumTasks * 100), 100);

      assert.ok(PERFORMANCE_SCORE_FORMULA.rules.length >= 3);
    });
  });
});
