"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  createMeetingAction,
  rescheduleMeetingAction,
  cancelMeetingAction,
  updateMeetingNotesAction,
} from "@/app/dashboard/schedule/actions";
import { formatDateTime } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Users,
  AlertTriangle,
  Plus,
  HelpCircle,
  FileText,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export interface MeetingItem {
  id: string;
  title: string;
  description: string | null;
  agenda: string | null;
  type: string;
  status: string;
  startTime: Date | string;
  endTime: Date | string;
  meetingUrl: string | null;
  location: string | null;
  meetingNotes: string | null;
  actionItems: Array<{ item: string; completed: boolean }> | null;
  cancellationReason: string | null;
  organizer: {
    id: string;
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
  participants: Array<{
    id: string;
    membershipId: string;
    attendanceStatus: string;
    membership: {
      user: {
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
    };
  }>;
}

export interface DoubtItem {
  id: string;
  topic: string;
  question: string;
  status: string;
  createdAt: Date | string;
  student: {
    id: string;
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
}

interface ScheduleCalendarViewProps {
  initialMeetings: MeetingItem[];
  doubts: DoubtItem[];
  availableMembers: Array<{ id: string; name: string; email: string }>;
  currentMembershipId: string;
  isManagerOrAdmin: boolean;
}

export function ScheduleCalendarView({
  initialMeetings,
  doubts,
  availableMembers,
  currentMembershipId,
  isManagerOrAdmin,
}: ScheduleCalendarViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"week" | "day" | "list">("week");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);
  const [activeModal, setActiveModal] = useState<"create" | "reschedule" | "cancel" | null>(null);

  // Creation form state
  const [prefilledDoubt, setPrefilledDoubt] = useState<DoubtItem | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [forceSchedule, setForceSchedule] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return initialMeetings.filter((m) => {
      if (typeFilter !== "ALL" && m.type !== typeFilter) return false;
      return true;
    });
  }, [initialMeetings, typeFilter]);

  // Handle schedule creation
  const handleCreateMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setConflictWarning(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    if (forceSchedule) {
      formData.set("forceSchedule", "true");
    }
    if (prefilledDoubt) {
      formData.set("sourceDoubtId", prefilledDoubt.id);
    }

    const res = await createMeetingAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.conflictWarning) {
      setConflictWarning(res.conflictMessage);
    } else {
      setSuccess("Session scheduled and calendar invitations dispatched.");
      setActiveModal(null);
      setPrefilledDoubt(null);
      setForceSchedule(false);
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  // Handle reschedule
  const handleReschedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    formData.append("meetingId", selectedMeeting.id);

    const res = await rescheduleMeetingAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Meeting rescheduled successfully.");
      setActiveModal(null);
      setSelectedMeeting(null);
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  // Handle cancellation
  const handleCancel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    formData.append("meetingId", selectedMeeting.id);

    const res = await cancelMeetingAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Meeting cancelled.");
      setActiveModal(null);
      setSelectedMeeting(null);
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  // Convert Doubt into Help Session
  const handleConvertDoubt = (doubt: DoubtItem) => {
    setPrefilledDoubt(doubt);
    setActiveModal("create");
  };

  const getMeetingTypeBadge = (t: string) => {
    switch (t) {
      case "HELP_SESSION":
        return <Badge variant="coral">Help Session</Badge>;
      case "ONE_ON_ONE":
        return <Badge variant="warning">1-on-1 Check-in</Badge>;
      case "TEAM_MEETING":
        return <Badge variant="editorial">Team Meeting</Badge>;
      default:
        return <Badge variant="neutral">Training Session</Badge>;
    }
  };

  const getMeetingStatusBadge = (s: string) => {
    switch (s) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "RESCHEDULED":
        return <Badge variant="warning">Rescheduled</Badge>;
      case "CANCELLED":
        return <Badge variant="coral">Cancelled</Badge>;
      default:
        return <Badge variant="editorial">Scheduled</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* View Switcher and Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-canvas-subtle rounded-lg border border-surface-border text-xs">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === "week"
                  ? "bg-editorial-800 text-white shadow-sm"
                  : "text-brand-muted hover:text-editorial-900"
              }`}
            >
              Week Grid
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === "day"
                  ? "bg-editorial-800 text-white shadow-sm"
                  : "text-brand-muted hover:text-editorial-900"
              }`}
            >
              Day Timeline
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-editorial-800 text-white shadow-sm"
                  : "text-brand-muted hover:text-editorial-900"
              }`}
            >
              Agenda List
            </button>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded border border-surface-border bg-white px-2.5 text-xs text-brand-text focus:outline-none focus:border-editorial-700"
          >
            <option value="ALL">All Meeting Types</option>
            <option value="TRAINING_SESSION">Training Sessions</option>
            <option value="ONE_ON_ONE">1-on-1 Check-ins</option>
            <option value="HELP_SESSION">Help Sessions</option>
            <option value="TEAM_MEETING">Team Meetings</option>
          </select>
        </div>

        {isManagerOrAdmin && (
          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              setPrefilledDoubt(null);
              setConflictWarning(null);
              setActiveModal("create");
            }}
            className="gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Schedule Session
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Schedule Canvas */}
        <div className="lg:col-span-2 space-y-4">
          {filteredMeetings.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="No sessions scheduled"
              description="No calendar meetings match your filter. Schedule a session or wait for team invites."
            />
          ) : (
            <div className="space-y-3">
              {filteredMeetings.map((meeting) => (
                <Card
                  key={meeting.id}
                  className={`hover:shadow-warm transition-all cursor-pointer border-l-4 ${
                    meeting.status === "CANCELLED"
                      ? "border-l-stone-400 opacity-60"
                      : meeting.type === "HELP_SESSION"
                      ? "border-l-coral-500"
                      : meeting.type === "ONE_ON_ONE"
                      ? "border-l-amber-500"
                      : "border-l-editorial-800"
                  }`}
                  onClick={() => setSelectedMeeting(meeting)}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getMeetingTypeBadge(meeting.type)}
                          {getMeetingStatusBadge(meeting.status)}
                          <span className="flex items-center gap-1 text-xs font-mono text-brand-muted">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(meeting.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            &ndash;{" "}
                            {new Date(meeting.endTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <h3 className="font-heading text-base font-bold text-editorial-900 mt-1">
                          {meeting.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted">
                          <span>
                            Date:{" "}
                            <strong>
                              {new Date(meeting.startTime).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Organizer:{" "}
                            {meeting.organizer.user.firstName
                              ? `${meeting.organizer.user.firstName} ${meeting.organizer.user.lastName || ""}`
                              : meeting.organizer.user.email}
                          </span>
                          <span>•</span>
                          <span>{meeting.participants.length} attendee(s)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {meeting.meetingUrl && meeting.status !== "CANCELLED" && (
                          <a
                            href={meeting.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-editorial-800 text-white text-xs font-medium hover:bg-editorial-700 shadow-sm"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Join Call
                          </a>
                        )}
                        <Button variant="outline" size="sm" className="text-xs">
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Doubts & Help Requests Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-coral-500" />
                  <CardTitle className="text-base">Doubts & Help Requests</CardTitle>
                </div>
                <Badge variant="coral">{doubts.filter((d) => d.status === "OPEN").length} Open</Badge>
              </div>
              <CardDescription>
                Convert questions into dedicated 1-on-1 mentoring help sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {doubts.length === 0 ? (
                <p className="text-xs text-brand-muted">No open doubts submitted by team members.</p>
              ) : (
                <div className="space-y-3">
                  {doubts.map((doubt) => (
                    <div
                      key={doubt.id}
                      className="rounded-md border border-surface-border bg-surface-raised p-3 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-editorial-900">{doubt.topic}</span>
                        <Badge variant={doubt.status === "OPEN" ? "coral" : "neutral"}>
                          {doubt.status}
                        </Badge>
                      </div>

                      <p className="text-brand-muted line-clamp-2 leading-relaxed">
                        {doubt.question}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-surface-border/60">
                        <span className="text-[11px] text-brand-muted">
                          By: {doubt.student.user.firstName || doubt.student.user.email}
                        </span>

                        {isManagerOrAdmin && doubt.status === "OPEN" && (
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => handleConvertDoubt(doubt)}
                            className="h-6 px-2 text-[11px] gap-1"
                          >
                            <CalendarIcon className="w-3 h-3" />
                            Schedule Help
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Meeting Modal */}
      {activeModal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-surface rounded-lg border border-surface-border p-6 shadow-warm-lg space-y-4 my-8">
            <h3 className="font-heading text-lg font-bold text-editorial-900">
              {prefilledDoubt ? "Schedule Dedicated Help Session" : "Schedule New Meeting / Session"}
            </h3>

            {conflictWarning && (
              <Alert variant="warning" title="Potential Overlap Detected">
                <p className="text-xs">{conflictWarning}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setForceSchedule(true)}
                    className="text-xs"
                  >
                    Confirm & Proceed Anyway
                  </Button>
                </div>
              </Alert>
            )}

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <Input
                label="Session Title"
                name="title"
                required
                defaultValue={prefilledDoubt ? `Help Session: ${prefilledDoubt.topic}` : ""}
                placeholder="e.g. Architecture Induction & Deep Dive"
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Meeting Type"
                  name="type"
                  defaultValue={prefilledDoubt ? "HELP_SESSION" : "TRAINING_SESSION"}
                >
                  <option value="TRAINING_SESSION">Training Session</option>
                  <option value="ONE_ON_ONE">1-on-1 Check-in</option>
                  <option value="HELP_SESSION">Help Session</option>
                  <option value="TEAM_MEETING">Team Meeting</option>
                </Select>

                <Input
                  label="Virtual Meeting URL"
                  name="meetingUrl"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date & Time"
                  name="startTime"
                  type="datetime-local"
                  required
                />
                <Input
                  label="End Date & Time"
                  name="endTime"
                  type="datetime-local"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Agenda & Objectives
                </label>
                <textarea
                  name="agenda"
                  rows={2}
                  defaultValue={prefilledDoubt ? `Follow up on question: ${prefilledDoubt.question}` : ""}
                  placeholder="Key topics to discuss and goals for this session..."
                  className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Select Attendees / Participants
                </label>
                <div className="max-h-36 overflow-y-auto rounded border border-surface-border p-2 space-y-1.5 bg-canvas-subtle">
                  {availableMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 text-xs text-brand-text cursor-pointer hover:bg-white p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        name="participantIds"
                        value={member.id}
                        defaultChecked={prefilledDoubt?.student.id === member.id}
                        className="rounded border-stone-300 text-editorial-800"
                      />
                      <span>{member.name} ({member.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveModal(null);
                    setConflictWarning(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isPending}
                >
                  Schedule Session
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-surface rounded-lg border border-surface-border p-6 shadow-warm-lg space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-surface-border pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getMeetingTypeBadge(selectedMeeting.type)}
                  {getMeetingStatusBadge(selectedMeeting.status)}
                </div>
                <h3 className="font-heading text-xl font-bold text-editorial-900">
                  {selectedMeeting.title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMeeting(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-surface-border">
                <div>
                  <p className="uppercase font-semibold text-brand-muted">Date & Time</p>
                  <p className="font-medium text-editorial-900 mt-0.5">
                    {formatDateTime(selectedMeeting.startTime)} &ndash; {formatDateTime(selectedMeeting.endTime)}
                  </p>
                </div>
                <div>
                  <p className="uppercase font-semibold text-brand-muted">Organizer</p>
                  <p className="font-medium text-editorial-900 mt-0.5">
                    {selectedMeeting.organizer.user.firstName || selectedMeeting.organizer.user.email}
                  </p>
                </div>
              </div>

              {selectedMeeting.meetingUrl && (
                <div className="pb-3 border-b border-surface-border">
                  <p className="uppercase font-semibold text-brand-muted">Virtual Meeting URL</p>
                  <a
                    href={selectedMeeting.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-editorial-800 font-semibold underline mt-1"
                  >
                    {selectedMeeting.meetingUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {selectedMeeting.agenda && (
                <div className="pb-3 border-b border-surface-border">
                  <p className="uppercase font-semibold text-brand-muted">Agenda</p>
                  <p className="text-brand-text mt-1 leading-relaxed whitespace-pre-wrap">
                    {selectedMeeting.agenda}
                  </p>
                </div>
              )}

              {/* Participants Roster */}
              <div>
                <p className="uppercase font-semibold text-brand-muted">Invited Participants</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedMeeting.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-surface-border bg-surface-raised"
                    >
                      <span>
                        {p.membership.user.firstName || p.membership.user.email}
                      </span>
                      <Badge variant="neutral" className="text-[10px]">
                        {p.attendanceStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Manager Actions */}
            {isManagerOrAdmin && selectedMeeting.status !== "CANCELLED" && (
              <div className="flex justify-between items-center pt-3 border-t border-surface-border">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setActiveModal("cancel")}
                  className="text-xs"
                >
                  Cancel Meeting
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal("reschedule")}
                  className="text-xs"
                >
                  Reschedule Meeting
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {activeModal === "reschedule" && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-surface rounded-lg border border-surface-border p-6 shadow-warm-lg space-y-4">
            <h3 className="font-heading text-lg font-bold text-editorial-900">
              Reschedule Session
            </h3>

            <form onSubmit={handleReschedule} className="space-y-4">
              <Input
                label="New Start Time"
                name="startTime"
                type="datetime-local"
                required
              />
              <Input
                label="New End Time"
                name="endTime"
                type="datetime-local"
                required
              />

              <Input
                label="Reason for Rescheduling"
                name="rescheduleReason"
                placeholder="e.g. Mentor schedule conflict"
              />

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
                  Confirm Reschedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {activeModal === "cancel" && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-surface rounded-lg border border-surface-border p-6 shadow-warm-lg space-y-4">
            <h3 className="font-heading text-lg font-bold text-editorial-900">
              Cancel Session?
            </h3>
            <p className="text-xs text-brand-muted">
              All participants will receive a cancellation notification.
            </p>

            <form onSubmit={handleCancel} className="space-y-4">
              <Input
                label="Cancellation Reason"
                name="cancellationReason"
                required
                placeholder="e.g. Workshop postponed"
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal(null)}
                >
                  Keep Meeting
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isPending}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
