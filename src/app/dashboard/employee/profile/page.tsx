import { requireActiveCompanyContext } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { User, Building, ArrowRight } from "lucide-react";

export default async function EmployeeProfilePage() {
  const context = await requireActiveCompanyContext();
  const membershipId = context.membership!.id;

  const profile = await db.employeeProfile.findUnique({
    where: { membershipId },
    include: {
      department: true,
      manager: {
        include: {
          user: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
            Employee Profile
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Your verified organizational record within {context.company!.name}.
          </p>
        </div>
        <Link href="/onboarding">
          <Button variant="outline" size="sm" className="gap-2">
            Edit Details
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-editorial-800" />
              <CardTitle>Identity & Contact</CardTitle>
            </div>
            <CardDescription>Authentication and verified contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase font-semibold text-brand-muted">Full Name</p>
              <p className="font-medium text-editorial-900">
                {context.dbUser.firstName
                  ? `${context.dbUser.firstName} ${context.dbUser.lastName || ""}`
                  : "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-brand-muted">Email</p>
              <p className="font-medium text-editorial-900">{context.dbUser.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-brand-muted">Designation</p>
              <p className="font-medium text-editorial-900">{profile?.jobTitle || "Pending setup"}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-brand-muted">Phone Number</p>
              <p className="text-editorial-900">{profile?.phoneNumber || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-brand-muted">Location</p>
              <p className="text-editorial-900">{profile?.location || "Not provided"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-editorial-800" />
              <CardTitle>Organization Allocation</CardTitle>
            </div>
            <CardDescription>Departmental alignment and reporting structure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase font-semibold text-brand-muted">Company Workspace</p>
              <p className="font-medium text-editorial-900">{context.company!.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-brand-muted">Assigned Department</p>
              <p className="font-medium text-editorial-900">
                {profile?.department?.name || "Unassigned"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-brand-muted">Manager / Mentor</p>
              <p className="font-medium text-editorial-900">
                {profile?.manager
                  ? `${profile.manager.user.firstName || ""} ${profile.manager.user.lastName || ""} (${profile.manager.user.email})`
                  : "None assigned"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-brand-muted">Onboarding Clearance</p>
              <div className="mt-1">
                <Badge variant={profile?.onboardingStatus === "COMPLETED" ? "success" : "coral"}>
                  {profile?.onboardingStatus.replace("_", " ") || "NOT STARTED"}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-brand-muted">Member Since</p>
              <p className="text-xs font-mono text-brand-muted">
                {formatDateTime(context.membership!.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
