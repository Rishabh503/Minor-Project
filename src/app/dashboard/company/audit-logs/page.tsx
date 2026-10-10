import { enforceRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";
import { Shield } from "lucide-react";

export default async function CompanyAuditLogsPage() {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const auditLogs = await db.auditLog.findMany({
    where: { companyId },
    include: {
      actor: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Organization Security & Audit Trail
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Immutable audit record of administrative, role change, and profile operations performed in {context.company!.name}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Audit log entries tracked for compliance and governance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No audit entries logged"
              description="Actions performed by organization administrators and members will be recorded here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity Type</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-canvas-subtle/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-brand-muted">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="editorial">{log.action}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-brand-text">
                        {log.entityType}
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-muted">
                        {log.actor?.email || "System"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-brand-muted max-w-xs truncate">
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
