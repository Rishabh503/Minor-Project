"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  createForumReplyAction,
  markAcceptedReplyAction,
  resolveThreadAction,
  reopenThreadAction,
  reportContentAction,
  moderateContentAction,
  scheduleDiscussionMeetingAction,
} from "@/app/dashboard/forum/actions";
import { formatDateTime } from "@/lib/utils";
import {
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  Check,
  Paperclip,
  ExternalLink,
  Calendar,
  Layers,
  CheckSquare,
  Flag,
  ShieldAlert,
  Send,
  Video,
  Clock,
  RotateCcw,
  Sparkles,
  User,
} from "lucide-react";

export interface ForumReplyItem {
  id: string;
  content: string;
  attachments: any;
  isAcceptedAnswer: boolean;
  isReported: boolean;
  reportReason: string | null;
  isModerated: boolean;
  createdAt: Date | string;
  author: {
    id: string;
    role: string;
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
}

export interface ForumThreadDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  attachments: any;
  createdAt: Date | string;
  isReported: boolean;
  reportReason: string | null;
  isModerated: boolean;
  author: {
    id: string;
    role: string;
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
  task?: { id: string; title: string } | null;
  worksheet?: { id: string; title: string } | null;
  meeting?: {
    id: string;
    title: string;
    startTime: Date | string;
    endTime: Date | string;
    meetingUrl: string | null;
    location: string | null;
  } | null;
  acceptedReplyId: string | null;
  replies: ForumReplyItem[];
}

interface ForumThreadDetailViewProps {
  thread: ForumThreadDetail;
  currentMembershipId: string;
  isManagerOrAdmin: boolean;
}

export function ForumThreadDetailView({
  thread,
  currentMembershipId,
  isManagerOrAdmin,
}: ForumThreadDetailViewProps) {
  const router = useRouter();

  // Reply Composer State
  const [replyContent, setReplyContent] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<Array<{ name: string; url: string }>>([]);
  const [replyAttName, setReplyAttName] = useState("");
  const [replyAttUrl, setReplyAttUrl] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState("");

  // Schedule Meeting Modal State
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState(`Help Session: ${thread.title}`);
  const [meetingStartTime, setMeetingStartTime] = useState("");
  const [meetingEndTime, setMeetingEndTime] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingError, setMeetingError] = useState("");
  const [meetingLoading, setMeetingLoading] = useState(false);

  // Report Modal State
  const [reportingTarget, setReportingTarget] = useState<{ type: "THREAD" | "REPLY"; id: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const isAuthor = thread.author.id === currentMembershipId;
  const canResolve = isAuthor || isManagerOrAdmin;

  // Add attachment to reply helper
  const handleAddReplyAttachment = () => {
    if (!replyAttName.trim() || !replyAttUrl.trim()) return;
    setReplyAttachments([...replyAttachments, { name: replyAttName.trim(), url: replyAttUrl.trim() }]);
    setReplyAttName("");
    setReplyAttUrl("");
  };

  const handleRemoveReplyAttachment = (idx: number) => {
    setReplyAttachments(replyAttachments.filter((_, i) => i !== idx));
  };

  // Submit Reply
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError("");
    setReplyLoading(true);

    const formData = new FormData();
    formData.append("threadId", thread.id);
    formData.append("content", replyContent);
    formData.append("attachments", JSON.stringify(replyAttachments));

    const res = await createForumReplyAction(formData);
    setReplyLoading(false);

    if (res.error) {
      setReplyError(res.error);
    } else {
      setReplyContent("");
      setReplyAttachments([]);
      router.refresh();
    }
  };

  // Mark Accepted Reply
  const handleMarkAccepted = async (replyId: string) => {
    const formData = new FormData();
    formData.append("threadId", thread.id);
    formData.append("replyId", replyId);
    await markAcceptedReplyAction(formData);
    router.refresh();
  };

  // Toggle Resolve
  const handleToggleResolve = async () => {
    const formData = new FormData();
    formData.append("threadId", thread.id);

    if (thread.status === "RESOLVED") {
      await reopenThreadAction(formData);
    } else {
      await resolveThreadAction(formData);
    }
    router.refresh();
  };

  // Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingTarget) return;
    setReportLoading(true);

    const formData = new FormData();
    formData.append("targetType", reportingTarget.type);
    formData.append("targetId", reportingTarget.id);
    formData.append("reason", reportReason);

    await reportContentAction(formData);
    setReportLoading(false);
    setReportingTarget(null);
    setReportReason("");
    router.refresh();
  };

  // Moderate Content
  const handleToggleModerate = async (targetType: "THREAD" | "REPLY", targetId: string, currentStatus: boolean) => {
    const formData = new FormData();
    formData.append("targetType", targetType);
    formData.append("targetId", targetId);
    formData.append("isModerated", currentStatus ? "false" : "true");

    await moderateContentAction(formData);
    router.refresh();
  };

  // Submit Scheduled Meeting
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setMeetingError("");
    setMeetingLoading(true);

    const formData = new FormData();
    formData.append("threadId", thread.id);
    formData.append("title", meetingTitle);
    formData.append("startTime", meetingStartTime);
    formData.append("endTime", meetingEndTime);
    if (meetingUrl) formData.append("meetingUrl", meetingUrl);
    if (meetingLocation) formData.append("location", meetingLocation);

    const res = await scheduleDiscussionMeetingAction(formData);
    setMeetingLoading(false);

    if (res.error) {
      setMeetingError(res.error);
    } else {
      setIsSchedulingMeeting(false);
      router.refresh();
    }
  };

  const authorName =
    [thread.author.user.firstName, thread.author.user.lastName].filter(Boolean).join(" ") ||
    thread.author.user.email;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          href="/dashboard/forum"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-editorial-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Discussion Forum
        </Link>
      </div>

      {/* Moderation Banner if Reported */}
      {thread.isReported && isManagerOrAdmin && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Content Flagged for Moderation:</span>{" "}
              <span>{thread.reportReason || "Reported by user"}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleModerate("THREAD", thread.id, thread.isModerated)}
            className="text-xs"
          >
            {thread.isModerated ? "Restore to Forum" : "Hide from Forum"}
          </Button>
        </div>
      )}

      {/* Main Question Card */}
      <Card className={thread.isModerated ? "opacity-60 border-dashed" : ""}>
        <CardHeader className="space-y-3 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={
                  thread.status === "RESOLVED"
                    ? "success"
                    : thread.status === "ANSWERED"
                    ? "editorial"
                    : "coral"
                }
                className="gap-1 text-xs"
              >
                {thread.status === "RESOLVED" && <CheckCircle2 className="w-3 h-3" />}
                {thread.status}
              </Badge>
              <Badge variant="neutral">{thread.category}</Badge>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2">
              {isManagerOrAdmin && !thread.meeting && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSchedulingMeeting(true)}
                  className="gap-1.5 text-xs text-coral-600 border-coral-200 hover:bg-coral-50"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule Help Session
                </Button>
              )}

              {canResolve && (
                <Button
                  variant={thread.status === "RESOLVED" ? "outline" : "accent"}
                  size="sm"
                  onClick={handleToggleResolve}
                  className="gap-1.5 text-xs"
                >
                  {thread.status === "RESOLVED" ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reopen Thread
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Resolved
                    </>
                  )}
                </Button>
              )}

              <button
                type="button"
                onClick={() => setReportingTarget({ type: "THREAD", id: thread.id })}
                className="text-brand-muted hover:text-coral-600 p-1.5 rounded transition-colors"
                title="Report inappropriate content"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>

          <CardTitle className="font-heading text-xl sm:text-2xl font-bold text-editorial-900 leading-tight">
            {thread.title}
          </CardTitle>

          <div className="flex items-center gap-2 text-xs text-brand-muted pt-1">
            <span className="font-semibold text-editorial-800">{authorName}</span>
            <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
              {thread.author.role}
            </Badge>
            <span>•</span>
            <span>{formatDateTime(thread.createdAt)}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Linked Context references */}
          {(thread.task || thread.worksheet || thread.meeting) && (
            <div className="flex flex-wrap gap-2 pt-2 pb-2 border-t border-b border-surface-border">
              {thread.task && (
                <Link
                  href="/dashboard/tasks"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-editorial-800 bg-canvas-subtle px-2.5 py-1 rounded border border-surface-border hover:border-editorial-500 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-coral-600" />
                  Reference Task: {thread.task.title}
                </Link>
              )}
              {thread.worksheet && (
                <Link
                  href="/dashboard/assessments"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-editorial-800 bg-canvas-subtle px-2.5 py-1 rounded border border-surface-border hover:border-editorial-500 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-coral-600" />
                  Reference Worksheet: {thread.worksheet.title}
                </Link>
              )}
              {thread.meeting && (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-900 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Linked Session: {thread.meeting.title} ({formatDateTime(thread.meeting.startTime)})
                  </span>
                  {thread.meeting.meetingUrl && (
                    <a
                      href={thread.meeting.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-coral-600 underline text-[11px]"
                    >
                      <Video className="w-3 h-3" />
                      Join
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Formatted Content */}
          <div className="text-sm text-editorial-900 whitespace-pre-wrap leading-relaxed">
            {thread.content}
          </div>

          {/* Attachments */}
          {Array.isArray(thread.attachments) && thread.attachments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-surface-border">
              <span className="text-[11px] font-bold uppercase text-brand-muted block">
                Attached Documents & References:
              </span>
              <div className="flex flex-wrap gap-2">
                {thread.attachments.map((att: any, idx: number) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-coral-600 bg-surface px-2.5 py-1.5 rounded border border-surface-border hover:bg-canvas-subtle transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{att.name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Replies Stream */}
      <div className="space-y-4 pt-2">
        <h3 className="font-heading text-lg font-bold text-editorial-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-editorial-800" />
          Responses & Follow-ups ({thread.replies.length})
        </h3>

        {thread.replies.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-border p-6 text-center">
            <MessageSquare className="w-8 h-8 text-brand-muted/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-editorial-900">No responses yet</p>
            <p className="text-xs text-brand-muted mt-0.5">
              Be the first to post a solution, answer clarification, or guidance below.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {thread.replies.map((reply) => {
              const isAccepted = reply.isAcceptedAnswer || reply.id === thread.acceptedReplyId;
              const replierName =
                [reply.author.user.firstName, reply.author.user.lastName].filter(Boolean).join(" ") ||
                reply.author.user.email;

              return (
                <div
                  key={reply.id}
                  className={`rounded-lg border p-4.5 space-y-3 transition-all ${
                    isAccepted
                      ? "border-emerald-300 bg-emerald-50/40 shadow-sm"
                      : "border-surface-border bg-surface-raised"
                  } ${reply.isModerated ? "opacity-50 border-dashed" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-editorial-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                        {replierName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-editorial-900">{replierName}</span>
                          <Badge variant="neutral" className="text-[10px] py-0 px-1">
                            {reply.author.role}
                          </Badge>
                          {isAccepted && (
                            <Badge variant="success" className="gap-1 text-[10px] py-0 px-1.5 font-bold">
                              <Check className="w-3 h-3" />
                              Accepted Solution
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-brand-muted">{formatDateTime(reply.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isAccepted && canResolve && thread.status !== "RESOLVED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAccepted(reply.id)}
                          className="text-[11px] h-7 gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Check className="w-3 h-3" />
                          Accept Answer
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => setReportingTarget({ type: "REPLY", id: reply.id })}
                        className="text-brand-muted hover:text-coral-600 p-1 rounded"
                        title="Report reply"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>

                      {reply.isReported && isManagerOrAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleModerate("REPLY", reply.id, reply.isModerated)}
                          className="text-[10px] h-6"
                        >
                          {reply.isModerated ? "Unhide" : "Hide"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-editorial-900 whitespace-pre-wrap leading-relaxed pl-9">
                    {reply.content}
                  </div>

                  {Array.isArray(reply.attachments) && reply.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pl-9 pt-1">
                      {reply.attachments.map((att: any, idx: number) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-coral-600 underline font-semibold"
                        >
                          <Paperclip className="w-3 h-3" />
                          {att.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply Composer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-editorial-800" />
            Post Your Response
          </CardTitle>
          <CardDescription>
            Provide code snippets, solution explanations, or references to assist your teammate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {replyError && <Alert variant="error" className="mb-4">{replyError}</Alert>}

          <form onSubmit={handlePostReply} className="space-y-4">
            <div>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
                placeholder="Write your constructive response here..."
                required
                className="w-full rounded-md border border-surface-border bg-canvas p-3 text-xs text-editorial-900 focus:outline-none focus:ring-2 focus:ring-coral-500"
              />
            </div>

            {/* Optional Attachments in Reply */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={replyAttName}
                  onChange={(e) => setReplyAttName(e.target.value)}
                  placeholder="Doc/Snippet Name"
                  className="text-xs flex-1"
                />
                <Input
                  value={replyAttUrl}
                  onChange={(e) => setReplyAttUrl(e.target.value)}
                  placeholder="Attachment URL"
                  className="text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddReplyAttachment}
                  disabled={!replyAttName.trim() || !replyAttUrl.trim()}
                >
                  Add Link
                </Button>
              </div>

              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {replyAttachments.map((att, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs bg-canvas-subtle border border-surface-border px-2 py-0.5 rounded"
                    >
                      <Paperclip className="w-3 h-3 text-editorial-700" />
                      <span>{att.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveReplyAttachment(idx)}
                        className="text-brand-muted hover:text-red-600 font-bold ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="accent" disabled={replyLoading || !replyContent.trim()}>
                {replyLoading ? "Posting..." : "Post Response"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* SCHEDULE HELP MEETING MODAL */}
      {isSchedulingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-warm border border-surface-border space-y-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-editorial-900">
                Schedule Help Session for this Discussion
              </h2>
              <p className="text-xs text-brand-muted mt-1">
                Book a 1-on-1 video call to walk through doubts with {authorName}.
              </p>
            </div>

            {meetingError && <Alert variant="error">{meetingError}</Alert>}

            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                  Session Title *
                </label>
                <Input
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                    Start Time *
                  </label>
                  <Input
                    type="datetime-local"
                    value={meetingStartTime}
                    onChange={(e) => setMeetingStartTime(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                    End Time *
                  </label>
                  <Input
                    type="datetime-local"
                    value={meetingEndTime}
                    onChange={(e) => setMeetingEndTime(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                  Meeting Link (Google Meet / Zoom)
                </label>
                <Input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                  Location / Room (Optional)
                </label>
                <Input
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="e.g. Meeting Room 2B"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
                <Button type="button" variant="outline" onClick={() => setIsSchedulingMeeting(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" disabled={meetingLoading}>
                  {meetingLoading ? "Booking..." : "Confirm & Send Invites"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT CONTENT MODAL */}
      {reportingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-warm border border-surface-border space-y-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-editorial-900">
                Report {reportingTarget.type === "THREAD" ? "Question" : "Reply"}
              </h2>
              <p className="text-xs text-brand-muted mt-1">
                Flag this content for review by workspace managers and moderators.
              </p>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                  Reason for Report *
                </label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this content violates community or company guidelines..."
                  required
                  className="w-full rounded-md border border-surface-border bg-canvas p-2.5 text-xs text-editorial-900 focus:outline-none focus:ring-2 focus:ring-coral-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setReportingTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" disabled={reportLoading || !reportReason.trim()}>
                  {reportLoading ? "Reporting..." : "Submit Report"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
