"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  saveAssessmentDraftAction,
  submitAssessmentAction,
} from "@/app/dashboard/assessments/actions";
import { formatDateTime } from "@/lib/utils";
import {
  CheckSquare,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Send,
  Save,
  HelpCircle,
} from "lucide-react";

export interface SanitizedQuestion {
  id: string;
  type: string;
  questionText: string;
  options: any; // array of string options for MCQ; correctOption is NEVER included here!
  maxMarks: number;
  order: number;
  rubric: string | null;
}

export interface EmployeeAssignmentItem {
  id: string;
  status: string;
  dueDate: Date | string | null;
  allowResubmission: boolean;
  worksheet: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    resources: string | null;
    maxMarks: number;
    passMarks: number;
    questions: SanitizedQuestion[];
  };
  latestSubmission?: {
    id: string;
    attemptNumber: number;
    status: string;
    submittedAt: Date | string | null;
    employeeNotes: string | null;
    answers: Array<{
      id: string;
      questionId: string;
      selectedOption: string | null;
      textAnswer: string | null;
      fileUrl: string | null;
      marksAwarded: number | null; // Only populated if evaluation is RELEASED
      feedback: string | null;     // Only populated if evaluation is RELEASED
    }>;
    evaluation?: {
      id: string;
      totalMarksAwarded: number;
      maxMarks: number;
      feedback: string | null;
      status: string;
      releasedAt: Date | string | null;
    } | null;
  } | null;
}

interface AssessmentEmployeeViewProps {
  assignments: EmployeeAssignmentItem[];
}

export function AssessmentEmployeeView({ assignments }: AssessmentEmployeeViewProps) {
  const router = useRouter();

  // Active Answering Modal State
  const [takingAssignment, setTakingAssignment] = useState<EmployeeAssignmentItem | null>(null);
  const [answersMap, setAnswersMap] = useState<Record<string, { selectedOption: string; textAnswer: string; fileUrl: string }>>({});
  const [candidateNotes, setCandidateNotes] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Active Results Modal State
  const [viewingResult, setViewingResult] = useState<EmployeeAssignmentItem | null>(null);

  // Open taking assessment modal
  const handleStartAssessment = (item: EmployeeAssignmentItem) => {
    setTakingAssignment(item);
    setSubmitError("");
    setSubmitSuccess("");
    setCandidateNotes(item.latestSubmission?.employeeNotes || "");

    const initialAnswers: Record<string, { selectedOption: string; textAnswer: string; fileUrl: string }> = {};
    item.worksheet.questions.forEach((q) => {
      const existing = item.latestSubmission?.answers?.find((a) => a.questionId === q.id);
      initialAnswers[q.id] = {
        selectedOption: existing?.selectedOption || "",
        textAnswer: existing?.textAnswer || "",
        fileUrl: existing?.fileUrl || "",
      };
    });

    setAnswersMap(initialAnswers);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!takingAssignment) return;
    setIsSavingDraft(true);
    setSubmitError("");
    setSubmitSuccess("");

    const answersPayload = Object.entries(answersMap).map(([questionId, data]) => ({
      questionId,
      selectedOption: data.selectedOption,
      textAnswer: data.textAnswer,
      fileUrl: data.fileUrl,
    }));

    const formData = new FormData();
    formData.append("assignmentId", takingAssignment.id);
    formData.append("answers", JSON.stringify(answersPayload));

    const res = await saveAssessmentDraftAction(formData);
    setIsSavingDraft(false);

    if (res.error) {
      setSubmitError(res.error);
    } else {
      setSubmitSuccess("Draft saved successfully. You can return and complete this later.");
      setTimeout(() => setSubmitSuccess(""), 3000);
      router.refresh();
    }
  };

  // Final Submit
  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!takingAssignment) return;

    if (!confirm("Are you sure you want to submit your assessment? Once submitted, your answers will be sealed for manager evaluation.")) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const answersPayload = Object.entries(answersMap).map(([questionId, data]) => ({
      questionId,
      selectedOption: data.selectedOption,
      textAnswer: data.textAnswer,
      fileUrl: data.fileUrl,
    }));

    const formData = new FormData();
    formData.append("assignmentId", takingAssignment.id);
    formData.append("employeeNotes", candidateNotes);
    formData.append("answers", JSON.stringify(answersPayload));

    const res = await submitAssessmentAction(formData);
    setIsSubmitting(false);

    if (res.error) {
      setSubmitError(res.error);
    } else {
      setTakingAssignment(null);
      router.refresh();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "EVALUATED":
        return <Badge variant="success">Evaluated & Released</Badge>;
      case "SUBMITTED":
        return <Badge variant="editorial">Submitted • Awaiting Review</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="coral">In Progress (Draft Saved)</Badge>;
      case "RESUBMISSION_REQUESTED":
        return <Badge variant="coral">Resubmission Requested</Badge>;
      default:
        return <Badge variant="neutral">Pending Start</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <Card>
        <CardHeader>
          <CardTitle>My Worksheets & Assessments</CardTitle>
          <CardDescription>
            Curriculum assessments, skill tests, and practical evaluations assigned to your onboarding profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No Assessments Assigned"
              description="You do not currently have any pending worksheets or assessments. Your manager will assign modules as you progress."
            />
          ) : (
            <div className="space-y-4">
              {assignments.map((item) => {
                const latest = item.latestSubmission;
                const isEvaluated = item.status === "EVALUATED" && latest?.evaluation?.status === "RELEASED";
                const isSubmitted = item.status === "SUBMITTED";
                const isPendingOrDraft = item.status === "PENDING" || item.status === "IN_PROGRESS" || item.status === "RESUBMISSION_REQUESTED";
                const score = latest?.evaluation?.totalMarksAwarded ?? 0;
                const max = item.worksheet.maxMarks;
                const passed = score >= item.worksheet.passMarks;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-lg border border-surface-border bg-surface-raised hover:border-editorial-500/30 transition-all gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(item.status)}
                        {item.dueDate && (
                          <span className="text-xs text-brand-muted flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className="text-xs font-mono text-brand-muted">
                          {item.worksheet.questions.length} Questions • {item.worksheet.maxMarks} Max Marks
                        </span>
                      </div>

                      <h3 className="font-heading text-base font-bold text-editorial-900">
                        {item.worksheet.title}
                      </h3>

                      <p className="text-xs text-brand-muted line-clamp-2">
                        {item.worksheet.description || "Complete questions and submit work for manager review."}
                      </p>

                      {isEvaluated && latest?.evaluation && (
                        <div className="pt-2 flex items-center gap-3">
                          <span className="text-xs font-bold text-editorial-900">
                            Score: {score} / {max} ({Math.round((score / max) * 100)}%)
                          </span>
                          <Badge variant={passed ? "success" : "coral"} className="text-[10px]">
                            {passed ? "PASSED" : "NEEDS IMPROVEMENT"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isEvaluated ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingResult(item)}
                          className="gap-1.5 text-xs"
                        >
                          <Award className="w-3.5 h-3.5 text-coral-600" />
                          View Results & Feedback
                        </Button>
                      ) : isPendingOrDraft ? (
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => handleStartAssessment(item)}
                          className="gap-1.5 text-xs"
                        >
                          {item.status === "RESUBMISSION_REQUESTED"
                            ? "Revise & Resubmit"
                            : item.status === "IN_PROGRESS"
                            ? "Continue Draft"
                            : "Start Assessment"}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-xs opacity-70"
                          >
                            Under Review
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TAKING ASSESSMENT MODAL */}
      {takingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-xl bg-surface p-6 shadow-warm border border-surface-border max-h-[92vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h2 className="font-heading text-xl font-bold text-editorial-900">
                  {takingAssignment.worksheet.title}
                </h2>
                <p className="text-xs text-brand-muted mt-0.5">
                  {takingAssignment.worksheet.questions.length} Questions • Total {takingAssignment.worksheet.maxMarks} Marks • Pass Threshold: {takingAssignment.worksheet.passMarks} Marks
                </p>
              </div>
              <button
                onClick={() => setTakingAssignment(null)}
                className="text-brand-muted hover:text-editorial-900 text-lg"
              >
                &times;
              </button>
            </div>

            {submitError && <Alert variant="error">{submitError}</Alert>}
            {submitSuccess && <Alert variant="success">{submitSuccess}</Alert>}

            {/* Instructions & Resources Header */}
            {takingAssignment.worksheet.instructions && (
              <div className="rounded-lg border border-surface-border bg-canvas-subtle p-3.5 text-xs space-y-1">
                <span className="font-bold text-editorial-900 uppercase">Assessment Instructions:</span>
                <p className="text-brand-muted leading-relaxed whitespace-pre-wrap">
                  {takingAssignment.worksheet.instructions}
                </p>
                {takingAssignment.worksheet.resources && (
                  <p className="pt-1 text-[11px] text-coral-600 font-semibold">
                    Resources: {takingAssignment.worksheet.resources}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmitAssessment} className="space-y-6">
              {takingAssignment.worksheet.questions.map((q, idx) => {
                const currentAnswer = answersMap[q.id] || { selectedOption: "", textAnswer: "", fileUrl: "" };

                return (
                  <div key={q.id} className="rounded-lg border border-surface-border bg-surface-raised p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-coral-600">
                        Question #{idx + 1}
                      </span>
                      <span className="text-xs text-brand-muted font-semibold">{q.maxMarks} Marks</span>
                    </div>

                    <p className="text-sm font-semibold text-editorial-900 leading-snug">
                      {q.questionText}
                    </p>

                    {q.rubric && (
                      <p className="text-[11px] text-brand-muted italic">Guideline: {q.rubric}</p>
                    )}

                    {/* MCQ Options Rendering */}
                    {q.type === "MCQ" && (
                      <div className="space-y-2 pt-1">
                        {Array.isArray(q.options) &&
                          q.options.map((opt: string, optIdx: number) => (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${
                                currentAnswer.selectedOption === opt
                                  ? "border-coral-500 bg-coral-50/50 text-editorial-900 font-semibold"
                                  : "border-surface-border bg-canvas hover:bg-canvas-subtle text-brand-text"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question_${q.id}`}
                                value={opt}
                                checked={currentAnswer.selectedOption === opt}
                                onChange={() =>
                                  setAnswersMap({
                                    ...answersMap,
                                    [q.id]: { ...currentAnswer, selectedOption: opt },
                                  })
                                }
                                className="text-coral-600 focus:ring-coral-500"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                      </div>
                    )}

                    {/* Short Answer Input */}
                    {q.type === "SHORT_ANSWER" && (
                      <div>
                        <Input
                          value={currentAnswer.textAnswer}
                          onChange={(e) =>
                            setAnswersMap({
                              ...answersMap,
                              [q.id]: { ...currentAnswer, textAnswer: e.target.value },
                            })
                          }
                          placeholder="Type concise answer here..."
                          className="text-xs"
                        />
                      </div>
                    )}

                    {/* Long Answer Textarea */}
                    {q.type === "LONG_ANSWER" && (
                      <div>
                        <textarea
                          value={currentAnswer.textAnswer}
                          onChange={(e) =>
                            setAnswersMap({
                              ...answersMap,
                              [q.id]: { ...currentAnswer, textAnswer: e.target.value },
                            })
                          }
                          rows={4}
                          placeholder="Provide thorough reasoning, architecture analysis, or code snippets..."
                          className="w-full rounded-md border border-surface-border bg-canvas p-2.5 text-xs text-editorial-900 focus:outline-none focus:ring-2 focus:ring-coral-500"
                        />
                      </div>
                    )}

                    {/* File Upload / Link Input */}
                    {q.type === "FILE_UPLOAD" && (
                      <div className="space-y-1">
                        <Input
                          type="url"
                          value={currentAnswer.fileUrl}
                          onChange={(e) =>
                            setAnswersMap({
                              ...answersMap,
                              [q.id]: { ...currentAnswer, fileUrl: e.target.value },
                            })
                          }
                          placeholder="https://github.com/... or Google Drive / Figma artifact URL"
                          className="text-xs"
                        />
                        <p className="text-[10px] text-brand-muted">
                          Paste public URL to your repository, shared document, or deliverables package.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Employee Notes / Remarks */}
              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                  Optional Comments / Notes to Manager
                </label>
                <textarea
                  value={candidateNotes}
                  onChange={(e) => setCandidateNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-surface-border bg-canvas p-2 text-xs text-editorial-900 focus:outline-none focus:ring-2 focus:ring-coral-500"
                  placeholder="Any context regarding assumptions made, references used, or implementation details..."
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                  className="gap-2 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingDraft ? "Saving Draft..." : "Save Draft"}
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTakingAssignment(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? "Submitting..." : "Submit Final Answers"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW EVALUATION RESULTS MODAL */}
      {viewingResult && viewingResult.latestSubmission?.evaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl bg-surface p-6 shadow-warm border border-surface-border max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h2 className="font-heading text-xl font-bold text-editorial-900">
                  Assessment Results: {viewingResult.worksheet.title}
                </h2>
                <p className="text-xs text-brand-muted mt-0.5">
                  Released on {formatDateTime(viewingResult.latestSubmission.evaluation.releasedAt)}
                </p>
              </div>
              <button
                onClick={() => setViewingResult(null)}
                className="text-brand-muted hover:text-editorial-900 text-lg"
              >
                &times;
              </button>
            </div>

            {/* Scorecard Banner */}
            <div className="rounded-lg bg-editorial-800 p-5 text-white flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold text-editorial-100">Final Awarded Score</p>
                <div className="text-2xl font-bold font-mono mt-1">
                  {viewingResult.latestSubmission.evaluation.totalMarksAwarded} / {viewingResult.worksheet.maxMarks}
                </div>
                <p className="text-xs text-editorial-100 mt-0.5">
                  Percentage:{" "}
                  {Math.round(
                    (viewingResult.latestSubmission.evaluation.totalMarksAwarded /
                      viewingResult.worksheet.maxMarks) *
                      100
                  )}
                  %
                </p>
              </div>
              <div>
                <Badge
                  variant={
                    viewingResult.latestSubmission.evaluation.totalMarksAwarded >=
                    viewingResult.worksheet.passMarks
                      ? "success"
                      : "coral"
                  }
                  className="text-sm px-3 py-1 font-bold"
                >
                  {viewingResult.latestSubmission.evaluation.totalMarksAwarded >=
                  viewingResult.worksheet.passMarks
                    ? "PASSED"
                    : "NEEDS REVIEW"}
                </Badge>
              </div>
            </div>

            {/* Evaluator Feedback */}
            {viewingResult.latestSubmission.evaluation.feedback && (
              <div className="rounded-lg border border-surface-border bg-canvas-subtle p-4 text-xs space-y-1">
                <span className="font-bold text-editorial-900 uppercase">Manager Feedback:</span>
                <p className="text-brand-muted leading-relaxed whitespace-pre-wrap">
                  {viewingResult.latestSubmission.evaluation.feedback}
                </p>
              </div>
            )}

            {/* Question Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                Question Breakdown
              </h3>
              {viewingResult.worksheet.questions.map((q, idx) => {
                const answer = viewingResult.latestSubmission?.answers?.find((a) => a.questionId === q.id);
                return (
                  <div key={q.id} className="rounded-lg border border-surface-border bg-surface-raised p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-editorial-800">
                        Question #{idx + 1}
                      </span>
                      <span className="font-mono text-xs font-bold text-coral-600">
                        {answer?.marksAwarded ?? 0} / {q.maxMarks} pts
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-editorial-900">{q.questionText}</p>

                    <div className="text-xs text-brand-muted bg-canvas p-2.5 rounded border border-surface-border">
                      <span className="text-[10px] uppercase font-bold text-brand-muted block mb-0.5">
                        Your Submitted Answer:
                      </span>
                      {q.type === "MCQ" ? (
                        <span>{answer?.selectedOption || "No option selected"}</span>
                      ) : q.type === "FILE_UPLOAD" ? (
                        <a href={answer?.fileUrl || "#"} target="_blank" rel="noreferrer" className="text-coral-600 underline">
                          {answer?.fileUrl || "No file URL provided"}
                        </a>
                      ) : (
                        <span className="whitespace-pre-wrap">{answer?.textAnswer || "No text provided"}</span>
                      )}
                    </div>

                    {answer?.feedback && (
                      <p className="text-[11px] text-coral-600 font-medium">
                        Notes: {answer.feedback}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-surface-border">
              <Button variant="outline" onClick={() => setViewingResult(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
