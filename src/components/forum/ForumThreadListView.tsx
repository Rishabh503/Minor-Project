"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { createForumThreadAction } from "@/app/dashboard/forum/actions";
import { formatDateTime } from "@/lib/utils";
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  HelpCircle,
  Paperclip,
  Check,
  FileText,
  Layers,
  CheckSquare,
  AlertCircle,
  Users,
  Calendar,
} from "lucide-react";

export interface ForumThreadSummary {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  createdAt: Date | string;
  isReported: boolean;
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
  meeting?: { id: string; title: string; startTime: Date | string } | null;
  _count: {
    replies: number;
  };
  acceptedReplyId: string | null;
}

interface ForumThreadListViewProps {
  threads: ForumThreadSummary[];
  availableTasks: Array<{ id: string; title: string }>;
  availableWorksheets: Array<{ id: string; title: string }>;
  currentMembershipId: string;
  isManagerOrAdmin: boolean;
}

export function ForumThreadListView({
  threads,
  availableTasks,
  availableWorksheets,
  currentMembershipId,
  isManagerOrAdmin,
}: ForumThreadListViewProps) {
  const router = useRouter();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const [myQuestionsOnly, setMyQuestionsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "replies">("newest");

  // Modal State
  const [isAsking, setIsAsking] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [linkedTaskId, setLinkedTaskId] = useState("");
  const [linkedWorksheetId, setLinkedWorksheetId] = useState("");
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string }>>([]);
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Add attachment helper
  const handleAddAttachment = () => {
    if (!attachmentName.trim() || !attachmentUrl.trim()) return;
    setAttachments([...attachments, { name: attachmentName.trim(), url: attachmentUrl.trim() }]);
    setAttachmentName("");
    setAttachmentUrl("");
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  // Submit Question
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("category", category);
    if (linkedTaskId) formData.append("taskId", linkedTaskId);
    if (linkedWorksheetId) formData.append("worksheetId", linkedWorksheetId);
    formData.append("attachments", JSON.stringify(attachments));

    const res = await createForumThreadAction(formData);
    setCreateLoading(false);

    if (res.error) {
      setCreateError(res.error);
    } else {
      setIsAsking(false);
      setTitle("");
      setContent("");
      setCategory("GENERAL");
      setLinkedTaskId("");
      setLinkedWorksheetId("");
      setAttachments([]);
      router.push(`/dashboard/forum/${res.threadId}`);
    }
  };

  // Filtered & Sorted Threads
  const filteredThreads = useMemo(() => {
    return threads
      .filter((t) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = t.title.toLowerCase().includes(q);
          const matchesContent = t.content.toLowerCase().includes(q);
          if (!matchesTitle && !matchesContent) return false;
        }

        // Category filter
        if (selectedCategory !== "ALL" && t.category !== selectedCategory) {
          return false;
        }

        // Status filter
        if (selectedStatus !== "ALL" && t.status !== selectedStatus) {
          return false;
        }

        // Unanswered quick filter
        if (unansweredOnly && t._count.replies > 0) {
          return false;
        }

        // My questions filter
        if (myQuestionsOnly && t.author.id !== currentMembershipId) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "replies") {
          return b._count.replies - a._count.replies;
        }
        // Newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [threads, searchQuery, selectedCategory, selectedStatus, unansweredOnly, myQuestionsOnly, sortBy, currentMembershipId]);

  // Metrics
  const totalOpen = threads.filter((t) => t.status === "OPEN").length;
  const totalResolved = threads.filter((t) => t.status === "RESOLVED").length;
  const totalUnanswered = threads.filter((t) => t._count.replies === 0).length;

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "TECHNICAL":
        return <Badge variant="editorial">Technical</Badge>;
      case "TASK_QUERY":
        return <Badge variant="coral">Task Query</Badge>;
      case "WORKSHEET_QUERY":
        return <Badge variant="coral">Assessment Query</Badge>;
      case "ONBOARDING":
        return <Badge variant="success">Onboarding</Badge>;
      case "POLICY":
        return <Badge variant="neutral">Company Policy</Badge>;
      default:
        return <Badge variant="neutral">General</Badge>;
    }
  };

  const getStatusBadge = (status: string, hasAcceptedAnswer: boolean) => {
    if (status === "RESOLVED") {
      return (
        <Badge variant="success" className="gap-1 text-[10px]">
          <CheckCircle2 className="w-3 h-3" />
          Resolved
        </Badge>
      );
    }
    if (status === "ANSWERED") {
      return (
        <Badge variant="editorial" className="gap-1 text-[10px]">
          <MessageSquare className="w-3 h-3" />
          Answered
        </Badge>
      );
    }
    return (
      <Badge variant="coral" className="gap-1 text-[10px]">
        <AlertCircle className="w-3 h-3" />
        Open
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-editorial-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>All Discussions</span>
              <MessageSquare className="w-4 h-4 text-editorial-800" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {threads.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Community knowledge base</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-coral-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Awaiting Response</span>
              <HelpCircle className="w-4 h-4 text-coral-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {totalUnanswered}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">0 replies recorded</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Resolved Doubts</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {totalResolved}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Confirmed solutions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-stone-600">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Open Queries</span>
              <Clock className="w-4 h-4 text-stone-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-editorial-900">
              {totalOpen}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-brand-muted">Active threads in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Search, Filters & Ask Button */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, error codes, topics..."
              className="pl-9 text-xs"
            />
          </div>

          <Button variant="accent" size="sm" onClick={() => setIsAsking(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Ask Question
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-surface-border pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs w-36"
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="TECHNICAL">Technical</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="TASK_QUERY">Task Queries</option>
              <option value="WORKSHEET_QUERY">Assessment Queries</option>
              <option value="POLICY">Policy</option>
            </Select>

            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs w-32"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ANSWERED">Answered</option>
              <option value="RESOLVED">Resolved</option>
            </Select>

            <button
              onClick={() => setUnansweredOnly(!unansweredOnly)}
              className={`px-3 py-1.5 rounded-md font-medium border transition-colors ${
                unansweredOnly
                  ? "bg-coral-50 border-coral-300 text-coral-800"
                  : "bg-surface border-surface-border text-brand-muted hover:text-editorial-900"
              }`}
            >
              Unanswered ({totalUnanswered})
            </button>

            <button
              onClick={() => setMyQuestionsOnly(!myQuestionsOnly)}
              className={`px-3 py-1.5 rounded-md font-medium border transition-colors ${
                myQuestionsOnly
                  ? "bg-editorial-100 border-editorial-300 text-editorial-900"
                  : "bg-surface border-surface-border text-brand-muted hover:text-editorial-900"
              }`}
            >
              My Questions
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-brand-muted">Sort:</span>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs w-32"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="replies">Most Activity</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Threads List */}
      <div>
        {filteredThreads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No Discussions Found"
            description={
              searchQuery || selectedCategory !== "ALL" || selectedStatus !== "ALL" || unansweredOnly || myQuestionsOnly
                ? "No questions match your current search and filter criteria. Try adjusting your filters."
                : "The forum is currently empty. Start the first discussion or ask a doubt to your mentors!"
            }
            actionLabel="Ask a Question"
            onAction={() => setIsAsking(true)}
          />
        ) : (
          <div className="space-y-3">
            {filteredThreads.map((thread) => {
              const hasAcceptedAnswer = Boolean(thread.acceptedReplyId);
              const authorName =
                [thread.author.user.firstName, thread.author.user.lastName].filter(Boolean).join(" ") ||
                thread.author.user.email;

              return (
                <Link
                  key={thread.id}
                  href={`/dashboard/forum/${thread.id}`}
                  className="block rounded-lg border border-surface-border bg-surface-raised p-4 hover:border-editorial-500/40 hover:shadow-warm transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(thread.status, hasAcceptedAnswer)}
                        {getCategoryBadge(thread.category)}
                        {thread.task && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-muted bg-canvas-subtle px-2 py-0.5 rounded border border-surface-border">
                            <Layers className="w-3 h-3 text-editorial-700" />
                            Task: {thread.task.title}
                          </span>
                        )}
                        {thread.worksheet && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-muted bg-canvas-subtle px-2 py-0.5 rounded border border-surface-border">
                            <CheckSquare className="w-3 h-3 text-coral-600" />
                            Worksheet: {thread.worksheet.title}
                          </span>
                        )}
                        {thread.meeting && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Calendar className="w-3 h-3 text-emerald-600" />
                            Session Booked
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-editorial-900 group-hover:text-coral-600 transition-colors line-clamp-1">
                        {thread.title}
                      </h3>

                      <p className="text-xs text-brand-muted line-clamp-2">
                        {thread.content}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-brand-muted">
                        <span className="font-medium text-editorial-800">{authorName}</span>
                        <span>•</span>
                        <span>{formatDateTime(thread.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-editorial-900">
                        <MessageSquare className="w-4 h-4 text-editorial-700" />
                        <span>{thread._count.replies}</span>
                        <span className="text-brand-muted font-normal">
                          {thread._count.replies === 1 ? "reply" : "replies"}
                        </span>
                      </div>

                      {hasAcceptedAnswer && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <Check className="w-3 h-3" />
                          Solution Found
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ASK QUESTION MODAL */}
      {isAsking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl bg-surface p-6 shadow-warm border border-surface-border max-h-[92vh] overflow-y-auto space-y-6">
            <div>
              <h2 className="font-heading text-xl font-bold text-editorial-900">
                Ask a Question or Raise a Doubt
              </h2>
              <p className="text-xs text-brand-muted mt-1">
                Share questions with your teammates, mentors, and managers. Detailed queries receive faster answers!
              </p>
            </div>

            {createError && <Alert variant="error">{createError}</Alert>}

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                  Question Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How do I configure SSL connections with Prisma in staging?"
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                    Category *
                  </label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-xs"
                  >
                    <option value="GENERAL">General Discussion</option>
                    <option value="TECHNICAL">Technical Architecture</option>
                    <option value="ONBOARDING">Onboarding Checklist</option>
                    <option value="TASK_QUERY">Task & Assignment Query</option>
                    <option value="WORKSHEET_QUERY">Worksheet Assessment Query</option>
                    <option value="POLICY">Company Policy</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                    Link Task Reference (Optional)
                  </label>
                  <Select
                    value={linkedTaskId}
                    onChange={(e) => setLinkedTaskId(e.target.value)}
                    className="text-xs"
                  >
                    <option value="">None</option>
                    {availableTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                  Link Worksheet Reference (Optional)
                </label>
                <Select
                  value={linkedWorksheetId}
                  onChange={(e) => setLinkedWorksheetId(e.target.value)}
                  className="text-xs"
                >
                  <option value="">None</option>
                  {availableWorksheets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.title}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted mb-1">
                  Detailed Description *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="Explain your question, reproduction steps, expected behavior, or code snippets..."
                  required
                  className="w-full rounded-md border border-surface-border bg-canvas p-2.5 text-xs text-editorial-900 focus:outline-none focus:ring-2 focus:ring-coral-500"
                />
              </div>

              {/* Attachments Section */}
              <div className="space-y-2 pt-2 border-t border-surface-border">
                <label className="block text-xs font-semibold uppercase text-brand-muted">
                  Attach Links / Documents (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="Document Name (e.g. Error Log)"
                    className="text-xs flex-1"
                  />
                  <Input
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://gist.github.com/... or Google Drive link"
                    className="text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAttachment}
                    disabled={!attachmentName.trim() || !attachmentUrl.trim()}
                  >
                    Add
                  </Button>
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachments.map((att, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs bg-canvas-subtle border border-surface-border px-2 py-1 rounded"
                      >
                        <Paperclip className="w-3 h-3 text-editorial-700" />
                        <span>{att.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="text-brand-muted hover:text-red-600 font-bold ml-1"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
                <Button type="button" variant="outline" onClick={() => setIsAsking(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" disabled={createLoading}>
                  {createLoading ? "Publishing..." : "Post Question"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
