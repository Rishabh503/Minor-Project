import { z } from "zod";
import { MeetingType, MeetingStatus, AttendanceStatus } from "@prisma/client";

export const createMeetingSchema = z
  .object({
    title: z
      .string()
      .min(2, "Meeting title must be at least 2 characters")
      .max(120, "Meeting title cannot exceed 120 characters")
      .trim(),
    description: z.string().max(1000).optional().or(z.literal("")),
    agenda: z.string().max(3000).optional().or(z.literal("")),
    type: z.nativeEnum(MeetingType, {
      errorMap: () => ({ message: "Please select a valid meeting type" }),
    }),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    meetingUrl: z
      .string()
      .max(500)
      .optional()
      .or(z.literal("")),
    location: z.string().max(100).optional().or(z.literal("")),
    participantIds: z
      .array(z.string())
      .min(1, "Please select at least one participant"),
    sourceDoubtId: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end.getTime() > start.getTime();
    },
    {
      message: "End time must be after the start time",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      return durationMinutes >= 10 && durationMinutes <= 480;
    },
    {
      message: "Meeting duration must be between 10 minutes and 8 hours",
      path: ["endTime"],
    }
  );

export const rescheduleMeetingSchema = z
  .object({
    meetingId: z.string().min(1, "Meeting ID is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    rescheduleReason: z.string().max(500).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end.getTime() > start.getTime();
    },
    {
      message: "End time must be after the start time",
      path: ["endTime"],
    }
  );

export const cancelMeetingSchema = z.object({
  meetingId: z.string().min(1, "Meeting ID is required"),
  cancellationReason: z.string().max(500).optional().or(z.literal("")),
});

export const updateMeetingNotesSchema = z.object({
  meetingId: z.string().min(1, "Meeting ID is required"),
  meetingNotes: z.string().max(5000).optional().or(z.literal("")),
  actionItems: z.string().optional().or(z.literal("")),
});

export const submitDoubtSchema = z.object({
  topic: z
    .string()
    .min(2, "Topic must be at least 2 characters")
    .max(100, "Topic cannot exceed 100 characters")
    .trim(),
  question: z
    .string()
    .min(5, "Question must be at least 5 characters")
    .max(2000, "Question cannot exceed 2000 characters")
    .trim(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type RescheduleMeetingInput = z.infer<typeof rescheduleMeetingSchema>;
export type CancelMeetingInput = z.infer<typeof cancelMeetingSchema>;
export type UpdateMeetingNotesInput = z.infer<typeof updateMeetingNotesSchema>;
export type SubmitDoubtInput = z.infer<typeof submitDoubtSchema>;
