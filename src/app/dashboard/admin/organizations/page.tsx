import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlobalRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export default async function AdminOrganizationsPage() {
  const { dbUser } = await requireAuth();
  if (dbUser.globalRole !== GlobalRole.PLATFORM_ADMIN) {
    redirect("/dashboard");
  }

  const companies = await db.company.findMany({
    include: {
      _count: {
        select: {
          memberships: true,
          departments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Platform Tenant Directory
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          All provisioned enterprise companies and workspace tenants across the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Organizations ({companies.length})</CardTitle>
          <CardDescription>
            Multi-tenant isolated organizations and active membership tallies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                <tr>
                  <th className="px-4 py-3">Organization Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Departments</th>
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
                    <td className="px-4 py-3 font-medium text-editorial-900">
                      {c._count.memberships}
                    </td>
                    <td className="px-4 py-3 text-brand-text">{c._count.departments}</td>
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
        </CardContent>
      </Card>
    </div>
  );
}
