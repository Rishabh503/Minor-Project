"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createTrainingBatchAction } from "../employees/actions";
import { Users2, Plus } from "lucide-react";

export function BatchForm() {
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

    const res = await createTrainingBatchAction(formData);
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
          <Users2 className="w-5 h-5 text-editorial-800" />
          <CardTitle>Create Training Cohort / Batch</CardTitle>
        </div>
        <CardDescription>
          Group incoming hires into time-bound training cohorts.
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
            <Alert variant="success">Cohort batch created successfully.</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Batch / Cohort Name"
            name="name"
            required
            placeholder="e.g. Q1 2026 Engineering Cohort"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Batch Code"
              name="code"
              placeholder="e.g. BATCH-26A"
            />
            <Input
              label="Cohort Start Date"
              name="startDate"
              type="date"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Scope / Description
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Target roles, curriculum timeline, and milestones..."
              className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
            />
          </div>

          <Button
            type="submit"
            variant="accent"
            className="w-full gap-2"
            isLoading={isPending}
          >
            <Plus className="w-4 h-4" />
            Create Training Batch
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
