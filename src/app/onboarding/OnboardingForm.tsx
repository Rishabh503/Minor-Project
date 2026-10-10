"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createCompanyAction, completeEmployeeProfileAction } from "./actions";
import { Building2, User, Sparkles, ArrowRight } from "lucide-react";

interface OnboardingFormProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  hasCompany: boolean;
  companyName?: string;
  departments: Array<{ id: string; name: string }>;
  existingProfile?: {
    jobTitle: string | null;
    departmentId: string | null;
    phoneNumber: string | null;
    location: string | null;
    bio: string | null;
  } | null;
}

export function OnboardingForm({
  user,
  hasCompany,
  companyName,
  departments,
  existingProfile,
}: OnboardingFormProps) {
  const [mode, setMode] = useState<"company" | "profile">(
    hasCompany ? "profile" : "company"
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Form states for company
  const [companyForm, setCompanyForm] = useState({
    name: "",
    slug: "",
    domain: "",
  });

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setCompanyForm({
      ...companyForm,
      name,
      slug: generatedSlug,
    });
  };

  const handleCompanySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData();
    formData.append("name", companyForm.name);
    formData.append("slug", companyForm.slug);
    formData.append("domain", companyForm.domain);

    const res = await createCompanyAction(formData);
    if (res?.error) {
      setError(res.error);
      setIsPending(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await completeEmployeeProfileAction(formData);
    if (res?.error) {
      setError(res.error);
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Editorial branding header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-editorial-100 px-3 py-1 text-xs font-semibold text-editorial-800">
          <Sparkles className="w-3.5 h-3.5 text-coral-500" />
          <span>Ascent Workplace Setup</span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-editorial-900">
          {mode === "company" ? "Register Your Organization" : "Complete Employee Profile"}
        </h1>
        <p className="text-sm text-brand-muted max-w-md mx-auto">
          {mode === "company"
            ? "Establish your company workspace to onboard team members and assign compliance tracks."
            : `Set up your profile identity under ${companyName || "your workspace"} to commence onboarding.`}
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Setup Error">
          {error}
        </Alert>
      )}

      {mode === "company" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-editorial-800" />
              <CardTitle>Organization Details</CardTitle>
            </div>
            <CardDescription>
              Your user account will be granted Company Administrator privileges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <Input
                label="Company or Organization Name"
                name="name"
                required
                placeholder="e.g. Acme Corporation"
                value={companyForm.name}
                onChange={handleCompanyNameChange}
              />

              <Input
                label="Workspace URL Slug"
                name="slug"
                required
                placeholder="acme-corp"
                helperText="Used for tenancy isolation and organization identifiers (letters, numbers, hyphens)."
                value={companyForm.slug}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, slug: e.target.value.toLowerCase() })
                }
              />

              <Input
                label="Corporate Domain (Optional)"
                name="domain"
                placeholder="acme.com"
                helperText="Optional corporate domain to verify team member email domains."
                value={companyForm.domain}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, domain: e.target.value })
                }
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full gap-2"
                  isLoading={isPending}
                >
                  Create Organization & Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-editorial-800" />
              <CardTitle>Employee Profile Details</CardTitle>
            </div>
            <CardDescription>
              Help your team and managers identify your role within {companyName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label="Job Title / Designation"
                name="jobTitle"
                required
                placeholder="e.g. Senior Software Engineer"
                defaultValue={existingProfile?.jobTitle || ""}
              />

              <Select
                label="Assigned Department"
                name="departmentId"
                defaultValue={existingProfile?.departmentId || ""}
              >
                <option value="">Select a Department (Optional)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Office Location / Timezone"
                  name="location"
                  placeholder="New York, NY (Remote)"
                  defaultValue={existingProfile?.location || ""}
                />
                <Input
                  label="Contact Phone"
                  name="phoneNumber"
                  placeholder="+1 (555) 019-2834"
                  defaultValue={existingProfile?.phoneNumber || ""}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Professional Bio / Introduction
                </label>
                <textarea
                  name="bio"
                  rows={3}
                  placeholder="Share a brief introduction with your onboarding cohorts..."
                  defaultValue={existingProfile?.bio || ""}
                  className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="accent"
                  className="w-full gap-2"
                  isLoading={isPending}
                >
                  Save Profile & Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
