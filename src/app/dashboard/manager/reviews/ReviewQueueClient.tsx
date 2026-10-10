"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { reviewSubmissionAction } from "@/app/dashboard/tasks/actions";
import { formatDateTime } from "@/lib/utils";
import {
  ClipboardCheck,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  ExternalLink,
  Clock,
  User,
} from "lucide-react";

export interface PendingReviewItem {
  assignmentId: string;
  status: string;
  dueDate: Date | string | null;
  task: {
    id: string;
    title: string;
    type: string;
    priority: string;
  };
  employee: {
    id: string;
    email: string;
    name: string;
    jobTitle: string | null;
    department: string | null;
  };
  latestSubmission: {
    id: string;
    submissionNumber: number;
    submissionText: string | null;
    links: Array<{ title: string; url: string }> | null;
    submittedAt: Date | string;
  } | null;
  previousReviews: Array<{
    id: string;
    decision: string;
    feedback: string;
    reviewedAt: Date | string;
  }>;
}

interface ReviewQueueClientProps {
  items: PendingReviewItem[];
}

export function ReviewQueueClient({ items }: ReviewQueueClientProps) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<PendingReviewItem | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "CHANGES_REQUESTED" | "FEEDBACK_ONLY">("APPROVED");
  const [feedback, setFeedback] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setError(null);
    setIsPending(true);

    const formData = new FormData();
    formData.append("assignmentId", selectedItem.assignmentId);
    if (selectedItem.latestSubmission) {
      formData.append("submissionId", selectedItem.latestSubmission.id);
    }
    formData.append("decision", decision);
    formData.append("feedback", feedback);

    const res = await reviewSubmissionAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Review successfully submitted.");
      setSelectedItem(null);
      setFeedback("");
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <Card key={item.assignmentId} className="border-l-4 border-l-coral-500 hover:shadow-warm transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="editorial">{item.task.type.replace("_", " ")}</Badge>
                    <Badge variant={item.task.priority === "URGENT" ? "coral" : "neutral"}>
                      {item.task.priority}
                    </Badge>
                    <Badge variant={item.status === "CHANGES_REQUESTED" ? "warning" : "coral"}>
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-editorial-900">
                    {item.task.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted">
                    <span className="flex items-center gap-1 font-medium text-editorial-800">
                      <User className="w-3.5 h-3.5" />
                      {item.employee.name} ({item.employee.jobTitle || item.employee.email})
                    </span>
                    <span>•</span>
                    <span>{item.employee.department || "General"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Submitted {item.latestSubmission ? formatDateTime(item.latestSubmission.submittedAt) : "Recently"}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setDecision("APPROVED");
                      setFeedback("");
                    }}
                    className="gap-2 text-xs"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Review Work
                  </Button>
                </div>
              </div>

              {/* Latest Submission snippet */}
              {item.latestSubmission && (
                <div className="mt-4 rounded-md border border-surface-border bg-surface-raised p-3.5 text-xs space-y-2">
                  <div className="flex items-center justify-between text-brand-muted font-semibold uppercase text-[10px]">
                    <span>Submission #{item.latestSubmission.submissionNumber}</span>
                    <span>{formatDateTime(item.latestSubmission.submittedAt)}</span>
                  </div>
                  {item.latestSubmission.submissionText && (
                    <p className="text-brand-text whitespace-pre-wrap leading-relaxed">
                      {item.latestSubmission.submissionText}
                    </p>
                  )}
                  {item.latestSubmission.links && item.latestSubmission.links.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-2">
                      {item.latestSubmission.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-editorial-700 hover:text-editorial-900 font-medium underline"
                        >
                          {link.title || link.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Dialog Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-surface rounded-lg border border-surface-border p-6 shadow-warm-lg space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-editorial-900">
                  Review Submission
                </h3>
                <p className="text-xs text-brand-muted">
                  {selectedItem.task.title} • {selectedItem.employee.name}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision("APPROVED")}
                    className={`flex flex-col items-center justify-center p-3 rounded-md border text-xs font-semibold transition-all ${
                      decision === "APPROVED"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-surface-border bg-white text-brand-muted hover:border-stone-400"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision("CHANGES_REQUESTED")}
                    className={`flex flex-col items-center justify-center p-3 rounded-md border text-xs font-semibold transition-all ${
                      decision === "CHANGES_REQUESTED"
                        ? "border-coral-500 bg-coral-50 text-coral-600 ring-2 ring-coral-400/20"
                        : "border-surface-border bg-white text-brand-muted hover:border-stone-400"
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-coral-500 mb-1" />
                    Request Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision("FEEDBACK_ONLY")}
                    className={`flex flex-col items-center justify-center p-3 rounded-md border text-xs font-semibold transition-all ${
                      decision === "FEEDBACK_ONLY"
                        ? "border-editorial-800 bg-editorial-50 text-editorial-900 ring-2 ring-editorial-800/20"
                        : "border-surface-border bg-white text-brand-muted hover:border-stone-400"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-editorial-800 mb-1" />
                    Feedback Only
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Manager Feedback & Instructions
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={
                    decision === "CHANGES_REQUESTED"
                      ? "Explain what needs correction before resubmission..."
                      : "Provide constructive evaluation, congratulations, or guidance..."
                  }
                  className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={decision === "CHANGES_REQUESTED" ? "accent" : "primary"}
                  size="sm"
                  isLoading={isPending}
                >
                  Submit Decision
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
