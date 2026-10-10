"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createDepartmentAction } from "../actions";
import { FolderPlus } from "lucide-react";

export function DepartmentForm() {
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

    const res = await createDepartmentAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      form.reset();
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FolderPlus className="w-5 h-5 text-editorial-800" />
          <CardTitle>Create Department</CardTitle>
        </div>
        <CardDescription>
          Add a functional unit to structure employee roles.
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
            <Alert variant="success">Department created successfully.</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            name="name"
            required
            placeholder="e.g. Talent Acquisition"
          />

          <Input
            label="Department Code"
            name="code"
            placeholder="e.g. TA"
            helperText="Short alphanumeric code (optional)"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Scope / Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Primary responsibilities and operational mandate..."
              className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isPending}
          >
            Create Department
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
