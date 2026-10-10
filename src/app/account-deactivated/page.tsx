import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { UserX, LogOut } from "lucide-react";

export default function AccountDeactivatedPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
        <UserX className="w-7 h-7" />
      </div>
      <h1 className="font-heading text-3xl font-bold tracking-tight text-editorial-900">
        Account Access Deactivated
      </h1>
      <p className="mt-3 text-sm text-brand-muted max-w-md leading-relaxed">
        Your organizational membership has been deactivated by a company administrator. You currently do not have access to this workspace.
      </p>
      <p className="mt-2 text-xs text-brand-muted">
        If you believe this is in error, please contact your organization administrator or HR department.
      </p>

      <div className="mt-6">
        <SignOutButton redirectUrl="/sign-in">
          <Button variant="outline" size="md" className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </SignOutButton>
      </div>
    </div>
  );
}
