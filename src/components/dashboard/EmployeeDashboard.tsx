import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Building,
  User,
  Phone,
  MapPin,
  Calendar,
  Video,
  ExternalLink,
  Clock,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { UpcomingMeetingSummary } from "./ManagerDashboard";

interface EmployeeDashboardProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  company: {
    name: string;
  };
  profile: {
    id: string;
    jobTitle: string | null;
    location: string | null;
    phoneNumber: string | null;
    onboardingStatus: string;
    department: {
      name: string;
      description: string | null;
    } | null;
    manager: {
      user: {
        firstName: string | null;
        lastName: string | null;
        email: string;
      };
    } | null;
  } | null;
  upcomingMeetings?: UpcomingMeetingSummary[];
}

export function EmployeeDashboard({
  user,
  company,
  profile,
  upcomingMeetings,
}: EmployeeDashboardProps) {
  const isProfileComplete = Boolean(profile?.jobTitle);

  // Structured Onboarding Steps
  const onboardingSteps = [
    {
      title: "Complete Employee Identity & Profile",
      description: "Set your job title, location, contact details, and department.",
      completed: isProfileComplete,
      actionHref: "/onboarding",
      actionText: isProfileComplete ? "Review Profile" : "Complete Profile",
    },
    {
      title: "Enterprise Security & Compliance Overview",
      description: "Read and acknowledge data governance, confidentiality, and IT policy.",
      completed: profile?.onboardingStatus === "COMPLETED",
      actionHref: "/dashboard/employee/tasks",
      actionText: "Open Module",
    },
    {
      title: "Department Induction & Mentorship Assignment",
      description: `Connect with your assigned team in ${profile?.department?.name || "your department"}.`,
      completed: Boolean(profile?.department),
      actionHref: "/dashboard/employee/tasks",
      actionText: "View Details",
    },
    {
      title: "Core Role Training Track",
      description: "Complete foundational learning modules and role competencies.",
      completed: profile?.onboardingStatus === "COMPLETED",
      actionHref: "/dashboard/employee/training",
      actionText: "Explore Courses",
    },
  ];

  const completedStepsCount = onboardingSteps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedStepsCount / onboardingSteps.length) * 100);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-surface-border bg-editorial-800 p-8 text-white shadow-warm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-editorial-700/60 px-3 py-1 text-xs font-semibold text-coral-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Welcome to {company.name}</span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              Hello, {user.firstName || user.email.split("@")[0]}
            </h1>
            <p className="text-sm text-editorial-100 max-w-xl leading-relaxed">
              Your onboarding journey has begun. Work through the checklist below to complete your setup, meet your team, and access company resources.
            </p>
          </div>

          <div className="rounded-lg bg-editorial-900/60 p-4 border border-editorial-700/50 min-w-[200px]">
            <p className="text-xs uppercase font-semibold text-editorial-100">Overall Progress</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">{progressPercent}%</span>
              <span className="text-xs text-editorial-100 font-mono">
                {completedStepsCount} of {onboardingSteps.length}
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-editorial-700 overflow-hidden">
              <div
                className="h-full bg-coral-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Onboarding Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Milestone Checklist</CardTitle>
              <CardDescription>
                Essential steps required to activate your full employee workspace access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {onboardingSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-all ${
                    step.completed
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-surface-border bg-surface-raised hover:border-editorial-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-brand-muted shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4
                        className={`text-sm font-semibold ${
                          step.completed ? "text-emerald-950 line-through opacity-80" : "text-editorial-900"
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-0 sm:ml-4 shrink-0">
                    <Link href={step.actionHref}>
                      <Button
                        variant={step.completed ? "outline" : "accent"}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        {step.actionText}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Scheduled Sessions & Check-ins */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-editorial-800" />
                  Upcoming Sessions & 1-on-1s
                </CardTitle>
                <CardDescription>
                  Your scheduled training workshops, mentorship check-ins, and doubt resolution slots.
                </CardDescription>
              </div>
              <Link
                href="/dashboard/schedule"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-editorial-800 hover:text-coral-600 transition-colors"
              >
                Schedule
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {!upcomingMeetings || upcomingMeetings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-surface-border p-6 text-center">
                  <Calendar className="w-8 h-8 text-brand-muted/50 mx-auto mb-2" />
                  <p className="text-sm font-medium text-editorial-900">No sessions scheduled right now</p>
                  <p className="text-xs text-brand-muted mt-1">
                    Your manager will invite you to training sessions and 1-on-1s. You can also ask questions or request a session anytime.
                  </p>
                  <Link href="/dashboard/schedule" className="inline-block mt-3">
                    <Button variant="outline" size="sm">
                      View Schedule & Ask Questions
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {upcomingMeetings.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-lg border border-surface-border bg-surface-raised p-3.5 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="editorial" className="text-[10px]">
                            {m.type.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-[11px] font-mono text-brand-muted">
                            {new Date(m.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-editorial-900 line-clamp-1">{m.title}</h4>
                        <p className="text-xs text-brand-muted flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {formatDateTime(m.startTime)}
                        </p>
                        <p className="text-xs text-brand-muted">
                          Host: {m.organizer.user.firstName || m.organizer.user.email}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-surface-border flex items-center justify-between">
                        {m.meetingUrl ? (
                          <a
                            href={m.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-coral-600 hover:text-coral-700"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Join Session
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-brand-muted">
                            {m.location || "Location TBD"}
                          </span>
                        )}
                        <Link
                          href="/dashboard/schedule"
                          className="text-[11px] font-medium text-editorial-800 hover:underline"
                        >
                          Calendar
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Training Modules Preview Shell */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-editorial-800" />
                  Assigned Training Modules
                </CardTitle>
                <CardDescription>
                  Foundational curricula tailored for your department.
                </CardDescription>
              </div>
              <Badge variant="coral">Phase 2 Preview</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md border border-surface-border bg-surface-raised text-sm">
                  <div>
                    <p className="font-semibold text-editorial-900">Workplace Safety & Data Protection 101</p>
                    <p className="text-xs text-brand-muted">3 modules • Estimated 45 minutes</p>
                  </div>
                  <Badge variant="neutral">Assigned</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border border-surface-border bg-surface-raised text-sm">
                  <div>
                    <p className="font-semibold text-editorial-900">Department Architecture & Tooling</p>
                    <p className="text-xs text-brand-muted">5 modules • Estimated 90 minutes</p>
                  </div>
                  <Badge variant="neutral">Assigned</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details & Contacts Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-editorial-800" />
                My Employee Record
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-surface-border pb-2">
                <span className="text-brand-muted uppercase font-semibold">Title</span>
                <span className="font-medium text-brand-text">{profile?.jobTitle || "Pending setup"}</span>
              </div>
              <div className="flex justify-between border-b border-surface-border pb-2">
                <span className="text-brand-muted uppercase font-semibold">Department</span>
                <span className="font-medium text-brand-text">
                  {profile?.department?.name || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between border-b border-surface-border pb-2">
                <span className="text-brand-muted uppercase font-semibold">Location</span>
                <span className="font-medium text-brand-text">{profile?.location || "Not provided"}</span>
              </div>
              <div className="flex justify-between border-b border-surface-border pb-2">
                <span className="text-brand-muted uppercase font-semibold">Phone</span>
                <span className="font-medium text-brand-text">{profile?.phoneNumber || "Not provided"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted uppercase font-semibold">Status</span>
                <Badge variant={profile?.onboardingStatus === "COMPLETED" ? "success" : "coral"}>
                  {profile?.onboardingStatus?.replace("_", " ") || "NOT STARTED"}
                </Badge>
              </div>

              <div className="pt-2">
                <Link href="/onboarding" className="w-full block">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    Update Profile Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Manager Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-editorial-800" />
                Reporting Lead
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.manager ? (
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-editorial-900">
                    {profile.manager.user.firstName} {profile.manager.user.lastName || ""}
                  </p>
                  <p className="text-brand-muted">{profile.manager.user.email}</p>
                  <p className="text-[11px] text-brand-muted pt-1">
                    Your assigned manager conducts milestone reviews and checks off completion.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-brand-muted">
                  No direct manager assigned yet. Your company admin will allocate a mentor shortly.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
