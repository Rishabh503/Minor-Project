"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { inviteMemberAction } from "../actions";
import { UserPlus } from "lucide-react";

interface InviteMemberFormProps {
  departments: Array<{ id: string; name: string }>;
  batches?: Array<{ id: string; name: string }>;
  managers?: Array<{ id: string; name: string }>;
}

export function InviteMemberForm({
  departments,
  batches = [],
  managers = [],
}: InviteMemberFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await inviteMemberAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      form.reset();
      setTimeout(() => setSuccess(false), 5000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-editorial-800" />
          <CardTitle>Invite Workforce Member</CardTitle>
        </div>
        <CardDescription>
          Sends an email invitation and registers their profile in this organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {success && (
          <div className="mb-4">
            <Alert variant="success">
              Invitation email dispatched and profile record created.
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Corporate Email Address"
            name="email"
            type="email"
            required
            placeholder="colleague@company.com"
          />

          <Select label="Workspace Role" name="role" defaultValue="EMPLOYEE" required>
            <option value="EMPLOYEE">Employee (Training tracks & checklists)</option>
            <option value="MANAGER">Manager (Team oversight & report approvals)</option>
            <option value="COMPANY_ADMIN">Company Admin (Full company administration)</option>
          </Select>

          <Select label="Department" name="departmentId">
            <option value="">Unassigned</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>

          <Select label="Training Cohort / Batch" name="batchId">
            <option value="">No Batch Assigned</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <Select label="Primary Reporting Manager" name="managerMembershipId">
            <option value="">None Assigned</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>

          <Input
            label="Designation / Job Title"
            name="jobTitle"
            placeholder="e.g. Associate Cloud Architect"
          />

          <Button
            type="submit"
            variant="accent"
            className="w-full"
            isLoading={isPending}
          >
            Send Invitation & Register
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
