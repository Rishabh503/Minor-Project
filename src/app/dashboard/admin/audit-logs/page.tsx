import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlobalRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export default async function AdminAuditLogsPage() {
  const { dbUser } = await requireAuth();
  if (dbUser.globalRole !== GlobalRole.PLATFORM_ADMIN) {
    redirect("/dashboard");
  }

  const logs = await db.auditLog.findMany({
    include: {
      actor: true,
      company: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Global Platform Audit Trail
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Platform-wide audit record tracking operations across all client organizations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Event Log ({logs.length})</CardTitle>
          <CardDescription>
            Chronological audit events recorded from server actions and administrative workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-canvas-subtle/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-brand-muted">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="warning">{log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-text">
                      {log.entityType}
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-muted">
                      {log.actor?.email || "System"}
                    </td>
                    <td className="px-4 py-3 text-xs text-editorial-900">
                      {log.company?.name || "Global Platform"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-brand-muted max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
