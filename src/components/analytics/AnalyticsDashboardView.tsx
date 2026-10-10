"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EmployeeMetricItem,
  CompanyAnalyticsSummary,
  PERFORMANCE_SCORE_FORMULA,
} from "@/lib/analytics";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Trophy,
  Award,
  Medal,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  FileText,
  HelpCircle,
  Search,
  Filter,
  Info,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

interface AnalyticsDashboardViewProps {
  summary: CompanyAnalyticsSummary;
  departments: Array<{ id: string; name: string }>;
  batches: Array<{ id: string; name: string }>;
  currentMembershipId: string;
  userRole: string;
  scopeTitle: string;
  scopeSubtitle: string;
  selectedDepartmentId?: string;
  selectedBatchId?: string;
}

export function AnalyticsDashboardView({
  summary,
  departments,
  batches,
  currentMembershipId,
  userRole,
  scopeTitle,
  scopeSubtitle,
  selectedDepartmentId = "ALL",
  selectedBatchId = "ALL",
}: AnalyticsDashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  // Handle department / batch query param filtering
  const handleDepartmentChange = (deptId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (deptId && deptId !== "ALL") {
      params.set("departmentId", deptId);
    } else {
      params.delete("departmentId");
    }
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const handleBatchChange = (bId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (bId && bId !== "ALL") {
      params.set("batchId", bId);
    } else {
      params.delete("batchId");
    }
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  // Filter leaderboard by search term
  const filteredLeaderboard = useMemo(() => {
    if (!searchTerm.trim()) return summary.leaderboard;
    const term = searchTerm.toLowerCase();
    return summary.leaderboard.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        (m.departmentName && m.departmentName.toLowerCase().includes(term)) ||
        (m.batchName && m.batchName.toLowerCase().includes(term))
    );
  }, [summary.leaderboard, searchTerm]);

  // Current user's metric item (if employee or manager on leaderboard)
  const currentEmployeeMetric = useMemo(() => {
    return summary.leaderboard.find((m) => m.membershipId === currentMembershipId);
  }, [summary.leaderboard, currentMembershipId]);

  const maxWeeklyActivity = useMemo(() => {
    const maxTasks = Math.max(...summary.performanceTrends.map((t) => t.completedTasksCount), 1);
    const maxAssessments = Math.max(...summary.performanceTrends.map((t) => t.gradedAssessmentsCount), 1);
    return Math.max(maxTasks, maxAssessments);
  }, [summary.performanceTrends]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-surface-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
              {scopeTitle}
            </h1>
            <Badge variant="editorial" className="capitalize">
              {userRole.toLowerCase().replace("_", " ")}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-brand-muted">{scopeSubtitle}</p>
        </div>

        {/* Global Controls & Filters (For Admins and Managers) */}
        {(userRole === "COMPANY_ADMIN" || userRole === "MANAGER") && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-brand-muted mr-1">
              <Filter className="w-3.5 h-3.5 text-coral-500" />
              <span>Scope:</span>
            </div>
            <select
              value={selectedDepartmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="h-9 rounded-md border border-surface-border bg-surface px-3 py-1 text-xs font-medium text-editorial-900 focus:outline-none focus:ring-1 focus:ring-coral-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBatchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="h-9 rounded-md border border-surface-border bg-surface px-3 py-1 text-xs font-medium text-editorial-900 focus:outline-none focus:ring-1 focus:ring-coral-500"
            >
              <option value="ALL">All Cohort Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Employee Personal Scorecard (Shown prominently if user is an employee) */}
      {currentEmployeeMetric && (
        <Card className="border-editorial-200 bg-gradient-to-r from-canvas-subtle via-white to-coral-50/30 shadow-warm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-coral-500" />
                <CardTitle className="text-base text-editorial-900">
                  Your Personal Performance Standing
                </CardTitle>
              </div>
              {currentEmployeeMetric.rank ? (
                <Badge variant="coral" className="text-xs font-bold px-3 py-1">
                  Rank #{currentEmployeeMetric.rank} of {summary.leaderboard.length}
                </Badge>
              ) : (
                <Badge variant="neutral" className="text-xs">
                  Unranked (Needs Graded Work)
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Direct insights into your task completion, on-time submissions, and evaluation scores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div className="rounded-lg border border-surface-border bg-surface p-3">
                <span className="text-xs text-brand-muted block">Composite Score</span>
                <span className="text-2xl font-bold font-heading text-editorial-900">
                  {currentEmployeeMetric.performanceScore !== null
                    ? `${currentEmployeeMetric.performanceScore}%`
                    : "—"}
                </span>
                <span className="text-[11px] text-brand-muted block mt-0.5">Weighted metric</span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface p-3">
                <span className="text-xs text-brand-muted block">Tasks Completed</span>
                <span className="text-2xl font-bold font-heading text-editorial-900">
                  {currentEmployeeMetric.completedTasks} / {currentEmployeeMetric.totalAssignedTasks}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-0.5">
                  {currentEmployeeMetric.taskCompletionRate !== null
                    ? `${currentEmployeeMetric.taskCompletionRate}% rate`
                    : "No tasks"}
                </span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface p-3">
                <span className="text-xs text-brand-muted block">On-Time Submissions</span>
                <span className="text-2xl font-bold font-heading text-editorial-900">
                  {currentEmployeeMetric.onTimeRate !== null
                    ? `${currentEmployeeMetric.onTimeRate}%`
                    : "—"}
                </span>
                <span className="text-[11px] text-brand-muted block mt-0.5">
                  {currentEmployeeMetric.onTimeTasks} on-time tasks
                </span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface p-3">
                <span className="text-xs text-brand-muted block">Assessment Average</span>
                <span className="text-2xl font-bold font-heading text-editorial-900">
                  {currentEmployeeMetric.assessmentAverageScore !== null
                    ? `${currentEmployeeMetric.assessmentAverageScore}%`
                    : "—"}
                </span>
                <span className="text-[11px] text-brand-muted block mt-0.5">
                  {currentEmployeeMetric.gradedAssessments} graded test
                  {currentEmployeeMetric.gradedAssessments === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* High-Level Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Task Completion Rate */}
        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Task Completion Rate
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-heading text-editorial-900">
                    {summary.taskCompletionRate !== null ? `${summary.taskCompletionRate}%` : "—"}
                  </span>
                  <span className="text-xs text-brand-muted">
                    ({summary.completedTasks} of {summary.totalAssignedTasks})
                  </span>
                </div>
              </div>
              <div className="rounded-full bg-emerald-50 p-2.5 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            {summary.taskCompletionRate !== null && (
              <div className="mt-3 w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(summary.taskCompletionRate, 100)}%` }}
                />
              </div>
            )}
            <p className="mt-2 text-[11px] text-brand-muted">
              {summary.overdueTasks} overdue task{summary.overdueTasks === 1 ? "" : "s"} across scope
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: On-Time Rate */}
        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  On-Time Delivery
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-heading text-editorial-900">
                    {summary.onTimeRate !== null ? `${summary.onTimeRate}%` : "—"}
                  </span>
                  <span className="text-xs text-brand-muted">of finished work</span>
                </div>
              </div>
              <div className="rounded-full bg-amber-50 p-2.5 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            {summary.onTimeRate !== null && (
              <div className="mt-3 w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(summary.onTimeRate, 100)}%` }}
                />
              </div>
            )}
            <p className="mt-2 text-[11px] text-brand-muted">
              Evaluated against assignment deadlines
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Assessment Average */}
        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Assessment Average
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-heading text-editorial-900">
                    {summary.averageAssessmentScore !== null
                      ? `${summary.averageAssessmentScore}%`
                      : "—"}
                  </span>
                  <span className="text-xs text-brand-muted">
                    ({summary.gradedAssessments} graded)
                  </span>
                </div>
              </div>
              <div className="rounded-full bg-coral-50 p-2.5 text-coral-600">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            {summary.averageAssessmentScore !== null && (
              <div className="mt-3 w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-coral-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(summary.averageAssessmentScore, 100)}%` }}
                />
              </div>
            )}
            <p className="mt-2 text-[11px] text-brand-muted">
              Excludes ungraded drafts &amp; reviews
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Reviews & Evaluations */}
        <Card className="shadow-warm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Pending Reviews
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-heading text-editorial-900">
                    {summary.pendingReviewsCount}
                  </span>
                  <span className="text-xs text-brand-muted">
                    ({summary.upcomingEvaluationsCount} upcoming)
                  </span>
                </div>
              </div>
              <div className="rounded-full bg-blue-50 p-2.5 text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-brand-muted">
              <HelpCircle className="w-3.5 h-3.5 text-coral-500" />
              <span>
                {summary.unansweredQuestionsCount} unanswered doubt
                {summary.unansweredQuestionsCount === 1 ? "" : "s"} in forum
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4-Week Activity Trends & Transparent Formula Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trends Chart */}
        <Card className="lg:col-span-2 shadow-warm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-editorial-700" />
                <CardTitle className="text-base text-editorial-900">
                  Performance Trends (Last 4 Weeks)
                </CardTitle>
              </div>
              <Badge variant="neutral" className="text-xs">
                Real DB Timestamps
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Weekly volume of completed training tasks and released assessment evaluations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {summary.performanceTrends.map((t, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-editorial-800">{t.period}</span>
                    <span className="text-brand-muted">
                      {t.completedTasksCount} tasks completed &bull; {t.gradedAssessmentsCount} evaluations released
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Task progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-editorial-800 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(
                              (t.completedTasksCount / maxWeeklyActivity) * 100,
                              t.completedTasksCount > 0 ? 5 : 0
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-brand-muted w-6 text-right">
                        {t.completedTasksCount}
                      </span>
                    </div>

                    {/* Assessment progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-coral-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(
                              (t.gradedAssessmentsCount / maxWeeklyActivity) * 100,
                              t.gradedAssessmentsCount > 0 ? 5 : 0
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-brand-muted w-6 text-right">
                        {t.gradedAssessmentsCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-2 text-xs text-brand-muted border-t border-surface-border">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-editorial-800" />
                  <span>Tasks Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-coral-500" />
                  <span>Evaluations Released</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formula Transparency Card */}
        <Card className="shadow-warm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-coral-500" />
                <CardTitle className="text-base text-editorial-900">
                  Ranking Formula
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              >
                {showFormulaDetails ? "Compact" : "Details"}
              </Button>
            </div>
            <CardDescription className="text-xs">
              Rigorous, transparent weighting rules applied server-side.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-relaxed">
            <div className="rounded-md border border-editorial-200 bg-editorial-50/50 p-3 space-y-1.5">
              <p className="font-semibold text-editorial-900">Standard Composite Index (0 - 100):</p>
              <ul className="list-disc list-inside space-y-1 text-editorial-800">
                <li>
                  <span className="font-medium">45%</span> Assessment Score Average
                </li>
                <li>
                  <span className="font-medium">35%</span> Task Completion Rate
                </li>
                <li>
                  <span className="font-medium">20%</span> On-Time Delivery Rate
                </li>
              </ul>
            </div>

            {showFormulaDetails && (
              <div className="space-y-2 text-brand-muted text-[11px] pt-1">
                <p className="font-medium text-editorial-800">Boundary &amp; Fairness Rules:</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  {PERFORMANCE_SCORE_FORMULA.rules.map((rule, rIdx) => (
                    <li key={rIdx}>{rule}</li>
                  ))}
                  <li>
                    Tasks-only employees: 65% completion rate + 35% on-time delivery rate.
                  </li>
                  <li>
                    Tests-only participants: 100% assessment average.
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <Card className="shadow-warm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-base text-editorial-900">
                  Performance Leaderboard
                </CardTitle>
                <Badge variant="editorial" className="text-xs">
                  {filteredLeaderboard.length} Ranked Members
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Calculated strictly from verified assignments and released evaluations.
              </CardDescription>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-brand-muted" />
              <Input
                placeholder="Search name, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-8 bg-surface"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLeaderboard.length === 0 ? (
            <EmptyState
              title="No employees found"
              description="No employee metrics match the selected department or search filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-brand-muted uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Department &amp; Batch</th>
                    <th className="py-3 px-3">Task Completion</th>
                    <th className="py-3 px-3">On-Time Rate</th>
                    <th className="py-3 px-3">Assessment Avg</th>
                    <th className="py-3 px-3 text-right">Composite Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredLeaderboard.map((item) => {
                    const isSelf = item.membershipId === currentMembershipId;
                    const rank = item.rank;

                    return (
                      <tr
                        key={item.membershipId}
                        className={`transition-colors ${
                          isSelf ? "bg-coral-50/40 font-medium" : "hover:bg-canvas-subtle"
                        }`}
                      >
                        {/* Rank Column with Medals */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {rank === 1 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                              <Medal className="w-3.5 h-3.5 text-amber-600" />
                              #1
                            </span>
                          ) : rank === 2 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
                              <Medal className="w-3.5 h-3.5 text-slate-500" />
                              #2
                            </span>
                          ) : rank === 3 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/60 px-2 py-0.5 text-xs font-bold text-amber-900">
                              <Medal className="w-3.5 h-3.5 text-amber-700" />
                              #3
                            </span>
                          ) : rank ? (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium text-brand-muted">
                              #{rank}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 text-xs text-stone-400">
                              —
                            </span>
                          )}
                        </td>

                        {/* Name and Email */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-editorial-900 flex items-center gap-1.5">
                              {item.name}
                              {isSelf && (
                                <Badge variant="coral" className="text-[9px] px-1.5 py-0">
                                  You
                                </Badge>
                              )}
                            </span>
                            <span className="text-[11px] text-brand-muted">{item.email}</span>
                          </div>
                        </td>

                        {/* Department & Batch */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-editorial-800">
                              {item.departmentName || "No Department"}
                            </span>
                            <span className="text-[10px] text-brand-muted">
                              {item.batchName || "Standard Track"}
                            </span>
                          </div>
                        </td>

                        {/* Task Completion Rate */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {item.taskCompletionRate !== null ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-editorial-900">
                                {item.taskCompletionRate}%
                              </span>
                              <span className="text-[10px] text-brand-muted">
                                ({item.completedTasks}/{item.totalAssignedTasks})
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400">No tasks</span>
                          )}
                        </td>

                        {/* On-Time Rate */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {item.onTimeRate !== null ? (
                            <Badge
                              variant={
                                item.onTimeRate >= 80
                                  ? "success"
                                  : item.onTimeRate >= 50
                                  ? "warning"
                                  : "neutral"
                              }
                              className="text-[10px]"
                            >
                              {item.onTimeRate}% on-time
                            </Badge>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>

                        {/* Assessment Average (Distinguish 0% vs Insufficient Data) */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {item.assessmentAverageScore !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-editorial-900">
                                {item.assessmentAverageScore}%
                              </span>
                              <span className="text-[10px] text-brand-muted">
                                ({item.gradedAssessments} graded)
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">
                              Ungraded
                            </span>
                          )}
                        </td>

                        {/* Composite Performance Score */}
                        <td className="py-3 px-3 whitespace-nowrap text-right">
                          {item.performanceScore !== null ? (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                                item.performanceScore >= 85
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : item.performanceScore >= 70
                                  ? "bg-editorial-100 text-editorial-900 border border-editorial-300"
                                  : item.performanceScore >= 50
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-stone-100 text-stone-700 border border-stone-300"
                              }`}
                            >
                              {item.performanceScore}%
                            </span>
                          ) : (
                            <Badge variant="neutral" className="text-[10px]">
                              Insufficient Data
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
