"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { submitTaskWorkAction } from "@/app/dashboard/tasks/actions";
import { formatDateTime } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Send,
  MessageSquare,
  FileText,
  List,
  Sparkles,
} from "lucide-react";

export interface EmployeeAssignmentItem {
  id: string; // assignmentId
  status: string;
  dueDate: Date | string | null;
  completedAt: Date | string | null;
  task: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    type: string;
    priority: string;
    resourceLinks: Array<{ title: string; url: string }> | null;
    isHistorical: boolean;
  };
  submissions: Array<{
    id: string;
    submissionNumber: number;
    submissionText: string | null;
    links: Array<{ title: string; url: string }> | null;
    submittedAt: Date | string;
  }>;
  reviews: Array<{
    id: string;
    decision: string;
    feedback: string;
    reviewedAt: Date | string;
    reviewer: {
      user: {
        firstName: string | null;
        lastName: string | null;
        email: string;
      };
    };
  }>;
}

interface EmployeeTasksClientProps {
  assignments: EmployeeAssignmentItem[];
}

export function EmployeeTasksClient({ assignments }: EmployeeTasksClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedAssignment, setSelectedAssignment] = useState<EmployeeAssignmentItem | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionLinks, setSubmissionLinks] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const now = new Date();

  // Status counters
  const actionableAssignments = assignments.filter((a) => !a.task.isHistorical);
  const pendingCount = actionableAssignments.filter(
    (a) => a.status === "NOT_STARTED" || a.status === "IN_PROGRESS" || a.status === "CHANGES_REQUESTED"
  ).length;
  const completedCount = actionableAssignments.filter((a) => a.status === "COMPLETED").length;
  const overdueCount = actionableAssignments.filter(
    (a) => a.status !== "COMPLETED" && a.dueDate && new Date(a.dueDate) < now
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setError(null);
    setIsPending(true);

    const formData = new FormData();
    formData.append("assignmentId", selectedAssignment.id);
    formData.append("submissionText", submissionText);
    formData.append("links", submissionLinks);

    const res = await submitTaskWorkAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Deliverable submitted successfully for manager review.");
      setSelectedAssignment(null);
      setSubmissionText("");
      setSubmissionLinks("");
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const getStatusBadge = (status: string, dueDate: Date | string | null) => {
    const isOverdue = status !== "COMPLETED" && dueDate && new Date(dueDate) < now;

    if (status === "COMPLETED") return <Badge variant="success">Completed</Badge>;
    if (status === "CHANGES_REQUESTED") return <Badge variant="coral">Corrections Needed</Badge>;
    if (status === "SUBMITTED" || status === "UNDER_REVIEW") return <Badge variant="editorial">Under Review</Badge>;
    if (isOverdue) return <Badge variant="warning">Overdue</Badge>;
    return <Badge variant="neutral">{status.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Alert notifications */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-editorial-800">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Active Assignments</CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-amber-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Past Deadline</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700">{overdueCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Certified Completed</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-800">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* View Switcher Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-canvas-subtle rounded-lg border border-surface-border text-xs">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === "list"
                ? "bg-editorial-800 text-white shadow-sm"
                : "text-brand-muted hover:text-editorial-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List View
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-editorial-800 text-white shadow-sm"
                : "text-brand-muted hover:text-editorial-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Schedule View
          </button>
        </div>
      </div>

      {/* Task List or Calendar Cards */}
      {actionableAssignments.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All assigned tasks are clear"
          description="You currently have no pending tasks or training modules assigned to your profile."
        />
      ) : (
        <div className="space-y-3">
          {actionableAssignments.map((assignment) => {
            const isOverdue =
              assignment.status !== "COMPLETED" &&
              assignment.dueDate &&
              new Date(assignment.dueDate) < now;

            return (
              <Card
                key={assignment.id}
                className={`transition-all hover:shadow-warm cursor-pointer ${
                  assignment.status === "CHANGES_REQUESTED"
                    ? "border-coral-400 bg-coral-50/20"
                    : isOverdue
                    ? "border-amber-400"
                    : ""
                }`}
                onClick={() => setSelectedAssignment(assignment)}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="editorial">{assignment.task.type.replace("_", " ")}</Badge>
                        <Badge
                          variant={
                            assignment.task.priority === "URGENT"
                              ? "coral"
                              : assignment.task.priority === "HIGH"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {assignment.task.priority}
                        </Badge>
                        {getStatusBadge(assignment.status, assignment.dueDate)}
                      </div>

                      <h3 className="font-heading text-base font-bold text-editorial-900">
                        {assignment.task.title}
                      </h3>

                      {assignment.task.description && (
                        <p className="text-xs text-brand-muted line-clamp-1">
                          {assignment.task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-brand-muted">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {assignment.dueDate
                            ? `Due ${new Date(assignment.dueDate).toLocaleDateString()}`
                            : "No deadline"}
                        </span>
                      </div>

                      <Button
                        variant={assignment.status === "CHANGES_REQUESTED" ? "accent" : "outline"}
                        size="sm"
                        className="text-xs mt-1"
                      >
                        {assignment.status === "COMPLETED"
                          ? "View Completed"
                          : assignment.status === "CHANGES_REQUESTED"
                          ? "Resubmit Deliverable"
                          : "Submit Work"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Submission & Details Drawer Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-surface rounded-lg border border-surface-border p-6 shadow-warm-lg space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-surface-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="editorial">{selectedAssignment.task.type.replace("_", " ")}</Badge>
                  {getStatusBadge(selectedAssignment.status, selectedAssignment.dueDate)}
                </div>
                <h2 className="font-heading text-xl font-bold text-editorial-900">
                  {selectedAssignment.task.title}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAssignment(null)}
              >
                ✕
              </Button>
            </div>

            {/* Manager Feedback Alert if Changes Requested */}
            {selectedAssignment.status === "CHANGES_REQUESTED" &&
              selectedAssignment.reviews.length > 0 && (
                <Alert variant="warning" title="Manager Requested Changes">
                  <p className="font-medium text-xs">
                    {selectedAssignment.reviews[0].feedback}
                  </p>
                  <p className="text-[11px] text-amber-800/80 mt-1">
                    Please correct your submission and resubmit your deliverable below.
                  </p>
                </Alert>
              )}

            {/* Instructions */}
            {selectedAssignment.task.instructions && (
              <div className="space-y-1 rounded-md bg-canvas-subtle p-4 border border-surface-border">
                <h4 className="text-xs uppercase font-bold text-brand-muted">Instructions</h4>
                <p className="text-xs text-brand-text whitespace-pre-wrap leading-relaxed">
                  {selectedAssignment.task.instructions}
                </p>
              </div>
            )}

            {/* Resource Links */}
            {selectedAssignment.task.resourceLinks &&
              selectedAssignment.task.resourceLinks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold text-brand-muted">Helpful Resources</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAssignment.task.resourceLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-surface-border bg-surface-raised text-xs text-editorial-700 hover:text-editorial-900 font-medium"
                      >
                        {link.title || link.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

            {/* Submission History */}
            {selectedAssignment.submissions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-surface-border">
                <h4 className="text-xs uppercase font-bold text-brand-muted">Submission Log</h4>
                <div className="space-y-2">
                  {selectedAssignment.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-md border border-surface-border bg-surface-raised text-xs space-y-1"
                    >
                      <div className="flex justify-between font-mono text-[10px] text-brand-muted">
                        <span>Submission #{sub.submissionNumber}</span>
                        <span>{formatDateTime(sub.submittedAt)}</span>
                      </div>
                      {sub.submissionText && (
                        <p className="text-brand-text whitespace-pre-wrap">{sub.submissionText}</p>
                      )}
                      {sub.links && sub.links.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-2">
                          {sub.links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-editorial-700 underline text-xs"
                            >
                              {link.title || link.url}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Form (Only if not completed) */}
            {selectedAssignment.status !== "COMPLETED" ? (
              <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-surface-border">
                <h4 className="text-xs uppercase font-bold text-editorial-900">
                  {selectedAssignment.status === "CHANGES_REQUESTED"
                    ? "Resubmit Corrected Deliverable"
                    : "Submit Work"}
                </h4>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Submission Notes / Answers
                  </label>
                  <textarea
                    rows={4}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Provide your summary, findings, or notes for your manager to review..."
                    className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Deliverable URLs / Proof Links (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={submissionLinks}
                    onChange={(e) => setSubmissionLinks(e.target.value)}
                    placeholder="https://github.com/...&#10;https://docs.google.com/..."
                    className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-xs font-mono text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAssignment(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    size="sm"
                    className="gap-2"
                    isLoading={isPending}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit for Manager Review
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <p className="text-sm font-semibold text-emerald-950">
                  Task Certified Completed
                </p>
                <p className="text-xs text-brand-muted">
                  Approved on{" "}
                  {selectedAssignment.completedAt
                    ? new Date(selectedAssignment.completedAt).toLocaleDateString()
                    : "Recently"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
