import { enforceRole } from "@/lib/auth";
import { CompanyRole } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileCheck2 } from "lucide-react";

export default async function ManagerProgressPage() {
  await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Department Training Progress
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Aggregated milestone completion and training compliance across your functional area.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-editorial-800" />
              <CardTitle>Milestone Compliance Metrics</CardTitle>
            </div>
            <Badge variant="coral">Phase 2 Reporting</Badge>
          </div>
          <CardDescription>
            Detailed tracking of course submissions and quiz certifications will populate here as employees advance through their tracks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-md bg-surface-raised border border-surface-border text-center">
            <p className="text-sm font-medium text-editorial-900">
              Interactive quiz scoring and document sign-offs will be activated in Phase 2.
            </p>
            <p className="text-xs text-brand-muted mt-1">
              Currently capturing all employee registration and department allocation data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
