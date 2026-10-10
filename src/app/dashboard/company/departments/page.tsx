import { enforceRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DepartmentForm } from "./DepartmentForm";
import { FolderTree } from "lucide-react";

export default async function DepartmentsPage() {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const departments = await db.department.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { employees: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Organizational Departments
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Define functional divisions, assign department codes, and group employees for targeted training curricula.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Create Department Form */}
        <div className="lg:col-span-1">
          <DepartmentForm />
        </div>

        {/* Existing Departments List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configured Departments</CardTitle>
              <CardDescription>
                {departments.length} active departments registered in {context.company!.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <EmptyState
                  icon={FolderTree}
                  title="No departments found"
                  description="Use the creation form on the left to set up your company's departments."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                      <tr>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Staff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {departments.map((d) => (
                        <tr key={d.id} className="hover:bg-canvas-subtle/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-editorial-900">{d.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-brand-muted">{d.code || "—"}</td>
                          <td className="px-4 py-3 text-xs text-brand-muted max-w-xs truncate">
                            {d.description || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="neutral">{d._count.employees} employees</Badge>
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
      </div>
    </div>
  );
}
