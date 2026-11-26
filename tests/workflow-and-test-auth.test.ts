import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { TEST_ACCESS_PASSWORD, TEST_PERSONAS } from "../src/lib/test-users";
import { PRIVATE_SIMULATION_PERSONAS } from "../src/lib/private-test-users";
import { computeCompositePerformanceScore, sortLeaderboard } from "../src/lib/analytics";
import { CompanyRole, GlobalRole } from "@prisma/client";

describe("Test Auth & Workflow Integrity Test Suite", () => {
  describe("1. Test Sign-In Password & Persona Configuration", () => {
    test("verifies test access passcode is 'minorproject'", () => {
      assert.equal(TEST_ACCESS_PASSWORD, "minorproject");
    });

    test("contains all required identities across Platform, Company Admin, Managers, and Employees", () => {
      const roles = TEST_PERSONAS.map((p) => p.role);
      assert.ok(roles.includes("PLATFORM_ADMIN"), "Must have Platform Admin");
      assert.ok(roles.includes("COMPANY_ADMIN"), "Must have Company Admin");
      assert.ok(roles.includes("MANAGER"), "Must have Manager");
      assert.ok(roles.includes("EMPLOYEE"), "Must have Employee");
      assert.equal(TEST_PERSONAS.length, 8, "Expected 8 public test personas");
    });

    test("all test personas have valid emails, titles, and highlight workflows", () => {
      for (const p of TEST_PERSONAS) {
        assert.ok(p.email.includes("@"), `Invalid email for ${p.idKey}`);
        assert.ok(p.title.length > 3, `Title too short for ${p.idKey}`);
        assert.ok(p.highlightWorkflows.length >= 2, `Must have at least 2 testable workflows for ${p.idKey}`);
      }
    });

    test("one-company simulation has a company admin and employee in the same workspace", () => {
      const demoAdmin = PRIVATE_SIMULATION_PERSONAS.find((p) => p.idKey === "simulation_admin");
      const demoEmployee = PRIVATE_SIMULATION_PERSONAS.find((p) => p.idKey === "simulation_employee");
      assert.equal(demoAdmin?.role, "COMPANY_ADMIN");
      assert.equal(demoEmployee?.role, "EMPLOYEE");
      assert.equal(demoAdmin?.companyName, "Ascent Demo Workspace");
      assert.equal(demoEmployee?.companyName, demoAdmin?.companyName);
      assert.equal(PRIVATE_SIMULATION_PERSONAS.length, 2);
      assert.ok(!TEST_PERSONAS.some((p) => p.email === demoAdmin?.email || p.email === demoEmployee?.email));
    });

    test("identifies Star Performer Jordan Kim as top employee persona", () => {
      const jordan = TEST_PERSONAS.find((p) => p.email === "jordan.hire@acme.tech");
      assert.ok(jordan, "Jordan Kim must exist");
      assert.equal(jordan?.role, "EMPLOYEE");
      assert.equal(jordan?.onboardingStatus, "COMPLETED");
    });

    test("identifies Active Dev Marcus Vance with changes requested workflow", () => {
      const marcus = TEST_PERSONAS.find((p) => p.email === "marcus.dev@acme.tech");
      assert.ok(marcus, "Marcus Vance must exist");
      assert.equal(marcus?.role, "EMPLOYEE");
      assert.equal(marcus?.onboardingStatus, "IN_PROGRESS");
    });
  });

  describe("2. Seeded Performance Analytics & Workflow Ranking", () => {
    test("accurately calculates Jordan Kim's #1 score with 92% assessment and 100% on-time tasks", () => {
      // 92% assessment, 100% task completion, 100% on-time
      const score = computeCompositePerformanceScore(92, 100, 100);
      assert.equal(score, Math.round(0.45 * 92 + 0.35 * 100 + 0.20 * 100)); // 41.4 + 35 + 20 = 96.4 -> 96
      assert.equal(score, 96);
    });

    test("accurately calculates Marcus Vance's score with 76% assessment and 67% task completion", () => {
      const score = computeCompositePerformanceScore(76, 67, 100);
      assert.equal(score, Math.round(0.45 * 76 + 0.35 * 67 + 0.20 * 100)); // 34.2 + 23.45 + 20 = 77.65 -> 78
      assert.equal(score, 78);
    });

    test("sorts seeded employees on leaderboard deterministically", () => {
      const leaderboard = sortLeaderboard([
        {
          membershipId: "m_marcus",
          name: "Marcus Vance",
          email: "marcus.dev@acme.tech",
          departmentName: "Engineering & Architecture",
          batchName: "Spring 2026 Engineering Cohort",
          totalAssignedTasks: 3,
          completedTasks: 0,
          overdueTasks: 0,
          onTimeTasks: 0,
          taskCompletionRate: 33,
          onTimeRate: 100,
          totalAssignedAssessments: 1,
          gradedAssessments: 1,
          assessmentAverageScore: 76,
          pendingReviews: 1,
          performanceScore: 78,
        },
        {
          membershipId: "m_jordan",
          name: "Jordan Kim",
          email: "jordan.hire@acme.tech",
          departmentName: "Engineering & Architecture",
          batchName: "Spring 2026 Engineering Cohort",
          totalAssignedTasks: 3,
          completedTasks: 3,
          overdueTasks: 0,
          onTimeTasks: 3,
          taskCompletionRate: 100,
          onTimeRate: 100,
          totalAssignedAssessments: 1,
          gradedAssessments: 1,
          assessmentAverageScore: 92,
          pendingReviews: 0,
          performanceScore: 96,
        },
        {
          membershipId: "m_elena",
          name: "Elena Rostova",
          email: "elena.rookie@acme.tech",
          departmentName: "Engineering & Architecture",
          batchName: "2026 Graduate Fast-Track",
          totalAssignedTasks: 2,
          completedTasks: 0,
          overdueTasks: 0,
          onTimeTasks: 0,
          taskCompletionRate: 0,
          onTimeRate: null,
          totalAssignedAssessments: 1,
          gradedAssessments: 0,
          assessmentAverageScore: null,
          pendingReviews: 0,
          performanceScore: null,
        },
      ]);

      assert.equal(leaderboard[0].email, "jordan.hire@acme.tech");
      assert.equal(leaderboard[1].email, "marcus.dev@acme.tech");
      assert.equal(leaderboard[2].email, "elena.rookie@acme.tech");
    });
  });
});
