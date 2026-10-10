"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { enforceRole, requireActiveCompanyContext } from "@/lib/auth";
import {
  createForumThreadSchema,
  createForumReplySchema,
  markAcceptedReplySchema,
  resolveThreadSchema,
  reopenThreadSchema,
  reportContentSchema,
  moderateContentSchema,
  scheduleDiscussionMeetingSchema,
} from "@/lib/validations/forum";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { formatDateTime } from "@/lib/utils";
import {
  CompanyRole,
  ForumCategory,
  ForumThreadStatus,
  MeetingType,
  MeetingStatus,
  AttendanceStatus,
} from "@prisma/client";

/**
 * Creates a new forum discussion thread.
 */
export async function createForumThreadAction(formData: FormData) {
  const context = await requireActiveCompanyContext();
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;

  const title = (formData.get("title") as string) || "";
  const content = (formData.get("content") as string) || "";
  const category = (formData.get("category") as string) || "GENERAL";
  const taskId = (formData.get("taskId") as string) || "";
  const worksheetId = (formData.get("worksheetId") as string) || "";
  const attachmentsRaw = (formData.get("attachments") as string) || "[]";

  let attachments = [];
  try {
    attachments = JSON.parse(attachmentsRaw);
  } catch (e) {
    attachments = [];
  }

  const parsed = createForumThreadSchema.safeParse({
    title,
    content,
    category,
    taskId,
    worksheetId,
    attachments,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const data = parsed.data;

  try {
    const thread = await db.forumThread.create({
      data: {
        companyId,
        authorMembershipId: callerMembershipId,
        title: data.title,
        content: data.content,
        category: data.category,
        status: ForumThreadStatus.OPEN,
        taskId: data.taskId || null,
        worksheetId: data.worksheetId || null,
        attachments: data.attachments.length > 0 ? (data.attachments as any) : undefined,
      },
    });

    await logAuditEvent({
      companyId,
      actorId: context.dbUser.id,
      action: "FORUM_THREAD_CREATED",
      entityType: "ForumThread",
      entityId: thread.id,
      metadata: {
        title: thread.title,
        category: thread.category,
      },
    });

    revalidatePath("/dashboard/forum");
    return { success: true, threadId: thread.id };
  } catch (error) {
    console.error("Error creating forum thread:", error);
    return { error: "Failed to create discussion thread" };
  }
}

/**
 * Posts a reply to an existing forum thread.
 */
export async function createForumReplyAction(formData: FormData) {
  const context = await requireActiveCompanyContext();
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;

  const threadId = (formData.get("threadId") as string) || "";
  const content = (formData.get("content") as string) || "";
  const attachmentsRaw = (formData.get("attachments") as string) || "[]";

  let attachments = [];
  try {
    attachments = JSON.parse(attachmentsRaw);
  } catch (e) {
    attachments = [];
  }

  const parsed = createForumReplySchema.safeParse({ threadId, content, attachments });
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const thread = await db.forumThread.findFirst({
    where: { id: threadId, companyId },
    include: {
      author: { include: { user: true } },
    },
  });

  if (!thread) {
    return { error: "Discussion thread not found or unauthorized" };
  }

  try {
    const reply = await db.$transaction(async (tx) => {
      const created = await tx.forumReply.create({
        data: {
          threadId,
          authorMembershipId: callerMembershipId,
          content: parsed.data.content,
          attachments: parsed.data.attachments.length > 0 ? (parsed.data.attachments as any) : undefined,
        },
        include: {
          author: { include: { user: true } },
        },
      });

      // If thread is OPEN, bump to ANSWERED
      if (thread.status === ForumThreadStatus.OPEN) {
        await tx.forumThread.update({
          where: { id: threadId },
          data: { status: ForumThreadStatus.ANSWERED },
        });
      }

      return created;
    });

    // Notify thread author if someone else replied
    if (thread.authorMembershipId !== callerMembershipId && thread.author?.user?.email) {
      const replierName = context.dbUser.firstName || context.dbUser.email;
      sendEmail({
        to: thread.author.user.email,
        subject: `New response on your question: ${thread.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0c1e32;">New Reply on Discussion</h2>
            <p>Hello ${thread.author.user.firstName || "there"},</p>
            <p><strong>${replierName}</strong> posted a reply to your question <em>"${thread.title}"</em>:</p>
            <blockquote style="border-left: 4px solid #e85d42; padding-left: 12px; margin: 16px 0; color: #475569;">
              ${parsed.data.content}
            </blockquote>
            <p>Log in to your dashboard to review the response and follow up.</p>
          </div>
        `,
      }).catch((err) => console.error("Email notification failed:", err));
    }

    await logAuditEvent({
      companyId,
      actorId: context.dbUser.id,
      action: "FORUM_REPLY_POSTED",
      entityType: "ForumReply",
      entityId: reply.id,
      metadata: { threadId },
    });

    revalidatePath(`/dashboard/forum`);
    revalidatePath(`/dashboard/forum/${threadId}`);
    return { success: true };
  } catch (error) {
    console.error("Error creating forum reply:", error);
    return { error: "Failed to post reply" };
  }
}

/**
 * Marks a reply as the accepted answer and marks the thread as resolved.
 */
export async function markAcceptedReplyAction(formData: FormData) {
  const context = await requireActiveCompanyContext();
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;
  const isManagerOrAdmin =
    context.membership!.role === CompanyRole.MANAGER ||
    context.membership!.role === CompanyRole.COMPANY_ADMIN ||
    context.isPlatformAdmin;

  const threadId = (formData.get("threadId") as string) || "";
  const replyId = (formData.get("replyId") as string) || "";

  const parsed = markAcceptedReplySchema.safeParse({ threadId, replyId });
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const thread = await db.forumThread.findFirst({
    where: { id: threadId, companyId },
    include: {
      author: { include: { user: true } },
    },
  });

  if (!thread) {
    return { error: "Thread not found or unauthorized" };
  }

  // Only thread author or managers/admins can mark accepted answer
  if (thread.authorMembershipId !== callerMembershipId && !isManagerOrAdmin) {
    return { error: "Only the thread author or a manager can mark an accepted answer" };
  }

  const reply = await db.forumReply.findFirst({
    where: { id: replyId, threadId },
    include: {
      author: { include: { user: true } },
    },
  });

  if (!reply) {
    return { error: "Reply not found" };
  }

  try {
    await db.$transaction(async (tx) => {
      // Clear previous accepted flags on this thread
      await tx.forumReply.updateMany({
        where: { threadId },
        data: { isAcceptedAnswer: false },
      });

      // Mark this reply as accepted
      await tx.forumReply.update({
        where: { id: replyId },
        data: { isAcceptedAnswer: true },
      });

      // Update thread
      await tx.forumThread.update({
        where: { id: threadId },
        data: {
          acceptedReplyId: replyId,
          status: ForumThreadStatus.RESOLVED,
          resolvedAt: new Date(),
          resolvedByMembershipId: callerMembershipId,
        },
      });
    });

    // Notify reply author that their answer was accepted
    if (reply.author?.user?.email && reply.authorMembershipId !== callerMembershipId) {
      sendEmail({
        to: reply.author.user.email,
        subject: `Your answer was accepted: ${thread.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">Solution Accepted!</h2>
            <p>Hello ${reply.author.user.firstName || "there"},</p>
            <p>Your response to <strong>"${thread.title}"</strong> was marked as the accepted solution.</p>
            <p>Thank you for helping your teammate!</p>
          </div>
        `,
      }).catch((err) => console.error("Email notification failed:", err));
    }

    await logAuditEvent({
      companyId,
      actorId: context.dbUser.id,
      action: "FORUM_REPLY_ACCEPTED",
      entityType: "ForumThread",
      entityId: threadId,
      metadata: { replyId },
    });

    revalidatePath(`/dashboard/forum`);
    revalidatePath(`/dashboard/forum/${threadId}`);
    return { success: true };
  } catch (error) {
    console.error("Error accepting reply:", error);
    return { error: "Failed to mark reply as accepted answer" };
  }
}

/**
 * Manually confirms resolution of a thread.
 */
export async function resolveThreadAction(formData: FormData) {
  const context = await requireActiveCompanyContext();
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;
  const isManagerOrAdmin =
    context.membership!.role === CompanyRole.MANAGER ||
    context.membership!.role === CompanyRole.COMPANY_ADMIN ||
    context.isPlatformAdmin;

  const threadId = (formData.get("threadId") as string) || "";
  const parsed = resolveThreadSchema.safeParse({ threadId });
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const thread = await db.forumThread.findFirst({
    where: { id: threadId, companyId },
  });

  if (!thread) {
    return { error: "Thread not found or unauthorized" };
  }

  if (thread.authorMembershipId !== callerMembershipId && !isManagerOrAdmin) {
    return { error: "Only the thread author or a manager can resolve this thread" };
  }

  try {
    await db.forumThread.update({
      where: { id: threadId },
      data: {
        status: ForumThreadStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedByMembershipId: callerMembershipId,
      },
    });

    await logAuditEvent({
      companyId,
      actorId: context.dbUser.id,
      action: "FORUM_THREAD_RESOLVED",
      entityType: "ForumThread",
      entityId: threadId,
    });

    revalidatePath(`/dashboard/forum`);
    revalidatePath(`/dashboard/forum/${threadId}`);
    return { success: true };
  } catch (error) {
    console.error("Error resolving thread:", error);
    return { error: "Failed to resolve thread" };
  }
}

/**
 * Reopens a resolved thread.
 */
export async function reopenThreadAction(formData: FormData) {
  const context = await requireActiveCompanyContext();
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;
  const isManagerOrAdmin =
    context.membership!.role === CompanyRole.MANAGER ||
    context.membership!.role === CompanyRole.COMPANY_ADMIN ||
    context.isPlatformAdmin;

  const threadId = (formData.get("threadId") as string) || "";
  const parsed = reopenThreadSchema.safeParse({ threadId });
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const thread = await db.forumThread.findFirst({
    where: { id: threadId, companyId },
  });

  if (!thread) {
    return { error: "Thread not found or unauthorized" };
  }

  if (thread.authorMembershipId !== callerMembershipId && !isManagerOrAdmin) {
    return { error: "Only the thread author or a manager can reopen this thread" };
  }

  try {
    await db.forumThread.update({
      where: { id: threadId },
      data: {
        status: ForumThreadStatus.OPEN,
        resolvedAt: null,
        resolvedByMembershipId: null,
      },
    });

    revalidatePath(`/dashboard/forum`);
    revalidatePath(`/dashboard/forum/${threadId}`);
    return { success: true };
  } catch (error) {
    console.error("Error reopening thread:", error);
    return { error: "Failed to reopen thread" };
  }
}

/**
 * Flags thread or reply for moderation.
 */
export async function reportContentAction(formData: FormData) {
  const context = await requireActiveCompanyContext();
  const companyId = context.company!.id;

  const targetType = (formData.get("targetType") as any) || "THREAD";
  const targetId = (formData.get("targetId") as string) || "";
  const reason = (formData.get("reason") as string) || "";

  const parsed = reportContentSchema.safeParse({ targetType, targetId, reason });
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  try {
    if (parsed.data.targetType === "THREAD") {
      await db.forumThread.update({
        where: { id: targetId, companyId },
        data: {
          isReported: true,
          reportReason: parsed.data.reason,
        },
      });
    } else {
      await db.forumReply.update({
        where: { id: targetId },
        data: {
          isReported: true,
          reportReason: parsed.data.reason,
        },
      });
    }

    await logAuditEvent({
      companyId,
      actorId: context.dbUser.id,
      action: "FORUM_CONTENT_REPORTED",
      entityType: parsed.data.targetType === "THREAD" ? "ForumThread" : "ForumReply",
      entityId: targetId,
      metadata: { reason: parsed.data.reason },
    });

    revalidatePath(`/dashboard/forum`);
    return { success: true };
  } catch (error) {
    console.error("Error reporting content:", error);
    return { error: "Failed to submit report" };
  }
}

/**
 * Manager/Admin moderation action to hide or unhide reported content.
 */
export async function moderateContentAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const targetType = (formData.get("targetType") as any) || "THREAD";
  const targetId = (formData.get("targetId") as string) || "";
  const isModerated = formData.get("isModerated") === "true";

  const parsed = moderateContentSchema.safeParse({ targetType, targetId, isModerated });
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  try {
    if (parsed.data.targetType === "THREAD") {
      await db.forumThread.update({
        where: { id: targetId, companyId },
        data: { isModerated: parsed.data.isModerated },
      });
    } else {
      await db.forumReply.update({
        where: { id: targetId },
        data: { isModerated: parsed.data.isModerated },
      });
    }

    await logAuditEvent({
      companyId,
      actorId: context.dbUser.id,
      action: parsed.data.isModerated ? "FORUM_CONTENT_HIDDEN" : "FORUM_CONTENT_RESTORED",
      entityType: parsed.data.targetType === "THREAD" ? "ForumThread" : "ForumReply",
      entityId: targetId,
    });

    revalidatePath(`/dashboard/forum`);
    return { success: true };
  } catch (error) {
    console.error("Error moderating content:", error);
    return { error: "Failed to update moderation status" };
  }
}

/**
 * Manager creates a Help Session meeting associated with this discussion thread.
 */
export async function scheduleDiscussionMeetingAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;

  const threadId = (formData.get("threadId") as string) || "";
  const title = (formData.get("title") as string) || "";
  const startTime = (formData.get("startTime") as string) || "";
  const endTime = (formData.get("endTime") as string) || "";
  const meetingUrl = (formData.get("meetingUrl") as string) || "";
  const location = (formData.get("location") as string) || "";

  const parsed = scheduleDiscussionMeetingSchema.safeParse({
    threadId,
    title,
    startTime,
    endTime,
    meetingUrl,
    location,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const thread = await db.forumThread.findFirst({
    where: { id: threadId, companyId },
    include: {
      author: { include: { user: true } },
    },
  });

  if (!thread) {
    return { error: "Discussion thread not found or unauthorized" };
  }

  const start = new Date(parsed.data.startTime);
  const end = new Date(parsed.data.endTime);

  try {
    const meeting = await db.$transaction(async (tx) => {
      const createdMeeting = await tx.meeting.create({
        data: {
          companyId,
          organizerMembershipId: callerMembershipId,
          title: parsed.data.title,
          description: `Dedicated Help Session requested for forum discussion: "${thread.title}"`,
          type: MeetingType.HELP_SESSION,
          status: MeetingStatus.SCHEDULED,
          startTime: start,
          endTime: end,
          meetingUrl: parsed.data.meetingUrl || null,
          location: parsed.data.location || null,
          participants: {
            create: [
              {
                membershipId: thread.authorMembershipId,
                attendanceStatus: AttendanceStatus.ACCEPTED,
              },
            ],
          },
        },
      });

      // Link meeting to discussion thread
      await tx.forumThread.update({
        where: { id: threadId },
        data: {
          meetingId: createdMeeting.id,
        },
      });

      return createdMeeting;
    });

    // Notify employee of scheduled session
    if (thread.author?.user?.email) {
      sendEmail({
        to: thread.author.user.email,
        subject: `Help Session Scheduled: ${parsed.data.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0c1e32;">Help Session Scheduled</h2>
            <p>Hello ${thread.author.user.firstName || "there"},</p>
            <p>Your manager has scheduled a 1-on-1 Help Session to resolve your discussion query on <strong>"${thread.title}"</strong>.</p>
            <p><strong>Time:</strong> ${formatDateTime(start)} - ${formatDateTime(end)}</p>
            ${parsed.data.meetingUrl ? `<p><strong>Join Call:</strong> <a href="${parsed.data.meetingUrl}">${parsed.data.meetingUrl}</a></p>` : ""}
            <p>We look forward to meeting with you.</p>
          </div>
        `,
      }).catch((err) => console.error("Email notification failed:", err));
    }

    await logAuditEvent({
      companyId,
      actorId: context.dbUser.id,
      action: "FORUM_MEETING_SCHEDULED",
      entityType: "Meeting",
      entityId: meeting.id,
      metadata: { threadId },
    });

    revalidatePath(`/dashboard/forum`);
    revalidatePath(`/dashboard/forum/${threadId}`);
    revalidatePath(`/dashboard/schedule`);
    return { success: true, meetingId: meeting.id };
  } catch (error) {
    console.error("Error scheduling discussion meeting:", error);
    return { error: "Failed to schedule help session" };
  }
}
