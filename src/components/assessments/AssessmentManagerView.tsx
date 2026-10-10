"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  createWorksheetAction,
  assignWorksheetAction,
  evaluateAssessmentAction,
  requestResubmissionAction,
} from "@/app/dashboard/assessments/actions";
import { formatDateTime } from "@/lib/utils";
import {
  CheckSquare,
  Plus,
  BookOpen,
  Users,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileCheck2,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

export interface QuestionData {
  id?: string;
  type: "MCQ" | "SHORT_ANSWER" | "LONG_ANSWER" | "FILE_UPLOAD";
  questionText: string;
  options?: string[];
  correctOption?: string;
  maxMarks: number;
  rubric?: string;
}

export interface WorksheetData {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  resources: string | null;
  maxMarks: number;
  passMarks: number;
  allowResubmission: boolean;
  version: number;
  createdAt: Date | string;
  questions: Array<{
    id: string;
    type: string;
    questionText: string;
    options: any;
    correctOption: string | null;
    maxMarks: number;
    order: number;
    rubric: string | null;
  }>;
  assignments: Array<{
    id: string;
    status: string;
  }>;
}

export interface PendingEvaluationItem {
  id: string; // submissionId
  attemptNumber: number;
  submittedAt: Date | string;
  employeeNotes: string | null;
  assignment: {
    id: string;
    status: string;
    allowResubmission: boolean;
    employee: {
      id: string;
      user: {
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
    };
    worksheet: {
      id: string;
      title: string;
      maxMarks: number;
      passMarks: number;
      allowResubmission: boolean;
      questions: Array<{
        id: string;
        type: string;
        questionText: string;
        options: any;
        correctOption: string | null;
        maxMarks: number;
        rubric: string | null;
      }>;
    };
  };
  answers: Array<{
    id: string;
    questionId: string;
    selectedOption: string | null;
    textAnswer: string | null;
    fileUrl: string | null;
    marksAwarded: number | null;
    autoGraded: boolean;
    feedback: string | null;
  }>;
  evaluation?: {
    id: string;
    totalMarksAwarded: number;
    status: string;
    feedback: string | null;
  } | null;
}

interface AssessmentManagerViewProps {
  worksheets: WorksheetData[];
  pendingSubmissions: PendingEvaluationItem[];
  allSubmissions: PendingEvaluationItem[];
  availableMembers: Array<{ id: string; name: string; email: string }>;
}

export function AssessmentManagerView({
  worksheets,
  pendingSubmissions,
  allSubmissions,
  availableMembers,
}: AssessmentManagerViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"worksheets" | "evaluations" | "gradebook">("worksheets");

  // Create Worksheet Drawer State
  const [isCreatingWorksheet, setIsCreatingWorksheet] = useState(false);
  const [worksheetTitle, setWorksheetTitle] = useState("");
  const [worksheetDesc, setWorksheetDesc] = useState("");
  const [worksheetInstructions, setWorksheetInstructions] = useState("");
  const [worksheetResources, setWorksheetResources] = useState("");
  const [worksheetPassMarks, setWorksheetPassMarks] = useState("50");
  const [worksheetAllowResubmission, setWorksheetAllowResubmission] = useState(true);
  const [questions, setQuestions] = useState<QuestionData[]>([
    {
      type: "MCQ",
      questionText: "",
      options: ["", ""],
      correctOption: "",
      maxMarks: 5,
      rubric: "",
    },
  ]);
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Assign Worksheet Modal State
  const [assigningWorksheet, setAssigningWorksheet] = useState<WorksheetData | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignAllowResubmission, setAssignAllowResubmission] = useState(true);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Evaluation Dialog State
  const [evaluatingSubmission, setEvaluatingSubmission] = useState<PendingEvaluationItem | null>(null);
  const [gradesMap, setGradesMap] = useState<Record<string, { marks: number; feedback: string }>>({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [evaluateError, setEvaluateError] = useState("");
  const [evaluateLoading, setEvaluateLoading] = useState(false);

  // Resubmission Request State
  const [resubmissionReason, setResubmissionReason] = useState("");
  const [resubmissionLoading, setResubmissionLoading] = useState(false);

  // Question manipulation helpers
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "SHORT_ANSWER",
        questionText: "",
        maxMarks: 5,
        rubric: "",
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestion = (idx: number, updates: Partial<QuestionData>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...updates };
    setQuestions(updated);
  };

  const handleAddOption = (qIdx: number) => {
    const q = questions[qIdx];
    const opts = q.options ? [...q.options, ""] : ["", ""];
    handleUpdateQuestion(qIdx, { options: opts });
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    const q = questions[qIdx];
    if (!q.options) return;
    const opts = [...q.options];
    opts[optIdx] = val;
    handleUpdateQuestion(qIdx, { options: opts });
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    const q = questions[qIdx];
    if (!q.options || q.options.length <= 2) return;
    const opts = q.options.filter((_, i) => i !== optIdx);
    handleUpdateQuestion(qIdx, { options: opts });
  };

  // Submit worksheet creation
  const handleSaveWorksheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);

    const formData = new FormData();
    formData.append("title", worksheetTitle);
    formData.append("description", worksheetDesc);
    formData.append("instructions", worksheetInstructions);
    formData.append("resources", worksheetResources);
    formData.append("passMarks", worksheetPassMarks);
    formData.append("allowResubmission", worksheetAllowResubmission ? "true" : "false");
    formData.append("questions", JSON.stringify(questions));

    const res = await createWorksheetAction(formData);
    setCreateLoading(false);

    if (res.error) {
      setCreateError(res.error);
    } else {
      setIsCreatingWorksheet(false);
      setWorksheetTitle("");
      setWorksheetDesc("");
      setWorksheetInstructions("");
      setQuestions([
        {
          type: "MCQ",
          questionText: "",
          options: ["", ""],
          correctOption: "",
          maxMarks: 5,
          rubric: "",
        },
      ]);
      router.refresh();
    }
  };

  // Submit assignment
  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningWorksheet) return;
    setAssignError("");
    setAssignSuccess("");
    setAssignLoading(true);

    const formData = new FormData();
    formData.append("worksheetId", assigningWorksheet.id);
    selectedEmployees.forEach((id) => formData.append("employeeMembershipIds", id));
    if (assignDueDate) formData.append("dueDate", assignDueDate);
    formData.append("allowResubmission", assignAllowResubmission ? "true" : "false");

    const res = await assignWorksheetAction(formData);
    setAssignLoading(false);

    if (res.error) {
      setAssignError(res.error);
    } else {
      setAssignSuccess(`Assigned successfully to ${res.count} employee(s).`);
      setTimeout(() => {
        setAssigningWorksheet(null);
        setSelectedEmployees([]);
        setAssignSuccess("");
        router.refresh();
      }, 1200);
    }
  };

  // Open evaluation dialog
  const handleOpenEvaluation = (sub: PendingEvaluationItem) => {
    setEvaluatingSubmission(sub);
    setOverallFeedback(sub.evaluation?.feedback || "");
    const initialGrades: Record<string, { marks: number; feedback: string }> = {};

    sub.assignment.worksheet.questions.forEach((q) => {
      const answer = sub.answers.find((a) => a.questionId === q.id);
      initialGrades[q.id] = {
        marks: answer?.marksAwarded ?? 0,
        feedback: answer?.feedback ?? "",
      };
    });

    setGradesMap(initialGrades);
  };

  // Submit evaluation
  const handleSaveEvaluation = async (releaseNow: boolean) => {
    if (!evaluatingSubmission) return;
    setEvaluateError("");
    setEvaluateLoading(true);

    const questionGrades = Object.entries(gradesMap).map(([questionId, data]) => ({
      questionId,
      marksAwarded: data.marks,
      feedback: data.feedback,
    }));

    const formData = new FormData();
    formData.append("submissionId", evaluatingSubmission.id);
    formData.append("releaseNow", releaseNow ? "true" : "false");
    formData.append("overallFeedback", overallFeedback);
    formData.append("questionGrades", JSON.stringify(questionGrades));

    const res = await evaluateAssessmentAction(formData);
    setEvaluateLoading(false);

    if (res.error) {
      setEvaluateError(res.error);
    } else {
      setEvaluatingSubmission(null);
      router.refresh();
    }
  };

  // Request resubmission
  const handleRequestResubmission = async () => {
    if (!evaluatingSubmission) return;
    setResubmissionLoading(true);

    const formData = new FormData();
    formData.append("assignmentId", evaluatingSubmission.assignment.id);
    formData.append("reason", resubmissionReason);

    const res = await requestResubmissionAction(formData);
    setResubmissionLoading(false);

    if (res.error) {
      setEvaluateError(res.error);
    } else {
      setEvaluatingSubmission(null);
      setResubmissionReason("");
      router.refresh();
    }
  };

  // Metrics
  const totalAssigned = worksheets.reduce((acc, w) => acc + w.assignments.length, 0);
  const totalSubmitted = allSubmissions.length;
  const totalEvaluated = allSubmissions.filter((s) => s.evaluation?.status === "RELEASED").length;

  return (
    <div className="space-y-8">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-editorial-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Worksheet Templates</span>
              <BookOpen className="w-4 h-4 text-editorial-800" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {worksheets.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Active assessment curricula</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-coral-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Pending Reviews</span>
              <Clock className="w-4 h-4 text-coral-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {pendingSubmissions.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Submissions awaiting grading</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Evaluated & Released</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {totalEvaluated}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Completed employee assessments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-editorial-600">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Active Assignments</span>
              <Users className="w-4 h-4 text-editorial-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {totalAssigned}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Assigned employee worksheets</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("worksheets")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === "worksheets"
                ? "bg-editorial-800 text-white"
                : "text-brand-muted hover:text-editorial-900 hover:bg-canvas-subtle"
            }`}
          >
            Worksheets ({worksheets.length})
          </button>
          <button
            onClick={() => setActiveTab("evaluations")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors relative ${
              activeTab === "evaluations"
                ? "bg-editorial-800 text-white"
                : "text-brand-muted hover:text-editorial-900 hover:bg-canvas-subtle"
            }`}
          >
            Pending Evaluations ({pendingSubmissions.length})
            {pendingSubmissions.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-coral-500 text-white rounded-full">
                {pendingSubmissions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("gradebook")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === "gradebook"
                ? "bg-editorial-800 text-white"
                : "text-brand-muted hover:text-editorial-900 hover:bg-canvas-subtle"
            }`}
          >
            All Submissions ({allSubmissions.length})
          </button>
        </div>

        {activeTab === "worksheets" && (
          <Button
            variant="accent"
            size="sm"
            className="gap-2"
            onClick={() => setIsCreatingWorksheet(true)}
          >
            <Plus className="w-4 h-4" />
            Create Worksheet
          </Button>
        )}
      </div>

      {/* TAB 1: Worksheets List */}
      {activeTab === "worksheets" && (
        <div>
          {worksheets.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No Worksheets Created"
              description="Create your first assessment with multiple-choice, short answer, or practical file upload questions."
              actionLabel="Create Worksheet"
              onAction={() => setIsCreatingWorksheet(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {worksheets.map((w) => (
                <Card key={w.id} className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="neutral" className="text-[10px] font-mono">
                        v{w.version} • {w.questions.length} Question{w.questions.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="coral" className="text-[10px]">
                        {w.maxMarks} Max Marks
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2 line-clamp-1">{w.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {w.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-surface-border py-2.5">
                      <div>
                        <span className="text-brand-muted block">Pass Threshold</span>
                        <span className="font-semibold text-editorial-900">{w.passMarks} Marks</span>
                      </div>
                      <div>
                        <span className="text-brand-muted block">Resubmissions</span>
                        <span className="font-semibold text-editorial-900">
                          {w.allowResubmission ? "Allowed" : "Single Attempt"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-brand-muted">
                        Assigned: <strong>{w.assignments.length}</strong> employee(s)
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setAssigningWorksheet(w);
                          setSelectedEmployees([]);
                          setAssignDueDate("");
                          setAssignAllowResubmission(w.allowResubmission);
                        }}
                      >
                        Assign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Pending Evaluations Queue */}
      {activeTab === "evaluations" && (
        <Card>
          <CardHeader>
            <CardTitle>Submissions Awaiting Evaluation</CardTitle>
            <CardDescription>
              Assess completed worksheets, review auto-graded MCQ answers, and assign subjective marks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingSubmissions.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="All Submissions Evaluated"
                description="There are currently no candidate submissions awaiting manual grading."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Worksheet</th>
                      <th className="px-4 py-3">Attempt</th>
                      <th className="px-4 py-3">Submitted At</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {pendingSubmissions.map((sub) => {
                      const empName = [sub.assignment.employee.user.firstName, sub.assignment.employee.user.lastName]
                        .filter(Boolean)
                        .join(" ") || sub.assignment.employee.user.email;
                      return (
                        <tr key={sub.id} className="hover:bg-canvas-subtle/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-editorial-900">{empName}</div>
                            <div className="text-xs text-brand-muted">{sub.assignment.employee.user.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-editorial-900">{sub.assignment.worksheet.title}</div>
                            <div className="text-xs text-brand-muted">{sub.assignment.worksheet.maxMarks} max marks</div>
                          </td>
                          <td className="px-4 py-3 text-brand-text">Attempt #{sub.attemptNumber}</td>
                          <td className="px-4 py-3 text-xs text-brand-muted">
                            {formatDateTime(sub.submittedAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => handleOpenEvaluation(sub)}
                            >
                              Grade Submission
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Gradebook / All Submissions */}
      {activeTab === "gradebook" && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Gradebook & History</CardTitle>
            <CardDescription>
              Complete record of all attempts, evaluations, and released marks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allSubmissions.length === 0 ? (
              <EmptyState
                icon={FileCheck2}
                title="No Submissions Recorded"
                description="Once employees submit assigned worksheets, their evaluations and grades will be indexed here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                    <tr>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Worksheet</th>
                      <th className="px-4 py-3">Attempt</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Evaluation Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {allSubmissions.map((sub) => {
                      const empName = [sub.assignment.employee.user.firstName, sub.assignment.employee.user.lastName]
                        .filter(Boolean)
                        .join(" ") || sub.assignment.employee.user.email;
                      const hasEvaluation = Boolean(sub.evaluation);
                      const isReleased = sub.evaluation?.status === "RELEASED";
                      const max = sub.assignment.worksheet.maxMarks;
                      const score = sub.evaluation?.totalMarksAwarded ?? 0;
                      const pass = score >= sub.assignment.worksheet.passMarks;

                      return (
                        <tr key={sub.id} className="hover:bg-canvas-subtle/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-editorial-900">{empName}</div>
                            <div className="text-xs text-brand-muted">{sub.assignment.employee.user.email}</div>
                          </td>
                          <td className="px-4 py-3 font-medium text-editorial-900">
                            {sub.assignment.worksheet.title}
                          </td>
                          <td className="px-4 py-3 text-brand-text">Attempt #{sub.attemptNumber}</td>
                          <td className="px-4 py-3">
                            {hasEvaluation ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-editorial-900">
                                  {score} / {max}
                                </span>
                                <Badge variant={pass ? "success" : "coral"} className="text-[10px]">
                                  {pass ? "PASS" : "FAIL"}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-xs text-brand-muted italic">Pending evaluation</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isReleased ? (
                              <Badge variant="success">Released</Badge>
                            ) : hasEvaluation ? (
                              <Badge variant="coral">Draft Saved</Badge>
                            ) : (
                              <Badge variant="neutral">Submitted</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEvaluation(sub)}
                            >
                              {isReleased ? "View / Edit Marks" : "Evaluate"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CREATE WORKSHEET MODAL */}
      {isCreatingWorksheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-xl bg-surface p-6 shadow-warm border border-surface-border max-h-[90vh] overflow-y-auto space-y-6">
            <div>
              <h2 className="font-heading text-xl font-bold text-editorial-900">Create New Worksheet</h2>
              <p className="text-xs text-brand-muted mt-1">
                Configure assessment questions, answer choices, scoring weights, and rubrics.
              </p>
            </div>

            {createError && <Alert variant="error">{createError}</Alert>}

            <form onSubmit={handleSaveWorksheet} className="space-y-6">
              {/* Basic metadata */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                    Worksheet Title *
                  </label>
                  <Input
                    value={worksheetTitle}
                    onChange={(e) => setWorksheetTitle(e.target.value)}
                    placeholder="e.g. Full-Stack Web Architecture & Neon DB Mastery"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                      Passing Score (Marks) *
                    </label>
                    <Input
                      type="number"
                      value={worksheetPassMarks}
                      onChange={(e) => setWorksheetPassMarks(e.target.value)}
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                      Resubmission Policy
                    </label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="allowResub"
                        checked={worksheetAllowResubmission}
                        onChange={(e) => setWorksheetAllowResubmission(e.target.checked)}
                        className="rounded border-surface-border text-editorial-800 focus:ring-coral-500"
                      />
                      <label htmlFor="allowResub" className="text-xs text-editorial-900">
                        Allow managers to request resubmissions
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                    Description & Objectives
                  </label>
                  <textarea
                    value={worksheetDesc}
                    onChange={(e) => setWorksheetDesc(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-surface-border bg-canvas p-2.5 text-xs text-editorial-900 focus:outline-none focus:ring-2 focus:ring-coral-500"
                    placeholder="High level overview of what competencies this worksheet verifies..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                    Candidate Instructions & References
                  </label>
                  <textarea
                    value={worksheetInstructions}
                    onChange={(e) => setWorksheetInstructions(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-surface-border bg-canvas p-2.5 text-xs text-editorial-900 focus:outline-none focus:ring-2 focus:ring-coral-500"
                    placeholder="E.g. Time limit, allowed documentation, formatting standards..."
                  />
                </div>
              </div>

              {/* Dynamic Questions Builder */}
              <div className="space-y-4 pt-4 border-t border-surface-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-editorial-900 uppercase tracking-wide">
                    Questions ({questions.length})
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Add Question
                  </Button>
                </div>

                {questions.map((q, idx) => (
                  <div key={idx} className="rounded-lg border border-surface-border bg-surface-raised p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-bold text-coral-600">Question #{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <Select
                          value={q.type}
                          onChange={(e) => handleUpdateQuestion(idx, { type: e.target.value as any })}
                          className="text-xs"
                        >
                          <option value="MCQ">Multiple Choice (MCQ)</option>
                          <option value="SHORT_ANSWER">Short Answer</option>
                          <option value="LONG_ANSWER">Long Essay / Design</option>
                          <option value="FILE_UPLOAD">File / Project Link</option>
                        </Select>
                        <Input
                          type="number"
                          value={q.maxMarks}
                          onChange={(e) => handleUpdateQuestion(idx, { maxMarks: parseFloat(e.target.value) || 1 })}
                          className="w-20 text-xs"
                          title="Marks"
                          min="0.5"
                          step="0.5"
                        />
                        <span className="text-xs text-brand-muted">pts</span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <Input
                        value={q.questionText}
                        onChange={(e) => handleUpdateQuestion(idx, { questionText: e.target.value })}
                        placeholder="Type question prompt..."
                        required
                        className="text-xs"
                      />
                    </div>

                    {/* MCQ Options Config */}
                    {q.type === "MCQ" && (
                      <div className="rounded border border-surface-border bg-canvas-subtle p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase text-brand-muted">
                            Choices & Correct Answer (Auto-graded)
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddOption(idx)}
                            className="text-[11px] text-coral-600 hover:underline font-semibold"
                          >
                            + Add Choice
                          </button>
                        </div>
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_${idx}`}
                              checked={q.correctOption === opt && opt.length > 0}
                              onChange={() => handleUpdateQuestion(idx, { correctOption: opt })}
                              title="Mark as correct choice"
                              className="text-coral-600 focus:ring-coral-500"
                            />
                            <Input
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`}
                              className="text-xs flex-1"
                              required
                            />
                            {q.options && q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(idx, optIdx)}
                                className="text-brand-muted hover:text-red-600"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                        <p className="text-[10px] text-brand-muted">
                          Select the radio button next to the correct choice to enable objective auto-grading.
                        </p>
                      </div>
                    )}

                    <div>
                      <Input
                        value={q.rubric || ""}
                        onChange={(e) => handleUpdateQuestion(idx, { rubric: e.target.value })}
                        placeholder="Evaluation criteria / rubric note for grading (optional)"
                        className="text-xs text-brand-muted"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
                <Button type="button" variant="outline" onClick={() => setIsCreatingWorksheet(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" disabled={createLoading}>
                  {createLoading ? "Saving Worksheet..." : "Save Worksheet"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN WORKSHEET MODAL */}
      {assigningWorksheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-warm border border-surface-border space-y-5">
            <div>
              <h2 className="font-heading text-lg font-bold text-editorial-900">
                Assign: {assigningWorksheet.title}
              </h2>
              <p className="text-xs text-brand-muted mt-1">
                Select employees to receive this assessment and set deadlines.
              </p>
            </div>

            {assignError && <Alert variant="error">{assignError}</Alert>}
            {assignSuccess && <Alert variant="success">{assignSuccess}</Alert>}

            <form onSubmit={handleConfirmAssignment} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase text-brand-muted">
                    Select Employees *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedEmployees.length === availableMembers.length) {
                        setSelectedEmployees([]);
                      } else {
                        setSelectedEmployees(availableMembers.map((m) => m.id));
                      }
                    }}
                    className="text-[11px] text-coral-600 hover:underline font-semibold"
                  >
                    {selectedEmployees.length === availableMembers.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-surface-border bg-canvas p-2 space-y-1.5">
                  {availableMembers.map((m) => {
                    const isChecked = selectedEmployees.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-canvas-subtle text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees([...selectedEmployees, m.id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter((id) => id !== m.id));
                            }
                          }}
                          className="rounded border-surface-border text-editorial-800"
                        />
                        <span className="font-medium text-editorial-900">{m.name}</span>
                        <span className="text-[11px] text-brand-muted">({m.email})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                  Due Date (Optional)
                </label>
                <Input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="assignResub"
                  checked={assignAllowResubmission}
                  onChange={(e) => setAssignAllowResubmission(e.target.checked)}
                  className="rounded border-surface-border text-editorial-800"
                />
                <label htmlFor="assignResub" className="text-xs text-editorial-900">
                  Allow resubmissions if corrections requested
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
                <Button type="button" variant="outline" onClick={() => setAssigningWorksheet(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={assignLoading || selectedEmployees.length === 0}
                >
                  {assignLoading ? "Assigning..." : `Assign (${selectedEmployees.length})`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVALUATION DIALOG */}
      {evaluatingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-xl bg-surface p-6 shadow-warm border border-surface-border max-h-[92vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h2 className="font-heading text-lg font-bold text-editorial-900">
                  Evaluating Submission: {evaluatingSubmission.assignment.worksheet.title}
                </h2>
                <p className="text-xs text-brand-muted">
                  Candidate:{" "}
                  <strong>
                    {evaluatingSubmission.assignment.employee.user.firstName ||
                      evaluatingSubmission.assignment.employee.user.email}
                  </strong>{" "}
                  • Attempt #{evaluatingSubmission.attemptNumber} • Submitted on{" "}
                  {formatDateTime(evaluatingSubmission.submittedAt)}
                </p>
              </div>
              <button
                onClick={() => setEvaluatingSubmission(null)}
                className="text-brand-muted hover:text-editorial-900 text-lg"
              >
                &times;
              </button>
            </div>

            {evaluateError && <Alert variant="error">{evaluateError}</Alert>}

            {evaluatingSubmission.employeeNotes && (
              <div className="rounded-lg border border-surface-border bg-canvas-subtle p-3 text-xs">
                <span className="font-bold text-editorial-900 uppercase">Employee Remarks:</span>
                <p className="mt-1 text-brand-muted">{evaluatingSubmission.employeeNotes}</p>
              </div>
            )}

            {/* Questions Grading Breakdown */}
            <div className="space-y-6">
              {evaluatingSubmission.assignment.worksheet.questions.map((q, idx) => {
                const answer = evaluatingSubmission.answers.find((a) => a.questionId === q.id);
                const currentGrade = gradesMap[q.id] || { marks: 0, feedback: "" };

                return (
                  <div key={q.id} className="rounded-lg border border-surface-border bg-surface-raised p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-editorial-800">
                        Question #{idx + 1} ({q.type})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-brand-muted">Max: {q.maxMarks} pts</span>
                        {q.type === "MCQ" && answer?.autoGraded && (
                          <Badge variant={answer.marksAwarded === q.maxMarks ? "success" : "coral"} className="text-[10px]">
                            {answer.marksAwarded === q.maxMarks ? "Auto-Graded: Correct" : "Auto-Graded: Incorrect"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-medium text-editorial-900">{q.questionText}</p>

                    {q.rubric && (
                      <p className="text-[11px] text-brand-muted italic">Criteria: {q.rubric}</p>
                    )}

                    {/* Display candidate's answer */}
                    <div className="rounded border border-surface-border bg-canvas p-3 text-xs">
                      <span className="font-bold text-brand-muted uppercase text-[10px] block mb-1">
                        Candidate Answer:
                      </span>
                      {q.type === "MCQ" ? (
                        <p className="font-medium text-editorial-900">
                          {answer?.selectedOption || <span className="italic text-brand-muted">No choice selected</span>}
                        </p>
                      ) : q.type === "FILE_UPLOAD" ? (
                        answer?.fileUrl ? (
                          <a
                            href={answer.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-coral-600 hover:underline font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open Attached Work ({answer.fileUrl})
                          </a>
                        ) : (
                          <span className="italic text-brand-muted">No attachment provided</span>
                        )
                      ) : (
                        <p className="text-editorial-900 whitespace-pre-wrap leading-relaxed">
                          {answer?.textAnswer || <span className="italic text-brand-muted">No answer entered</span>}
                        </p>
                      )}
                    </div>

                    {/* Grade input & feedback for this question */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-semibold text-brand-muted mb-1 uppercase">
                          Score (Max {q.maxMarks})
                        </label>
                        <Input
                          type="number"
                          value={currentGrade.marks}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setGradesMap({
                              ...gradesMap,
                              [q.id]: { ...currentGrade, marks: val },
                            });
                          }}
                          min="0"
                          max={q.maxMarks}
                          step="0.5"
                          className="text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-brand-muted mb-1 uppercase">
                          Evaluator Question Feedback
                        </label>
                        <Input
                          value={currentGrade.feedback}
                          onChange={(e) => {
                            setGradesMap({
                              ...gradesMap,
                              [q.id]: { ...currentGrade, feedback: e.target.value },
                            });
                          }}
                          placeholder="Specific notes or critique..."
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Feedback */}
            <div>
              <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                Overall Evaluation Summary & Feedback
              </label>
              <textarea
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-surface-border bg-canvas p-2.5 text-xs text-editorial-900 focus:outline-none focus:ring-2 focus:ring-coral-500"
                placeholder="Summary remarks, strengths demonstrated, and guidance for next steps..."
              />
            </div>

            {/* Request resubmission option */}
            {evaluatingSubmission.assignment.allowResubmission && (
              <div className="rounded-lg border border-dashed border-coral-300 bg-coral-50/40 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-coral-800">
                  <RotateCcw className="w-4 h-4" />
                  <span>Request Resubmission</span>
                </div>
                <Input
                  value={resubmissionReason}
                  onChange={(e) => setResubmissionReason(e.target.value)}
                  placeholder="Explain why a resubmission is needed (e.g. incomplete file upload)..."
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRequestResubmission}
                  disabled={resubmissionLoading}
                >
                  {resubmissionLoading ? "Requesting..." : "Send Resubmission Request"}
                </Button>
              </div>
            )}

            {/* Save Draft / Release Controls */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
              <Button type="button" variant="outline" onClick={() => setEvaluatingSubmission(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSaveEvaluation(false)}
                disabled={evaluateLoading}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                variant="accent"
                onClick={() => handleSaveEvaluation(true)}
                disabled={evaluateLoading}
                className="gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {evaluateLoading ? "Releasing..." : "Release Evaluation to Employee"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
