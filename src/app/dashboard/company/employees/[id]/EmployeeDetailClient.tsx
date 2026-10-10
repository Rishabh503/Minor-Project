"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import {
  assignManagerAction,
  updateEmployeeRecordAction,
  toggleEmployeeStatusAction,
} from "../actions";
import {
  UserCheck,
  UserX,
  Edit3,
  Building,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface EmployeeDetailClientProps {
  member: {
    id: string;
    role: string;
    status: string;
    createdAt: Date | string;
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
    employeeProfile: {
      id: string;
      jobTitle: string | null;
      startDate: Date | string | null;
      phoneNumber: string | null;
      location: string | null;
      bio: string | null;
      onboardingStatus: string;
      onboardingCompletedAt: Date | string | null;
      department: { id: string; name: string } | null;
      batch: { id: string; name: string } | null;
      manager: {
        id: string;
        user: {
          email: string;
          firstName: string | null;
          lastName: string | null;
        };
      } | null;
    } | null;
  };
  departments: Array<{ id: string; name: string }>;
  batches: Array<{ id: string; name: string }>;
  managers: Array<{ id: string; name: string }>;
  canEdit: boolean;
}

export function EmployeeDetailClient({
  member,
  departments,
  batches,
  managers,
  canEdit,
}: EmployeeDetailClientProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<"edit" | "manager" | "status" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const profile = member.employeeProfile;
  const isDeactivated = member.status === "DEACTIVATED";

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    formData.append("membershipId", member.id);

    const res = await updateEmployeeRecordAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Profile details updated successfully.");
      setActiveModal(null);
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const handleAssignManager = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    formData.append("membershipId", member.id);

    const res = await assignManagerAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Reporting manager updated successfully.");
      setActiveModal(null);
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const handleToggleStatus = async () => {
    setError(null);
    setIsPending(true);

    const formData = new FormData();
    formData.append("membershipId", member.id);
    formData.append("status", isDeactivated ? "ACTIVE" : "DEACTIVATED");

    const res = await toggleEmployeeStatusAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(
        isDeactivated
          ? "Employee account access restored successfully."
          : "Employee membership deactivated. Historical records preserved."
      );
      setActiveModal(null);
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <Alert variant="error" title="Action Failed">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" title="Success">
          {success}
        </Alert>
      )}

      {/* Top action bar if Admin */}
      {canEdit && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveModal("manager")}
            className="gap-2 text-xs"
          >
            <UserCheck className="w-4 h-4 text-editorial-700" />
            {profile?.manager ? "Change Manager" : "Assign Manager"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveModal("edit")}
            className="gap-2 text-xs"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </Button>

          <Button
            variant={isDeactivated ? "outline" : "danger"}
            size="sm"
            onClick={() => setActiveModal("status")}
            className="gap-2 text-xs"
          >
            <UserX className="w-4 h-4" />
            {isDeactivated ? "Reactivate Access" : "Deactivate Access"}
          </Button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Record Card */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Professional Record</CardTitle>
                  <CardDescription>
                    Workforce metadata, departmental alignment, and cohort.
                  </CardDescription>
                </div>
                <Badge variant={isDeactivated ? "warning" : "success"}>
                  {member.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-surface-border">
                <div>
                  <p className="text-xs uppercase font-semibold text-brand-muted">Designation</p>
                  <p className="font-semibold text-editorial-900 mt-0.5">
                    {profile?.jobTitle || "Pending Setup"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold text-brand-muted">Assigned Department</p>
                  <p className="font-semibold text-editorial-900 mt-0.5">
                    {profile?.department?.name || "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-surface-border">
                <div>
                  <p className="text-xs uppercase font-semibold text-brand-muted">Training Batch / Cohort</p>
                  <p className="text-brand-text mt-0.5">
                    {profile?.batch ? (
                      <Badge variant="neutral">{profile.batch.name}</Badge>
                    ) : (
                      "None Assigned"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold text-brand-muted">Joining / Start Date</p>
                  <p className="text-brand-text mt-0.5">
                    {profile?.startDate
                      ? new Date(profile.startDate).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-surface-border">
                <div>
                  <p className="text-xs uppercase font-semibold text-brand-muted">Office Location</p>
                  <p className="text-brand-text mt-0.5">{profile?.location || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold text-brand-muted">Contact Phone</p>
                  <p className="text-brand-text mt-0.5">{profile?.phoneNumber || "Not provided"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase font-semibold text-brand-muted">Professional Bio</p>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  {profile?.bio || "No biographical statement submitted."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manager & Status Cards Sidebar */}
        <div className="space-y-6">
          {/* Assigned Manager Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-editorial-800" />
                Primary Manager
              </CardTitle>
              <CardDescription>Direct reporting superior</CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.manager ? (
                <div className="space-y-2">
                  <p className="font-semibold text-editorial-900 text-sm">
                    {profile.manager.user.firstName
                      ? `${profile.manager.user.firstName} ${profile.manager.user.lastName || ""}`
                      : profile.manager.user.email}
                  </p>
                  <p className="text-xs text-brand-muted">{profile.manager.user.email}</p>
                  <div className="pt-2">
                    <Badge variant="coral">Supervising Lead</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-brand-muted space-y-3">
                  <p>No primary reporting manager assigned.</p>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveModal("manager")}
                      className="w-full text-xs"
                    >
                      Allocate Manager
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Onboarding Clearance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-editorial-800" />
                Onboarding Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-brand-muted uppercase font-semibold">Stage</span>
                <Badge
                  variant={
                    profile?.onboardingStatus === "COMPLETED"
                      ? "success"
                      : profile?.onboardingStatus === "IN_PROGRESS"
                      ? "coral"
                      : "neutral"
                  }
                >
                  {profile?.onboardingStatus.replace("_", " ") || "NOT STARTED"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-muted uppercase font-semibold">Completed Date</span>
                <span className="font-mono text-brand-muted">
                  {profile?.onboardingCompletedAt
                    ? new Date(profile.onboardingCompletedAt).toLocaleDateString()
                    : "Pending"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {activeModal === "edit" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-surface rounded-lg border border-surface-border p-6 shadow-warm-lg space-y-4">
            <h3 className="font-heading text-lg font-bold text-editorial-900">
              Edit Employee Details
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Job Title / Designation"
                name="jobTitle"
                defaultValue={profile?.jobTitle || ""}
                placeholder="Senior Engineer"
              />

              <Select
                label="Department"
                name="departmentId"
                defaultValue={profile?.department?.id || ""}
              >
                <option value="">Unassigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Training Cohort / Batch"
                name="batchId"
                defaultValue={profile?.batch?.id || ""}
              >
                <option value="">None Assigned</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Office Location"
                  name="location"
                  defaultValue={profile?.location || ""}
                />
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  defaultValue={profile?.phoneNumber || ""}
                />
              </div>

              <Select
                label="Onboarding Status"
                name="onboardingStatus"
                defaultValue={profile?.onboardingStatus || "NOT_STARTED"}
              >
                <option value="NOT_STARTED">NOT STARTED</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </Select>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Manager Modal */}
      {activeModal === "manager" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-surface rounded-lg border border-surface-border p-6 shadow-warm-lg space-y-4">
            <h3 className="font-heading text-lg font-bold text-editorial-900">
              Assign Primary Manager
            </h3>
            <p className="text-xs text-brand-muted">
              Select an authorized Manager or Company Administrator to supervise this employee.
            </p>

            <form onSubmit={handleAssignManager} className="space-y-4">
              <Select
                label="Supervising Manager"
                name="managerMembershipId"
                defaultValue={profile?.manager?.id || ""}
              >
                <option value="">None (Remove current manager)</option>
                {managers
                  .filter((m) => m.id !== member.id) // cannot be own manager
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </Select>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  isLoading={isPending}
                >
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate/Reactivate Confirmation Modal */}
      {activeModal === "status" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-surface rounded-lg border border-surface-border p-6 shadow-warm-lg space-y-4">
            <h3 className="font-heading text-lg font-bold text-editorial-900">
              {isDeactivated ? "Reactivate Workspace Access?" : "Deactivate Employee Access?"}
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              {isDeactivated
                ? "This will restore the employee's active membership and grant login privileges back into this company workspace."
                : "Deactivating will immediately prevent this employee from signing in or accessing workspace resources. Historical training records, completions, and audit logs are permanently retained."}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={isDeactivated ? "primary" : "danger"}
                size="sm"
                onClick={handleToggleStatus}
                isLoading={isPending}
              >
                {isDeactivated ? "Confirm Reactivation" : "Confirm Deactivation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
