import { enforceRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { InviteMemberForm } from "./InviteMemberForm";
import { EmployeeDirectoryTable } from "@/components/company/EmployeeDirectoryTable";
import { Users, UserPlus } from "lucide-react";

export default async function MembersPage() {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const [members, departments, batches, managers] = await Promise.all([
    db.companyMembership.findMany({
      where: { companyId },
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
      orderBy: { createdAt: "desc" },
    }),
    db.department.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
    db.trainingBatch.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
    db.companyMembership.findMany({
      where: {
        companyId,
        role: { in: [CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN] },
        status: "ACTIVE",
      },
      include: { user: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
            Workforce Directory & Management
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Manage employees, assign primary reporting managers, organize training batches, and invite new cohorts into {context.company!.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Invite Form */}
        <div className="lg:col-span-1">
          <InviteMemberForm
            departments={departments.map((d) => ({ id: d.id, name: d.name }))}
            batches={batches.map((b) => ({ id: b.id, name: b.name }))}
            managers={managers.map((m) => ({
              id: m.id,
              name: [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.email,
            }))}
          />
        </div>

        {/* Search, Filter & Directory Table */}
        <div className="lg:col-span-2">
          <EmployeeDirectoryTable
            initialMembers={members as any}
            departments={departments.map((d) => ({ id: d.id, name: d.name }))}
            batches={batches.map((b) => ({ id: b.id, name: b.name }))}
          />
        </div>
      </div>
    </div>
  );
}
