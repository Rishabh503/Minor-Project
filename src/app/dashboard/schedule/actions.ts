"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { enforceRole, requireActiveCompanyContext } from "@/lib/auth";
import {
  createMeetingSchema,
  rescheduleMeetingSchema,
  cancelMeetingSchema,
  updateMeetingNotesSchema,
  submitDoubtSchema,
} from "@/lib/validations/schedule";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { formatDateTime } from "@/lib/utils";
import {
  CompanyRole,
  MeetingStatus,
  MeetingType,
  AttendanceStatus,
  DoubtStatus,
} from "@prisma/client";

/**
 * Checks for conflicting meetings for the given memberships within [startTime, endTime].
 */
export async function checkSchedulingConflicts(
  companyId: string,
  membershipIds: string[],
  startTime: Date,
  endTime: Date,
  excludeMeetingId?: string
) {
  return await db.meeting.findMany({
    where: {
      companyId,
      status: { not: MeetingStatus.CANCELLED },
      ...(excludeMeetingId ? { id: { not: excludeMeetingId } } : {}),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      OR: [
        { organizerMembershipId: { in: membershipIds } },
        { participants: { some: { membershipId: { in: membershipIds } } } },
      ],
    },
    include: {
      organizer: { include: { user: true } },
    },
  });
}

/**
 * Schedules a new training session, 1-on-1, team meeting, or help session.
 */
export async function createMeetingAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;
  const callerMembershipId = context.membership!.id;

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || "",
    agenda: formData.get("agenda") || "",
    type: formData.get("type"),
    startTime: formData.get("startTime") || "",
    endTime: formData.get("endTime") || "",
    meetingUrl: formData.get("meetingUrl") || "",
    location: formData.get("location") || "",
    participantIds: formData.getAll("participantIds") as string[],
    sourceDoubtId: formData.get("sourceDoubtId") || "",
  };

  const forceSchedule = formData.get("forceSchedule") === "true";

  const parsed = createMeetingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const data = parsed.data;
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  // Check conflicts
  const allInvolvedMembers = Array.from(
    new Set([callerMembershipId, ...data.participantIds])
  );

  const conflicts = await checkSchedulingConflicts(
    companyId,
    allInvolvedMembers,
    start,
    end
  );

  if (conflicts.length > 0 && !forceSchedule) {
    const conflictTitles = conflicts.map((c) => `"${c.title}"`).join(", ");
    return {
      conflictWarning: true,
      conflictMessage: `Scheduling conflict detected with existing session(s): ${conflictTitles}. You can adjust the time or proceed anyway.`,
    };
  }

  try {
    const meeting = await db.$transaction(async (tx) => {
      // 1. Create meeting record
      const created = await tx.meeting.create({
        data: {
          companyId,
          organizerMembershipId: callerMembershipId,
          title: data.title,
          description: data.description || null,
          agenda: data.agenda || null,
          type: data.type,
          status: MeetingStatus.SCHEDULED,
          startTime: start,
          endTime: end,
          meetingUrl: data.meetingUrl || null,
          location: data.location || null,
          sourceDoubtId: data.sourceDoubtId || null,
        },
      });

      // 2. Add participants
      await tx.meetingParticipant.createMany({
        data: data.participantIds.map((pId) => ({
          meetingId: created.id,
          membershipId: pId,
          attendanceStatus: AttendanceStatus.INVITED,
        })),
        skipDuplicates: true,
      });

      // 3. If source doubt provided, mark as SCHEDULED
      if (data.sourceDoubtId) {
        await tx.employeeDoubt.update({
          where: { id: data.sourceDoubtId },
          data: { status: DoubtStatus.SCHEDULED },
        });
      }

      return created;
    });

    // Notify participants via email
    const participants = await db.companyMembership.findMany({
      where: { id: { in: data.participantIds } },
      include: { user: true },
    });

    for (const p of participants) {
      if (p.user.email) {
        await sendEmail({
          to: p.user.email,
          subject: `Meeting Scheduled: ${meeting.title} (${meeting.type.replace("_", " ")})`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #141920;">
              <h2 style="color: #0C1E32;">You have a new scheduled session</h2>
              <p><strong>${meeting.title}</strong></p>
              <p><strong>Time:</strong> ${formatDateTime(meeting.startTime)} &ndash; ${formatDateTime(meeting.endTime)}</p>
              ${meeting.meetingUrl ? `<p><strong>Join URL:</strong> <a href="${meeting.meetingUrl}">${meeting.meetingUrl}</a></p>` : ""}
              ${meeting.agenda ? `<p><strong>Agenda:</strong> ${meeting.agenda}</p>` : ""}
            </div>
          `,
          text: `You have a new meeting: ${meeting.title} on ${formatDateTime(meeting.startTime)}. URL: ${meeting.meetingUrl || "N/A"}`,
        });
      }
    }

    await logAuditEvent({
      action: "MEETING_SCHEDULED",
      entityType: "Meeting",
      entityId: meeting.id,
      companyId,
      actorId: context.dbUser.id,
      metadata: {
        title: meeting.title,
        type: meeting.type,
        startTime: meeting.startTime,
        participantCount: data.participantIds.length,
      },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to schedule meeting." };
  }

  revalidatePath("/dashboard/schedule");
  return { success: true };
}

/**
 * Reschedules an existing meeting to a new time.
 */
export async function rescheduleMeetingAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const raw = {
    meetingId: formData.get("meetingId"),
    startTime: formData.get("startTime") || "",
    endTime: formData.get("endTime") || "",
    rescheduleReason: formData.get("rescheduleReason") || "",
  };

  const parsed = rescheduleMeetingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const { meetingId, startTime, endTime, rescheduleReason } = parsed.data;
  const start = new Date(startTime);
  const end = new Date(endTime);

  const meeting = await db.meeting.findFirst({
    where: { id: meetingId, companyId },
    include: {
      participants: { include: { membership: { include: { user: true } } } },
    },
  });

  if (!meeting) return { error: "Meeting not found." };

  try {
    const updated = await db.meeting.update({
      where: { id: meetingId },
      data: {
        startTime: start,
        endTime: end,
        status: MeetingStatus.RESCHEDULED,
        cancellationReason: rescheduleReason ? `Rescheduled: ${rescheduleReason}` : null,
      },
    });

    // Email notification
    for (const p of meeting.participants) {
      if (p.membership.user.email) {
        await sendEmail({
          to: p.membership.user.email,
          subject: `Meeting Rescheduled: ${meeting.title}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #E85D42;">Session Rescheduled</h2>
              <p><strong>${meeting.title}</strong> has been moved to a new time:</p>
              <p><strong>New Time:</strong> ${formatDateTime(start)} &ndash; ${formatDateTime(end)}</p>
              ${rescheduleReason ? `<p><strong>Reason:</strong> ${rescheduleReason}</p>` : ""}
            </div>
          `,
        });
      }
    }

    await logAuditEvent({
      action: "MEETING_RESCHEDULED",
      entityType: "Meeting",
      entityId: meeting.id,
      companyId,
      actorId: context.dbUser.id,
      metadata: { newStartTime: start, reason: rescheduleReason },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to reschedule meeting." };
  }

  revalidatePath("/dashboard/schedule");
  return { success: true };
}

/**
 * Cancels a scheduled meeting with reason.
 */
export async function cancelMeetingAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const raw = {
    meetingId: formData.get("meetingId"),
    cancellationReason: formData.get("cancellationReason") || "",
  };

  const parsed = cancelMeetingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const { meetingId, cancellationReason } = parsed.data;

  const meeting = await db.meeting.findFirst({
    where: { id: meetingId, companyId },
    include: {
      participants: { include: { membership: { include: { user: true } } } },
    },
  });

  if (!meeting) return { error: "Meeting not found." };

  try {
    await db.meeting.update({
      where: { id: meetingId },
      data: {
        status: MeetingStatus.CANCELLED,
        cancellationReason: cancellationReason || "Cancelled by organizer",
      },
    });

    for (const p of meeting.participants) {
      if (p.membership.user.email) {
        await sendEmail({
          to: p.membership.user.email,
          subject: `Session Cancelled: ${meeting.title}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #0C1E32;">Session Cancelled</h2>
              <p><strong>${meeting.title}</strong> scheduled for ${formatDateTime(meeting.startTime)} has been cancelled.</p>
              ${cancellationReason ? `<p><strong>Reason:</strong> ${cancellationReason}</p>` : ""}
            </div>
          `,
        });
      }
    }

    await logAuditEvent({
      action: "MEETING_CANCELLED",
      entityType: "Meeting",
      entityId: meeting.id,
      companyId,
      actorId: context.dbUser.id,
      metadata: { cancellationReason },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to cancel meeting." };
  }

  revalidatePath("/dashboard/schedule");
  return { success: true };
}

/**
 * Updates meeting collaborative notes, action items checklist, and participant attendance.
 */
export async function updateMeetingNotesAction(formData: FormData) {
  const context = await enforceRole([CompanyRole.MANAGER, CompanyRole.COMPANY_ADMIN]);
  const companyId = context.company!.id;

  const raw = {
    meetingId: formData.get("meetingId"),
    meetingNotes: formData.get("meetingNotes") || "",
    actionItems: formData.get("actionItems") || "",
  };

  const parsed = updateMeetingNotesSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const { meetingId, meetingNotes, actionItems } = parsed.data;

  // Parse action items
  let parsedActionItems: Array<{ item: string; completed: boolean }> = [];
  if (actionItems) {
    parsedActionItems = actionItems
      .split("\n")
      .map((i) => i.trim())
      .filter(Boolean)
      .map((item) => ({ item, completed: false }));
  }

  try {
    await db.meeting.update({
      where: { id: meetingId },
      data: {
        meetingNotes: meetingNotes || null,
        actionItems: parsedActionItems.length > 0 ? (parsedActionItems as any) : undefined,
      },
    });

    // Check attendance checkboxes in formData
    const attendanceEntries = formData.getAll("attendance_attended") as string[];
    if (attendanceEntries.length > 0) {
      await db.meetingParticipant.updateMany({
        where: { meetingId, membershipId: { in: attendanceEntries } },
        data: { attendanceStatus: AttendanceStatus.ATTENDED },
      });
    }

    await logAuditEvent({
      action: "MEETING_NOTES_UPDATED",
      entityType: "Meeting",
      entityId: meetingId,
      companyId,
      actorId: context.dbUser.id,
    });
  } catch (err: any) {
    return { error: err.message || "Failed to save meeting notes." };
  }

  revalidatePath("/dashboard/schedule");
  return { success: true };
}

/**
 * Submits an employee question / doubt.
 */
export async function submitEmployeeDoubtAction(formData: FormData) {
  const context = await requireActiveCompanyContext();
  const callerMembershipId = context.membership!.id;
  const companyId = context.company!.id;

  const raw = {
    topic: formData.get("topic"),
    question: formData.get("question"),
  };

  const parsed = submitDoubtSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const { topic, question } = parsed.data;

  try {
    const doubt = await db.employeeDoubt.create({
      data: {
        companyId,
        studentMembershipId: callerMembershipId,
        topic,
        question,
        status: DoubtStatus.OPEN,
      },
    });

    await logAuditEvent({
      action: "EMPLOYEE_DOUBT_SUBMITTED",
      entityType: "EmployeeDoubt",
      entityId: doubt.id,
      companyId,
      actorId: context.dbUser.id,
      metadata: { topic },
    });
  } catch (err: any) {
    return { error: err.message || "Failed to submit question." };
  }

  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard/employee/tasks");
  return { success: true };
}
