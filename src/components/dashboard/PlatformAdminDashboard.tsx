import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";
import { Building2, Shield, Users, Activity } from "lucide-react";

interface PlatformAdminDashboardProps {
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    status: string;
    createdAt: Date;
    _count: {
      memberships: number;
      departments: number;
    };
  }>;
  totalUsers: number;
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: Date;
    actor: { email: string } | null;
    company: { name: string } | null;
  }>;
}

export function PlatformAdminDashboard({
  companies,
  totalUsers,
  auditLogs,
}: PlatformAdminDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Platform Administration
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Global multi-tenant governance, organization management, and platform audit trail.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-editorial-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Organizations</span>
              <Building2 className="w-4 h-4 text-editorial-700" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {companies.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Active enterprise tenants</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-editorial-600">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Registered Users</span>
              <Users className="w-4 h-4 text-editorial-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Across all registered tenants</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-coral-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Security Audits</span>
              <Shield className="w-4 h-4 text-coral-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {auditLogs.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Recorded audit events</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Platform Health</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-800">
              Operational
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">PostgreSQL & Auth online</p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Organizations</CardTitle>
          <CardDescription>
            Tenants registered on the platform with membership counts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No organizations found"
              description="No tenant companies have been created on this platform yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                  <tr>
                    <th className="px-4 py-3">Company Name</th>
                    <th className="px-4 py-3">Workspace Slug</th>
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {companies.map((c) => (
                    <tr key={c.id} className="hover:bg-canvas-subtle/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-editorial-900">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-brand-muted">{c.slug}</td>
                      <td className="px-4 py-3 text-brand-muted">{c.domain || "—"}</td>
                      <td className="px-4 py-3 font-medium text-brand-text">
                        {c._count.memberships}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="editorial">{c.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-muted">
                        {formatDateTime(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle>Global Audit Events</CardTitle>
          <CardDescription>
            System-level audit trail documenting security-sensitive operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No audit events logged"
              description="Operational events will be recorded here automatically."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target Entity</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Company</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-canvas-subtle/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-brand-muted">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{log.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-brand-text">
                        {log.entityType}
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-muted">
                        {log.actor?.email || "System"}
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-muted">
                        {log.company?.name || "Global"}
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
