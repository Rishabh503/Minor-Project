import { requireActiveCompanyContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole } from "@prisma/client";
import { calculateCompanyAnalytics } from "@/lib/analytics";
import { AnalyticsDashboardView } from "@/components/analytics/AnalyticsDashboardView";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Shield, Building, Users, CheckCircle, FileText } from "lucide-react";

interface AnalyticsPageProps {
  searchParams: Promise<{
    departmentId?: string;
    batchId?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const context = await requireActiveCompanyContext();
  const resolvedSearchParams = await searchParams;

  // 1. Platform Admin View: Operational platform-level metrics only (no private employee submissions)
  if (context.isPlatformAdmin) {
    const [
      totalCompanies,
      totalUsers,
      totalTasks,
      totalEvaluations,
      activeWorksheets,
    ] = await Promise.all([
      db.company.count(),
      db.user.count(),
      db.task.count(),
      db.assessmentEvaluation.count({ where: { status: "RELEASED" } }),
      db.worksheet.count(),
    ]);

    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-2 border-b border-surface-border pb-5">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
              Platform-Level Operational Intelligence
            </h1>
            <Badge variant="editorial">Platform Admin</Badge>
          </div>
          <p className="text-sm text-brand-muted">
            Aggregated system-wide telemetry across all tenant organizations. Private employee submissions and individual grading notes are restricted by tenant isolation boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-warm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Total Organizations
                  </p>
                  <p className="text-2xl font-bold font-heading text-editorial-900 mt-2">
                    {totalCompanies}
                  </p>
                </div>
                <div className="rounded-full bg-editorial-100 p-2.5 text-editorial-700">
                  <Building className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-brand-muted">Active enterprise tenants</p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Global User Accounts
                  </p>
                  <p className="text-2xl font-bold font-heading text-editorial-900 mt-2">
                    {totalUsers}
                  </p>
                </div>
                <div className="rounded-full bg-blue-50 p-2.5 text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-brand-muted">Across all client companies</p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Total Tasks Created
                  </p>
                  <p className="text-2xl font-bold font-heading text-editorial-900 mt-2">
                    {totalTasks}
                  </p>
                </div>
                <div className="rounded-full bg-emerald-50 p-2.5 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-brand-muted">Platform training activities</p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Completed Evaluations
                  </p>
                  <p className="text-2xl font-bold font-heading text-editorial-900 mt-2">
                    {totalEvaluations}
                  </p>
                </div>
                <div className="rounded-full bg-coral-50 p-2.5 text-coral-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-brand-muted">
                {activeWorksheets} total worksheets authored
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-editorial-200 bg-surface shadow-warm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-editorial-700" />
              <CardTitle className="text-base text-editorial-900">
                Tenant Data Privacy Guarantee
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              In accordance with enterprise data protection regulations, individual employee submission texts, attached files, and private manager grading notes are accessible only within tenant company scopes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const companyId = context.company!.id;
  const currentMembershipId = context.membership!.id;
  const role = context.membership!.role;

  // Retrieve filterable departments and cohort batches for the company
  const [departments, batches] = await Promise.all([
    db.department.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.trainingBatch.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Determine query scoping options based on role
  let analyticsOptions: {
    departmentId?: string;
    batchId?: string;
    managerMembershipId?: string;
  } = {
    departmentId: resolvedSearchParams.departmentId,
    batchId: resolvedSearchParams.batchId,
  };

  let scopeTitle = `${context.company!.name} Performance Analytics`;
  let scopeSubtitle = "Company-wide performance metrics, completion rates, and ranked leaderboards.";

  if (role === CompanyRole.MANAGER) {
    // Managers are strictly scoped to the direct reports they manage
    analyticsOptions.managerMembershipId = currentMembershipId;
    scopeTitle = "Direct Reports Performance & Leaderboard";
    scopeSubtitle = "Analytics for employees you directly manage and evaluate.";
  } else if (role === CompanyRole.EMPLOYEE) {
    scopeTitle = "Employee Performance & Ranking";
    scopeSubtitle = "Track your learning progress, task completion velocity, and company standing.";
  }

  const summary = await calculateCompanyAnalytics(companyId, analyticsOptions);

  return (
    <AnalyticsDashboardView
      summary={summary}
      departments={departments}
      batches={batches}
      currentMembershipId={currentMembershipId}
      userRole={role}
      scopeTitle={scopeTitle}
      scopeSubtitle={scopeSubtitle}
      selectedDepartmentId={resolvedSearchParams.departmentId || "ALL"}
      selectedBatchId={resolvedSearchParams.batchId || "ALL"}
    />
  );
}
