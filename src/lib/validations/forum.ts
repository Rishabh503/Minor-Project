import { z } from "zod";
import { ForumCategory, ForumThreadStatus } from "@prisma/client";

export const attachmentItemSchema = z.object({
  name: z.string().min(1, "Attachment name is required").max(100),
  url: z.string().url("Attachment must be a valid URL"),
});

export const createForumThreadSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title cannot exceed 150 characters")
    .trim(),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(5000, "Content cannot exceed 5000 characters")
    .trim(),
  category: z.nativeEnum(ForumCategory, {
    errorMap: () => ({ message: "Please select a valid forum category" }),
  }),
  attachments: z.array(attachmentItemSchema).optional().default([]),
  taskId: z.string().optional().or(z.literal("")),
  worksheetId: z.string().optional().or(z.literal("")),
});

export const createForumReplySchema = z.object({
  threadId: z.string().min(1, "Thread ID is required"),
  content: z
    .string()
    .min(2, "Reply must be at least 2 characters")
    .max(5000, "Reply cannot exceed 5000 characters")
    .trim(),
  attachments: z.array(attachmentItemSchema).optional().default([]),
});

export const markAcceptedReplySchema = z.object({
  threadId: z.string().min(1, "Thread ID is required"),
  replyId: z.string().min(1, "Reply ID is required"),
});

export const resolveThreadSchema = z.object({
  threadId: z.string().min(1, "Thread ID is required"),
});

export const reopenThreadSchema = z.object({
  threadId: z.string().min(1, "Thread ID is required"),
});

export const reportContentSchema = z.object({
  targetType: z.enum(["THREAD", "REPLY"]),
  targetId: z.string().min(1, "Target ID is required"),
  reason: z
    .string()
    .min(3, "Report reason must be at least 3 characters")
    .max(500, "Report reason cannot exceed 500 characters")
    .trim(),
});

export const moderateContentSchema = z.object({
  targetType: z.enum(["THREAD", "REPLY"]),
  targetId: z.string().min(1, "Target ID is required"),
  isModerated: z.boolean(),
});

export const scheduleDiscussionMeetingSchema = z
  .object({
    threadId: z.string().min(1, "Thread ID is required"),
    title: z.string().min(3, "Meeting title must be at least 3 characters").max(120),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    meetingUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    location: z.string().max(100).optional().or(z.literal("")),
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

export type CreateForumThreadInput = z.infer<typeof createForumThreadSchema>;
export type CreateForumReplyInput = z.infer<typeof createForumReplySchema>;
export type MarkAcceptedReplyInput = z.infer<typeof markAcceptedReplySchema>;
export type ResolveThreadInput = z.infer<typeof resolveThreadSchema>;
export type ReportContentInput = z.infer<typeof reportContentSchema>;
export type ModerateContentInput = z.infer<typeof moderateContentSchema>;
export type ScheduleDiscussionMeetingInput = z.infer<typeof scheduleDiscussionMeetingSchema>;
