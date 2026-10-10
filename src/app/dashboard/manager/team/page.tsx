import Link from "next/link";
import { enforceRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserCheck } from "lucide-react";

export default async function ManagerTeamPage() {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const membershipId = context.membership!.id;

  const directReports = await db.employeeProfile.findMany({
    where: { managerMembershipId: membershipId },
    include: {
      department: true,
      membership: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Direct Reports & Mentorship Roster
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Manage your assigned team members, schedule 1-on-1 check-ins, and verify completed onboarding steps.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Team Members</CardTitle>
          <CardDescription>
            {directReports.length} direct reports reporting to your managerial profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {directReports.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No direct reports currently assigned"
              description="When company administrators allocate team members to your managerial profile, they will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Job Title</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Onboarding</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {directReports.map((r) => (
                    <tr key={r.id} className="hover:bg-canvas-subtle/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-editorial-900">
                          {r.membership.user.firstName
                            ? `${r.membership.user.firstName} ${r.membership.user.lastName || ""}`
                            : r.membership.user.email}
                        </div>
                        <div className="text-xs text-brand-muted">{r.membership.user.email}</div>
                      </td>
                      <td className="px-4 py-3 text-brand-text">{r.jobTitle || "—"}</td>
                      <td className="px-4 py-3 text-xs text-brand-muted">
                        {r.department?.name || "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-muted">{r.location || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            r.onboardingStatus === "COMPLETED"
                              ? "success"
                              : r.onboardingStatus === "IN_PROGRESS"
                              ? "coral"
                              : "neutral"
                          }
                        >
                          {r.onboardingStatus.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/dashboard/company/employees/${r.membership.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Record
                          </Button>
                        </Link>
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
