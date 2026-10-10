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
  createTaskAction,
  duplicateTaskAction,
  archiveTaskAction,
  importHistoricalRecordAction,
} from "./actions";
import { formatDateTime } from "@/lib/utils";
import {
  Plus,
  History,
  Copy,
  Archive,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  Users,
  Search,
  ExternalLink,
} from "lucide-react";

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  type: string;
  priority: string;
  startDate: Date | string | null;
  dueDate: Date | string | null;
  isTemplate: boolean;
  isHistorical: boolean;
  isArchived: boolean;
  createdAt: Date | string;
  creator: {
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  } | null;
  _count: {
    assignments: number;
  };
  assignments: Array<{
    id: string;
    status: string;
    employeeMembership: {
      user: {
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
    };
  }>;
}

interface TasksManagerClientProps {
  initialTasks: TaskItem[];
  departments: Array<{ id: string; name: string }>;
  batches: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; name: string; email: string }>;
}

export function TasksManagerClient({
  initialTasks,
  departments,
  batches,
  employees,
}: TasksManagerClientProps) {
  const router = useRouter();
  const [filterType, setFilterType] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState<"create" | "historical" | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [assigneeMode, setAssigneeMode] = useState<"individual" | "all" | "department" | "batch">("all");

  const filteredTasks = useMemo(() => {
    return initialTasks.filter((t) => {
      if (t.isArchived) return false;

      // Filter Tab
      if (filterType === "TEMPLATES" && !t.isTemplate) return false;
      if (filterType === "HISTORICAL" && !t.isHistorical) return false;
      if (filterType === "DAILY" && t.type !== "DAILY_TASK") return false;
      if (filterType === "TRAINING" && t.type !== "TRAINING_ACTIVITY") return false;

      // Search
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !(t.description || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [initialTasks, filterType, search]);

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await createTaskAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Task created and assignments dispatched.");
      setActiveModal(null);
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const handleImportHistorical = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await importHistoricalRecordAction(formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Historical record successfully archived.");
      setActiveModal(null);
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const handleDuplicate = async (taskId: string) => {
    setError(null);
    setIsPending(true);
    const res = await duplicateTaskAction(taskId);
    setIsPending(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Task duplicated successfully.");
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const handleArchive = async (taskId: string) => {
    setError(null);
    setIsPending(true);
    const res = await archiveTaskAction(taskId);
    setIsPending(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Task moved to archive.");
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-canvas-subtle rounded-lg border border-surface-border text-xs">
          {[
            { id: "ALL", label: "All Tasks" },
            { id: "TRAINING", label: "Training Activities" },
            { id: "DAILY", label: "Daily Tasks" },
            { id: "TEMPLATES", label: "Templates" },
            { id: "HISTORICAL", label: "Historical Records" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterType === tab.id
                  ? "bg-editorial-800 text-white shadow-sm"
                  : "text-brand-muted hover:text-editorial-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveModal("historical")}
            className="gap-1.5 text-xs"
          >
            <History className="w-3.5 h-3.5" />
            Import Historical Record
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => setActiveModal("create")}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-muted" />
        <input
          type="text"
          placeholder="Filter tasks by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-surface-border bg-surface pl-9 pr-3 py-2 text-sm text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
        />
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No tasks match the filter"
          description="Use the buttons above to create your first actionable task, assign training modules, or import historical records."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const completedCount = task.assignments.filter(
              (a) => a.status === "COMPLETED"
            ).length;
            const totalAssigned = task._count.assignments;
            const completionRate =
              totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

            return (
              <Card key={task.id} className="flex flex-col justify-between hover:shadow-warm transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="editorial">{task.type.replace("_", " ")}</Badge>
                        <Badge
                          variant={
                            task.priority === "URGENT"
                              ? "coral"
                              : task.priority === "HIGH"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {task.priority}
                        </Badge>
                        {task.isHistorical && <Badge variant="neutral">Historical Archive</Badge>}
                        {task.isTemplate && <Badge variant="coral">Template</Badge>}
                      </div>
                      <CardTitle className="text-base font-bold mt-1 text-editorial-900">
                        {task.title}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicate(task.id)}
                        title="Duplicate Task"
                        disabled={isPending}
                        className="p-1 rounded text-brand-muted hover:text-editorial-800 hover:bg-canvas-subtle"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchive(task.id)}
                        title="Archive Task"
                        disabled={isPending}
                        className="p-1 rounded text-brand-muted hover:text-rose-600 hover:bg-canvas-subtle"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {task.description && (
                    <CardDescription className="line-clamp-2 text-xs mt-1">
                      {task.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Progress & Deadlines */}
                  <div className="flex items-center justify-between text-xs text-brand-muted pt-2 border-t border-surface-border">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : "No deadline"}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-editorial-900">
                      <Users className="w-3.5 h-3.5" />
                      {totalAssigned} assigned
                    </span>
                  </div>

                  {totalAssigned > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-brand-muted">
                        <span>Completion Rate</span>
                        <span>{completedCount} / {totalAssigned} ({completionRate}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-canvas-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-editorial-800 rounded-full transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {activeModal === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-surface rounded-lg border border-surface-border p-6 shadow-warm-lg space-y-4 my-8">
            <h3 className="font-heading text-lg font-bold text-editorial-900">
              Create & Assign Task
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <Input
                label="Task Title"
                name="title"
                required
                placeholder="e.g. Complete AWS Security Compliance Assessment"
              />

              <div className="grid grid-cols-2 gap-4">
                <Select label="Task Type" name="type" defaultValue="TRAINING_ACTIVITY">
                  <option value="TRAINING_ACTIVITY">Training Activity</option>
                  <option value="DAILY_TASK">Daily Task</option>
                  <option value="RECURRING_TASK">Recurring Task</option>
                  <option value="TEMPLATE">Reusable Template</option>
                </Select>

                <Select label="Priority" name="priority" defaultValue="MEDIUM">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Start Date" name="startDate" type="date" />
                <Input label="Due Date / Deadline" name="dueDate" type="date" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Overview / Objective
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Summary of this task and intended learning outcomes..."
                  className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Detailed Instructions & Submission Criteria
                </label>
                <textarea
                  name="instructions"
                  rows={3}
                  placeholder="Step-by-step guidance, deliverables required (e.g. upload link, write brief)..."
                  className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Resource URLs (one per line)
                </label>
                <textarea
                  name="resourceLinks"
                  rows={2}
                  placeholder="https://docs.company.internal/guide&#10;https://github.com/org/repo"
                  className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm font-mono text-xs text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
                />
              </div>

              {/* Assignment Target Selection */}
              <div className="border-t border-surface-border pt-3 space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Assign To
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { mode: "all", label: "Everyone" },
                    { mode: "department", label: "Department" },
                    { mode: "batch", label: "Cohort Batch" },
                    { mode: "individual", label: "Individual" },
                  ].map((target) => (
                    <button
                      key={target.mode}
                      type="button"
                      onClick={() => setAssigneeMode(target.mode as any)}
                      className={`py-1.5 text-xs font-medium rounded border ${
                        assigneeMode === target.mode
                          ? "bg-editorial-800 text-white border-editorial-800"
                          : "border-surface-border text-brand-muted hover:border-stone-400"
                      }`}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="assigneeMode" value={assigneeMode} />

                {assigneeMode === "department" && (
                  <Select label="Target Department" name="targetId" required>
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                )}

                {assigneeMode === "batch" && (
                  <Select label="Target Cohort Batch" name="targetId" required>
                    <option value="">Select Cohort Batch</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                )}

                {assigneeMode === "individual" && (
                  <Select label="Select Employee" name="singleAssigneeId" required>
                    <option value="">Choose an employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.email})
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3">
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
                  Dispatch Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Historical Record Modal */}
      {activeModal === "historical" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-surface rounded-lg border border-surface-border p-6 shadow-warm-lg space-y-4 my-8">
            <h3 className="font-heading text-lg font-bold text-editorial-900">
              Import Historical Training Activity
            </h3>
            <p className="text-xs text-brand-muted">
              Document past certifications or training completed previously. This will be recorded directly into historical archives without creating pending employee tasks.
            </p>

            <form onSubmit={handleImportHistorical} className="space-y-4">
              <Input
                label="Historical Activity / Course Title"
                name="title"
                required
                placeholder="e.g. HIPAA Security & Privacy Certification 2025"
              />

              <Input
                label="Historical Completion Date"
                name="completionDate"
                type="date"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Description / Certificate Authority
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="External provider, completion criteria, or certificate ID..."
                  className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Employees Who Completed This Record
                </label>
                <div className="max-h-40 overflow-y-auto rounded border border-surface-border p-2 space-y-1.5 bg-canvas-subtle">
                  {employees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 text-xs text-brand-text cursor-pointer hover:bg-white p-1 rounded">
                      <input
                        type="checkbox"
                        name="employeeMembershipIds"
                        value={emp.id}
                        className="rounded border-stone-300 text-editorial-800"
                      />
                      <span>{emp.name} ({emp.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
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
                  variant="accent"
                  size="sm"
                  isLoading={isPending}
                >
                  Import Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
