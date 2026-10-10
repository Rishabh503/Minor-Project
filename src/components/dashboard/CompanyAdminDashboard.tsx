import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";
import { Users, FolderTree, UserPlus, CheckCircle, Clock, ShieldAlert } from "lucide-react";

interface CompanyAdminDashboardProps {
  company: {
    id: string;
    name: string;
    slug: string;
  };
  metrics: {
    totalMembers: number;
    totalDepartments: number;
    inProgressOnboardings: number;
    completedOnboardings: number;
  };
  members: Array<{
    id: string;
    role: string;
    status: string;
    createdAt: Date;
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
    employeeProfile: {
      jobTitle: string | null;
      onboardingStatus: string;
      department: { name: string } | null;
    } | null;
  }>;
  departments: Array<{
    id: string;
    name: string;
    code: string | null;
    _count: {
      employees: number;
    };
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: Date;
    actor: { email: string } | null;
  }>;
}

export function CompanyAdminDashboard({
  company,
  metrics,
  members,
  departments,
  auditLogs,
}: CompanyAdminDashboardProps) {
  const getOnboardingBadge = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="coral">In Progress</Badge>;
      default:
        return <Badge variant="neutral">Not Started</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
            {company.name} Administration
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Manage your workforce onboarding lifecycle, departmental structure, and compliance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/company/departments">
            <Button variant="outline" size="sm" className="gap-2">
              <FolderTree className="w-4 h-4 text-brand-muted" />
              Departments
            </Button>
          </Link>
          <Link href="/dashboard/company/members">
            <Button variant="accent" size="sm" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Invite Member
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-editorial-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Workforce Total</span>
              <Users className="w-4 h-4 text-editorial-800" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {metrics.totalMembers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Active memberships</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-editorial-600">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Departments</span>
              <FolderTree className="w-4 h-4 text-editorial-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {metrics.totalDepartments}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Organizational units</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-coral-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>In-Flight Onboarding</span>
              <Clock className="w-4 h-4 text-coral-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {metrics.inProgressOnboardings}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Employees actively training</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Completed Profiles</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {metrics.completedOnboardings}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Fully certified & cleared</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Members Roster */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Workforce Directory</CardTitle>
                <CardDescription>
                  Team members enrolled under {company.name}.
                </CardDescription>
              </div>
              <Link href="/dashboard/company/members">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No members found"
                  description="Begin by inviting your first team member or manager."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Onboarding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {members.slice(0, 6).map((m) => (
                        <tr key={m.id} className="hover:bg-canvas-subtle/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-editorial-900">
                              {m.user.firstName ? `${m.user.firstName} ${m.user.lastName || ""}` : m.user.email}
                            </div>
                            <div className="text-xs text-brand-muted">{m.employeeProfile?.jobTitle || m.user.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="editorial">{m.role.replace("_", " ")}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-brand-text">
                            {m.employeeProfile?.department?.name || "Unassigned"}
                          </td>
                          <td className="px-4 py-3">
                            {getOnboardingBadge(m.employeeProfile?.onboardingStatus)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Departments Panel */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Departments</CardTitle>
                <CardDescription>Structured units</CardDescription>
              </div>
              <Link href="/dashboard/company/departments">
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <EmptyState
                  icon={FolderTree}
                  title="No departments"
                  description="Set up departments to organize your teams."
                />
              ) : (
                <div className="space-y-3">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between rounded-md border border-surface-border bg-surface-raised p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-editorial-900">{dept.name}</p>
                        {dept.code && (
                          <p className="font-mono text-xs text-brand-muted">{dept.code}</p>
                        )}
                      </div>
                      <Badge variant="neutral">
                        {dept._count.employees} staff
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Logs snippet */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-editorial-700" />
                Security Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-brand-muted">No recent operations logged.</p>
              ) : (
                <div className="space-y-2.5">
                  {auditLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="text-xs">
                      <div className="flex items-center justify-between text-brand-muted font-mono text-[10px]">
                        <span>{formatDateTime(log.createdAt)}</span>
                        <span>{log.actor?.email || "System"}</span>
                      </div>
                      <p className="font-medium text-editorial-900 mt-0.5">
                        {log.action} on {log.entityType}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
