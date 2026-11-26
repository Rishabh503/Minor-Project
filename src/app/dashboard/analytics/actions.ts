"use server";

import { CompanyRole, ForumThreadStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { enforceRole } from "@/lib/auth";
import { generateJson } from "@/lib/ai/gemini";

export async function analyzeDoubtsAction() {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;
  const managerScope = context.membership!.role === CompanyRole.MANAGER;
  const reportIds = managerScope
    ? (await db.employeeProfile.findMany({ where: { managerMembershipId: context.membership!.id }, select: { membershipId: true } })).map((profile) => profile.membershipId)
    : undefined;
  if (managerScope && !reportIds?.length) return { error: "No direct-report questions are available to analyze." };

  const threads = await db.forumThread.findMany({
    where: {
      companyId,
      status: { in: [ForumThreadStatus.OPEN, ForumThreadStatus.ANSWERED] },
      ...(reportIds ? { authorMembershipId: { in: reportIds } } : {}),
    },
    select: { title: true, content: true, category: true, replies: { select: { content: true }, take: 2, orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  if (!threads.length) return { error: "There are no open or answered questions to analyze." };

  try {
    const result = await generateJson<{ themes: Array<{ topic: string; count: number; summary: string; suggestion: string }>; overallSummary: string }>(
      `Analyze these employee forum questions. Group recurring issues into themes, estimate the number of questions in each theme, summarize the confusion, and suggest a practical manager follow-up. Do not identify employees or infer personal attributes. Use only the supplied text. Return JSON with overallSummary and themes[{topic,count,summary,suggestion}]. Limit themes to 6.\n\n${JSON.stringify(threads)}`,
    );
    return {
      overallSummary: String(result.overallSummary || "").slice(0, 1200),
      themes: (result.themes || []).slice(0, 6).map((theme) => ({
        topic: String(theme.topic || "General").slice(0, 100),
        count: Math.max(1, Math.min(threads.length, Math.floor(Number(theme.count) || 1))),
        summary: String(theme.summary || "").slice(0, 800),
        suggestion: String(theme.suggestion || "").slice(0, 800),
      })),
      analyzedCount: threads.length,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not analyze forum questions." };
  }
}
