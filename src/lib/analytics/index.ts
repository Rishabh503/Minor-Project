import { db } from "@/lib/db";
import { CompanyRole, AssignmentStatus, EvaluationStatus } from "@prisma/client";

export interface EmployeeMetricItem {
  membershipId: string;
  name: string;
  email: string;
  departmentName: string | null;
  batchName: string | null;
  totalAssignedTasks: number;
  completedTasks: number;
  overdueTasks: number;
  onTimeTasks: number;
  taskCompletionRate: number | null; // null if 0 assigned
  onTimeRate: number | null;         // null if 0 completed
  totalAssignedAssessments: number;
  gradedAssessments: number;
  assessmentAverageScore: number | null; // null if 0 graded (distinct from 0%)
  pendingReviews: number;
  performanceScore: number | null;   // composite weighted score, null if insufficient data
  rank?: number;
}

export const PERFORMANCE_SCORE_FORMULA = {
  name: "Standard Weighted Performance Index (0-100)",
  weights: {
    bothData: {
      assessmentWeight: 0.45,
      taskCompletionWeight: 0.35,
      onTimeWeight: 0.20,
    },
    tasksOnly: {
      taskCompletionWeight: 0.65,
      onTimeWeight: 0.35,
    },
    assessmentsOnly: {
      assessmentWeight: 1.00,
    },
  },
  rules: [
    "Assessments must have status RELEASED to count towards graded average (ungraded work excluded).",
    "Only the latest submission attempt per assessment is evaluated to prevent double-counting resubmissions.",
    "A genuine score of 0% is distinct from unranked (null), which indicates insufficient evaluation data.",
    "Ties are broken by higher assessment average, then on-time completion rate.",
  ],
};

export interface CompanyAnalyticsSummary {
  totalEmployees: number;
  totalAssignedTasks: number;
  completedTasks: number;
  overdueTasks: number;
  onTimeRate: number | null;
  taskCompletionRate: number | null;
  totalAssignedAssessments: number;
  gradedAssessments: number;
  averageAssessmentScore: number | null;
  pendingReviewsCount: number;
  upcomingEvaluationsCount: number;
  unansweredQuestionsCount: number;
  performanceTrends: Array<{
    period: string;
    completedTasksCount: number;
    gradedAssessmentsCount: number;
  }>;
  leaderboard: EmployeeMetricItem[];
}

/**
 * Pure calculation functions for composite performance score, ranking, and averages.
 */
export function computeCompositePerformanceScore(
  assessmentAverageScore: number | null,
  taskCompletionRate: number | null,
  onTimeRate: number | null
): number | null {
  if (assessmentAverageScore !== null && taskCompletionRate !== null) {
    const onTimeWeight = onTimeRate !== null ? onTimeRate : taskCompletionRate;
    return Math.round(
      0.45 * assessmentAverageScore + 0.35 * taskCompletionRate + 0.20 * onTimeWeight
    );
  } else if (taskCompletionRate !== null) {
    const onTimeWeight = onTimeRate !== null ? onTimeRate : taskCompletionRate;
    return Math.round(0.65 * taskCompletionRate + 0.35 * onTimeWeight);
  } else if (assessmentAverageScore !== null) {
    return assessmentAverageScore;
  }
  return null;
}

export function sortLeaderboard(items: EmployeeMetricItem[]): EmployeeMetricItem[] {
  const sorted = [...items].sort((a, b) => {
    if (a.performanceScore === null && b.performanceScore === null) return 0;
    if (a.performanceScore === null) return 1;
    if (b.performanceScore === null) return -1;
    if (b.performanceScore !== a.performanceScore) {
      return b.performanceScore - a.performanceScore;
    }
    const scoreA = a.assessmentAverageScore ?? -1;
    const scoreB = b.assessmentAverageScore ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    const onTimeA = a.onTimeRate ?? -1;
    const onTimeB = b.onTimeRate ?? -1;
    return onTimeB - onTimeA;
  });

  let currentRank = 1;
  sorted.forEach((m) => {
    if (m.performanceScore !== null) {
      m.rank = currentRank++;
    } else {
      m.rank = undefined;
    }
  });

  return sorted;
}

export function calculateAssessmentAverage(
  gradedItems: Array<{ maxMarks: number; marksAwarded: number }>
): number | null {
  if (gradedItems.length === 0) return null;
  const totalMax = gradedItems.reduce((acc, item) => acc + item.maxMarks, 0);
  if (totalMax <= 0) return null;
  const totalAwarded = gradedItems.reduce((acc, item) => acc + item.marksAwarded, 0);
  return Math.round((totalAwarded / totalMax) * 100);
}

/**
 * Calculates metrics and composite score for a single employee membership.
 */
export async function calculateSingleEmployeePerformance(
  membershipId: string,
  companyId: string
): Promise<EmployeeMetricItem | null> {
  const membership = await db.companyMembership.findFirst({
    where: { id: membershipId, companyId },
    include: {
      user: true,
      employeeProfile: {
        include: {
          department: true,
          batch: true,
        },
      },
    },
  });

  if (!membership) return null;

  const now = new Date();

  // 1. Task Metrics
  const taskAssignments = await db.taskAssignment.findMany({
    where: { employeeMembershipId: membershipId },
    include: {
      task: { select: { dueDate: true } },
    },
  });

  const totalAssignedTasks = taskAssignments.length;
  const completedAssignments = taskAssignments.filter(
    (a) => a.status === AssignmentStatus.COMPLETED
  );
  const completedTasks = completedAssignments.length;

  const overdueTasks = taskAssignments.filter(
    (a) =>
      a.status !== AssignmentStatus.COMPLETED &&
      a.task.dueDate &&
      new Date(a.task.dueDate).getTime() < now.getTime()
  ).length;

  const onTimeTasks = completedAssignments.filter(
    (a) =>
      !a.task.dueDate ||
      (a.completedAt && new Date(a.completedAt).getTime() <= new Date(a.task.dueDate).getTime())
  ).length;

  const taskCompletionRate =
    totalAssignedTasks > 0 ? Math.round((completedTasks / totalAssignedTasks) * 100) : null;

  const onTimeRate =
    completedTasks > 0 ? Math.round((onTimeTasks / completedTasks) * 100) : null;

  const pendingTaskReviews = taskAssignments.filter(
    (a) => a.status === AssignmentStatus.SUBMITTED || a.status === AssignmentStatus.UNDER_REVIEW
  ).length;

  // 2. Assessment Metrics (Latest attempt only to avoid double-counting resubmissions!)
  const assessmentAssignments = await db.assessmentAssignment.findMany({
    where: { employeeMembershipId: membershipId },
    include: {
      worksheet: { select: { maxMarks: true } },
      submissions: {
        orderBy: { attemptNumber: "desc" },
        take: 1,
        include: { evaluation: true },
      },
    },
  });

  const totalAssignedAssessments = assessmentAssignments.length;

  const gradedAssignments = assessmentAssignments.filter(
    (a) => a.submissions[0]?.evaluation?.status === EvaluationStatus.RELEASED
  );

  let totalMarksAwarded = 0;
  let totalMaxMarks = 0;

  gradedAssignments.forEach((a) => {
    const evalData = a.submissions[0]!.evaluation!;
    totalMarksAwarded += evalData.totalMarksAwarded;
    totalMaxMarks += a.worksheet.maxMarks;
  });

  const assessmentAverageScore =
    totalMaxMarks > 0 ? Math.round((totalMarksAwarded / totalMaxMarks) * 100) : null;

  const pendingAssessmentReviews = assessmentAssignments.filter(
    (a) =>
      a.submissions[0]?.status === "SUBMITTED" &&
      a.submissions[0]?.evaluation?.status !== EvaluationStatus.RELEASED
  ).length;

  // 3. Composite Performance Score Formula:
  // - Both tasks & graded tests: 45% Assessment + 35% Task Completion + 20% On-time Rate
  // - Only tasks: 65% Task Completion + 35% On-time Rate
  // - Only tests: 100% Assessment Average
  // - No data: null (unranked)
  // 3. Composite Performance Score Formula via pure helper
  const performanceScore = computeCompositePerformanceScore(
    assessmentAverageScore,
    taskCompletionRate,
    onTimeRate
  );

  const name =
    [membership.user.firstName, membership.user.lastName].filter(Boolean).join(" ") ||
    membership.user.email;

  return {
    membershipId,
    name,
    email: membership.user.email,
    departmentName: membership.employeeProfile?.department?.name || null,
    batchName: membership.employeeProfile?.batch?.name || null,
    totalAssignedTasks,
    completedTasks,
    overdueTasks,
    onTimeTasks,
    taskCompletionRate,
    onTimeRate,
    totalAssignedAssessments,
    gradedAssessments: gradedAssignments.length,
    assessmentAverageScore,
    pendingReviews: pendingTaskReviews + pendingAssessmentReviews,
    performanceScore,
  };
}

/**
 * Computes aggregated organization or scope metrics and leaderboards.
 */
export async function calculateCompanyAnalytics(
  companyId: string,
  options: {
    departmentId?: string;
    batchId?: string;
    managerMembershipId?: string;
  } = {}
): Promise<CompanyAnalyticsSummary> {
  // Query targeted employee profiles
  const whereProfile: any = {
    membership: {
      companyId,
      status: "ACTIVE",
    },
  };

  if (options.departmentId && options.departmentId !== "ALL") {
    whereProfile.departmentId = options.departmentId;
  }

  if (options.batchId && options.batchId !== "ALL") {
    whereProfile.batchId = options.batchId;
  }

  if (options.managerMembershipId) {
    whereProfile.managerMembershipId = options.managerMembershipId;
  }

  const profiles = await db.employeeProfile.findMany({
    where: whereProfile,
    select: { membershipId: true },
  });

  const memberMetrics: EmployeeMetricItem[] = [];

  for (const p of profiles) {
    const m = await calculateSingleEmployeePerformance(p.membershipId, companyId);
    if (m) memberMetrics.push(m);
  }

  // Sort Leaderboard using deterministic ranking helper
  const rankedLeaderboard = sortLeaderboard(memberMetrics);

  // Aggregated totals
  const totalEmployees = memberMetrics.length;
  const totalAssignedTasks = memberMetrics.reduce((s, m) => s + m.totalAssignedTasks, 0);
  const completedTasks = memberMetrics.reduce((s, m) => s + m.completedTasks, 0);
  const overdueTasks = memberMetrics.reduce((s, m) => s + m.overdueTasks, 0);
  const totalOnTime = memberMetrics.reduce((s, m) => s + m.onTimeTasks, 0);

  const taskCompletionRate =
    totalAssignedTasks > 0 ? Math.round((completedTasks / totalAssignedTasks) * 100) : null;
  const onTimeRate =
    completedTasks > 0 ? Math.round((totalOnTime / completedTasks) * 100) : null;

  const totalAssignedAssessments = memberMetrics.reduce((s, m) => s + m.totalAssignedAssessments, 0);
  const gradedAssessments = memberMetrics.reduce((s, m) => s + m.gradedAssessments, 0);

  const validAssessmentScores = memberMetrics
    .map((m) => m.assessmentAverageScore)
    .filter((s): s is number => s !== null);

  const averageAssessmentScore =
    validAssessmentScores.length > 0
      ? Math.round(validAssessmentScores.reduce((a, b) => a + b, 0) / validAssessmentScores.length)
      : null;

  const pendingReviewsCount = memberMetrics.reduce((s, m) => s + m.pendingReviews, 0);

  // Unanswered forum doubts
  const unansweredQuestionsCount = await db.forumThread.count({
    where: {
      companyId,
      status: "OPEN",
      replies: { none: {} },
    },
  });

  const memberIds = memberMetrics.map((m) => m.membershipId);
  const now = new Date();

  // Upcoming evaluations: assessments submitted awaiting manager evaluation OR upcoming active assignments
  let upcomingEvaluationsCount = 0;
  if (memberIds.length > 0) {
    const activeAssignments = await db.assessmentAssignment.findMany({
      where: {
        employeeMembershipId: { in: memberIds },
        status: { in: ["PENDING", "IN_PROGRESS", "SUBMITTED"] },
      },
      include: {
        submissions: {
          orderBy: { attemptNumber: "desc" },
          take: 1,
          include: { evaluation: true },
        },
      },
    });

    upcomingEvaluationsCount = activeAssignments.filter((a) => {
      const latestSub = a.submissions[0];
      const awaitingEval =
        latestSub?.status === "SUBMITTED" &&
        latestSub?.evaluation?.status !== EvaluationStatus.RELEASED;
      const isUpcomingDue = a.dueDate && new Date(a.dueDate).getTime() >= now.getTime();
      return awaitingEval || isUpcomingDue;
    }).length;
  }

  // 4-week completion velocity trends using actual database timestamps
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const nowMs = now.getTime();
  const periods = [
    { period: "3 Weeks Ago", start: new Date(nowMs - 4 * oneWeekMs), end: new Date(nowMs - 3 * oneWeekMs) },
    { period: "2 Weeks Ago", start: new Date(nowMs - 3 * oneWeekMs), end: new Date(nowMs - 2 * oneWeekMs) },
    { period: "Last Week", start: new Date(nowMs - 2 * oneWeekMs), end: new Date(nowMs - oneWeekMs) },
    { period: "This Week", start: new Date(nowMs - oneWeekMs), end: new Date(nowMs) },
  ];

  const performanceTrends = await Promise.all(
    periods.map(async ({ period, start, end }) => {
      if (memberIds.length === 0) {
        return { period, completedTasksCount: 0, gradedAssessmentsCount: 0 };
      }

      const completedTasksCount = await db.taskAssignment.count({
        where: {
          employeeMembershipId: { in: memberIds },
          status: AssignmentStatus.COMPLETED,
          completedAt: { gte: start, lt: end },
        },
      });

      const gradedAssessmentsCount = await db.assessmentEvaluation.count({
        where: {
          status: EvaluationStatus.RELEASED,
          releasedAt: { gte: start, lt: end },
          submission: {
            assignment: {
              employeeMembershipId: { in: memberIds },
            },
          },
        },
      });

      return {
        period,
        completedTasksCount,
        gradedAssessmentsCount,
      };
    })
  );

  return {
    totalEmployees,
    totalAssignedTasks,
    completedTasks,
    overdueTasks,
    onTimeRate,
    taskCompletionRate,
    totalAssignedAssessments,
    gradedAssessments,
    averageAssessmentScore,
    pendingReviewsCount,
    upcomingEvaluationsCount,
    unansweredQuestionsCount,
    performanceTrends,
    leaderboard: rankedLeaderboard,
  };
}
