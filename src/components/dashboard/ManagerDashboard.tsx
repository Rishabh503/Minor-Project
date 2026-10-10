import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, UserCheck, Clock, CheckCircle2, Calendar, Video, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

export interface UpcomingMeetingSummary {
  id: string;
  title: string;
  type: string;
  startTime: Date;
  endTime: Date;
  meetingUrl: string | null;
  location: string | null;
  organizer: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
  participants: Array<{
    membership: {
      user: {
        firstName: string | null;
        lastName: string | null;
        email: string;
      };
    };
  }>;
}

interface ManagerDashboardProps {
  company: {
    id: string;
    name: string;
  };
  directReports: Array<{
    id: string;
    jobTitle: string | null;
    onboardingStatus: string;
    department: { name: string } | null;
    membership: {
      role: string;
      status: string;
      user: {
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
    };
  }>;
  departmentMembers: Array<{
    id: string;
    jobTitle: string | null;
    onboardingStatus: string;
    membership: {
      role: string;
      user: {
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
    };
  }>;
  upcomingMeetings?: UpcomingMeetingSummary[];
}

export function ManagerDashboard({
  company,
  directReports,
  departmentMembers,
  upcomingMeetings,
}: ManagerDashboardProps) {
  const inProgressCount = directReports.filter(
    (r) => r.onboardingStatus === "IN_PROGRESS"
  ).length;
  const completedCount = directReports.filter(
    (r) => r.onboardingStatus === "COMPLETED"
  ).length;
  const notStartedCount = directReports.filter(
    (r) => r.onboardingStatus === "NOT_STARTED"
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="coral">In Progress</Badge>;
      default:
        return <Badge variant="neutral">Not Started</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-editorial-900">
          Team Onboarding Management
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Oversee training milestones, checklist completion, and onboarding progress for your direct reports at {company.name}.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-editorial-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Direct Reports</span>
              <UserCheck className="w-4 h-4 text-editorial-800" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {directReports.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Assigned team members</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-coral-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>In Training</span>
              <Clock className="w-4 h-4 text-coral-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {inProgressCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Active onboarding stages</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Certified</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {completedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Completed all tracks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-stone-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Pending Start</span>
              <Users className="w-4 h-4 text-stone-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {notStartedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Awaiting first session</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Scheduled Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-editorial-800" />
              Upcoming Scheduled Sessions
            </CardTitle>
            <CardDescription>
              Direct 1-on-1s, training workshops, and doubts resolution sessions.
            </CardDescription>
          </div>
          <Link
            href="/dashboard/schedule"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-editorial-800 hover:text-coral-600 transition-colors"
          >
            Full Calendar
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {!upcomingMeetings || upcomingMeetings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-surface-border p-6 text-center">
              <Calendar className="w-8 h-8 text-brand-muted/50 mx-auto mb-2" />
              <p className="text-sm font-medium text-editorial-900">No upcoming meetings scheduled</p>
              <p className="text-xs text-brand-muted mt-1">
                You can schedule onboarding 1-on-1s and training workshops via the schedule calendar.
              </p>
              <Link href="/dashboard/schedule" className="inline-block mt-3">
                <Button variant="outline" size="sm">
                  Open Calendar & Schedule
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    <p className="text-xs text-brand-muted flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      {m.participants.length} attendee{m.participants.length !== 1 ? "s" : ""}
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
                        Join Call
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-brand-muted">
                        {m.location || "Room / Link TBD"}
                      </span>
                    )}
                    <Link
                      href="/dashboard/schedule"
                      className="text-[11px] font-medium text-editorial-800 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Direct Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Direct Reports Onboarding Status</CardTitle>
          <CardDescription>
            Live tracking of assigned employee profiles and their training progression.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {directReports.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No direct reports assigned"
              description="Team members whose manager is set to your profile will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Job Title</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {directReports.map((report) => (
                    <tr key={report.id} className="hover:bg-canvas-subtle/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-editorial-900">
                          {report.membership.user.firstName
                            ? `${report.membership.user.firstName} ${report.membership.user.lastName || ""}`
                            : report.membership.user.email}
                        </div>
                        <div className="text-xs text-brand-muted">{report.membership.user.email}</div>
                      </td>
                      <td className="px-4 py-3 text-brand-text">{report.jobTitle || "—"}</td>
                      <td className="px-4 py-3 text-xs text-brand-muted">
                        {report.department?.name || "Unassigned"}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(report.onboardingStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Peer Overview */}
      {departmentMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Roster Overview</CardTitle>
            <CardDescription>
              All members registered within your department.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {departmentMembers.map((m) => (
                <div
                  key={m.id}
                  className="rounded-md border border-surface-border bg-surface-raised p-3.5"
                >
                  <p className="font-medium text-sm text-editorial-900">
                    {m.membership.user.firstName
                      ? `${m.membership.user.firstName} ${m.membership.user.lastName || ""}`
                      : m.membership.user.email}
                  </p>
                  <p className="text-xs text-brand-muted">{m.jobTitle || m.membership.role}</p>
                  <div className="mt-2">{getStatusBadge(m.onboardingStatus)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
