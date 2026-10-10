import { enforceRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyRole } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { BatchForm } from "./BatchForm";
import { formatDateTime } from "@/lib/utils";
import { GraduationCap, Sparkles, Users2 } from "lucide-react";

export default async function OnboardingTracksPage() {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const batches = await db.trainingBatch.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { employees: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Onboarding Tracks & Training Cohorts
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Organize training curricula, assign time-bound batches, and coordinate employee onboarding tracks for {context.company!.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Create Batch Form */}
        <div className="lg:col-span-1">
          <BatchForm />
        </div>

        {/* Existing Batches List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Training Batches & Cohorts</CardTitle>
              <CardDescription>
                {batches.length} cohorts currently defined in this company workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <EmptyState
                  icon={Users2}
                  title="No training cohorts created"
                  description="Use the form on the left to group incoming hires into structured training cohorts."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                      <tr>
                        <th className="px-4 py-3">Cohort Name</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Start Date</th>
                        <th className="px-4 py-3">Enrolled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {batches.map((b) => (
                        <tr key={b.id} className="hover:bg-canvas-subtle/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-editorial-900">
                            {b.name}
                            {b.description && (
                              <p className="text-xs text-brand-muted truncate max-w-xs">{b.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-brand-muted">{b.code || "—"}</td>
                          <td className="px-4 py-3 text-xs text-brand-muted">
                            {b.startDate ? new Date(b.startDate).toLocaleDateString() : "Flexible"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="neutral">{b._count.employees} employees</Badge>
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

      {/* Structured Tracks Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-editorial-800" />
                <CardTitle>Enterprise General Induction</CardTitle>
              </div>
              <Badge variant="success">Active Track</Badge>
            </div>
            <CardDescription>
              Default curriculum mandatory for all incoming personnel across all departments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 bg-surface-raised rounded-md border border-surface-border">
              <p className="font-medium text-editorial-900">1. Workplace Code of Conduct & IT Policies</p>
              <p className="text-xs text-brand-muted">Security compliance & access guidelines</p>
            </div>
            <div className="p-3 bg-surface-raised rounded-md border border-surface-border">
              <p className="font-medium text-editorial-900">2. Organization Culture & Leadership Introduction</p>
              <p className="text-xs text-brand-muted">Company vision, key teams, and resources</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-coral-500" />
                <CardTitle>Departmental Technical Alignment</CardTitle>
              </div>
              <Badge variant="coral">Configured Track</Badge>
            </div>
            <CardDescription>
              Role-specific learning track coordinated with assigned department mentors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 bg-surface-raised rounded-md border border-surface-border">
              <p className="font-medium text-editorial-900">1. Cloud Infrastructure & Secret Management</p>
              <p className="text-xs text-brand-muted">AWS, Postgres Neon, and environment safety</p>
            </div>
            <div className="p-3 bg-surface-raised rounded-md border border-surface-border">
              <p className="font-medium text-editorial-900">2. Repository Standards & CI/CD Pipelines</p>
              <p className="text-xs text-brand-muted">Code review lifecycle and branching models</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
