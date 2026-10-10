import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireActiveCompanyContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole } from "@prisma/client";
import { EmployeeDetailClient } from "./EmployeeDetailClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import { ChevronLeft, Shield } from "lucide-react";

interface EmployeePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EmployeeDetailPage({ params }: EmployeePageProps) {
  const { id } = await params;
  const context = await requireActiveCompanyContext();
  const companyId = context.company!.id;

  // 1. Fetch target membership ensuring it belongs to active company
  const targetMember = await db.companyMembership.findFirst({
    where: { id, companyId },
    include: {
      user: true,
      employeeProfile: {
        include: {
          department: true,
          batch: true,
          manager: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!targetMember) {
    notFound();
  }

  // 2. Strict Permission Verification
  const userRole = context.membership?.role;
  const isCompanyAdmin = userRole === CompanyRole.COMPANY_ADMIN || context.isPlatformAdmin;
  const isAssignedManager =
    userRole === CompanyRole.MANAGER &&
    targetMember.employeeProfile?.managerMembershipId === context.membership?.id;
  const isSelf = context.membership?.id === id;

  // If not admin, not their assigned manager, and not self -> Deny access
  if (!isCompanyAdmin && !isAssignedManager && !isSelf) {
    redirect("/dashboard");
  }

  // 3. Fetch departments, batches, and managers for edit dialogs
  const [departments, batches, managers, auditLogs] = await Promise.all([
    isCompanyAdmin
      ? db.department.findMany({
          where: { companyId },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    isCompanyAdmin
      ? db.trainingBatch.findMany({
          where: { companyId },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    isCompanyAdmin
      ? db.companyMembership.findMany({
          where: {
            companyId,
            role: { in: [CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN] },
            status: "ACTIVE",
          },
          include: { user: true },
        })
      : Promise.resolve([]),
    db.auditLog.findMany({
      where: {
        companyId,
        OR: [
          { entityId: id },
          { entityId: targetMember.employeeProfile?.id },
          { metadata: { path: ["employeeEmail"], equals: targetMember.user.email } },
        ],
      },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-brand-muted">
        <Link
          href="/dashboard/company/members"
          className="flex items-center gap-1 hover:text-editorial-800 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Workforce Directory
        </Link>
      </div>

      {/* Header Profile Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
            {targetMember.user.firstName
              ? `${targetMember.user.firstName} ${targetMember.user.lastName || ""}`
              : targetMember.user.email}
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            {targetMember.user.email} • Enrolled in {context.company!.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="editorial">{targetMember.role.replace("_", " ")}</Badge>
          <Badge variant={targetMember.status === "DEACTIVATED" ? "warning" : "success"}>
            {targetMember.status}
          </Badge>
        </div>
      </div>

      {/* Interactive Profile Management Component */}
      <EmployeeDetailClient
        member={targetMember as any}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        batches={batches.map((b) => ({ id: b.id, name: b.name }))}
        managers={managers.map((m) => ({
          id: m.id,
          name: [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.email,
        }))}
        canEdit={isCompanyAdmin}
      />

      {/* Audit Trail for this Employee */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-editorial-800" />
            <CardTitle className="text-base">Employee Audit & Governance History</CardTitle>
          </div>
          <CardDescription>
            Chronological record of manager allocations, profile changes, and administrative actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-brand-muted">No historical events recorded for this employee.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                  <tr>
                    <th className="px-4 py-2.5">Timestamp</th>
                    <th className="px-4 py-2.5">Action</th>
                    <th className="px-4 py-2.5">Authorized By</th>
                    <th className="px-4 py-2.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-xs">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-canvas-subtle/50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-brand-muted">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="neutral">{log.action}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-brand-text">
                        {log.actor?.email || "System"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-brand-muted max-w-xs truncate">
                        {log.metadata ? JSON.stringify(log.metadata) : "—"}
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
  );
}
