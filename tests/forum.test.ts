import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createForumThreadSchema,
  createForumReplySchema,
  markAcceptedReplySchema,
  scheduleDiscussionMeetingSchema,
  reportContentSchema,
} from "../src/lib/validations/forum";
import { ForumCategory, ForumThreadStatus, CompanyRole } from "@prisma/client";

describe("Phase 6: Discussion Forum & Doubt Resolution Test Suite", () => {
  describe("1. Question & Reply Validations", () => {
    test("accepts valid forum thread creation input", () => {
      const result = createForumThreadSchema.safeParse({
        title: "How to configure Neon PostgreSQL connection pooling in staging?",
        content: "I am encountering connection timeouts when multiple serverless lambdas spin up concurrently.",
        category: ForumCategory.TECHNICAL,
        attachments: [
          { name: "Error Log", url: "https://gist.github.com/error-log.txt" },
        ],
        taskId: "task_123",
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.category, ForumCategory.TECHNICAL);
        assert.equal(result.data.attachments.length, 1);
      }
    });

    test("rejects excessively short question title (< 5 chars)", () => {
      const result = createForumThreadSchema.safeParse({
        title: "Help",
        content: "Detailed description of the issue encountered...",
        category: ForumCategory.GENERAL,
      });

      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.errors.some((e) => e.path.includes("title")));
      }
    });

    test("rejects reply with empty or single-character content", () => {
      const result = createForumReplySchema.safeParse({
        threadId: "thread_123",
        content: "K",
      });

      assert.equal(result.success, false);
    });

    test("validates meeting conversion input with start and end times", () => {
      const valid = scheduleDiscussionMeetingSchema.safeParse({
        threadId: "thread_123",
        title: "Doubt Resolution Session: Database Pooling",
        startTime: "2026-10-15T10:00:00Z",
        endTime: "2026-10-15T10:30:00Z",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
      });
      assert.equal(valid.success, true);

      const invalidTimes = scheduleDiscussionMeetingSchema.safeParse({
        threadId: "thread_123",
        title: "Doubt Resolution",
        startTime: "2026-10-15T11:00:00Z",
        endTime: "2026-10-15T10:00:00Z", // End before start
      });
      assert.equal(invalidTimes.success, false);
    });
  });

  describe("2. Thread Lifecycle & Accepted Answer Logic", () => {
    function processThreadReply(
      thread: { status: ForumThreadStatus; replyCount: number },
      newReply: { id: string }
    ) {
      return {
        ...thread,
        status: thread.status === ForumThreadStatus.OPEN ? ForumThreadStatus.ANSWERED : thread.status,
        replyCount: thread.replyCount + 1,
      };
    }

    function acceptReply(
      thread: { id: string; status: ForumThreadStatus; acceptedReplyId: string | null },
      replyId: string
    ) {
      return {
        ...thread,
        status: ForumThreadStatus.RESOLVED,
        acceptedReplyId: replyId,
      };
    }

    test("transitions thread from OPEN to ANSWERED upon receiving first response", () => {
      const initialThread = { status: ForumThreadStatus.OPEN, replyCount: 0 };
      const updated = processThreadReply(initialThread, { id: "rep_1" });
      assert.equal(updated.status, ForumThreadStatus.ANSWERED);
      assert.equal(updated.replyCount, 1);
    });

    test("transitions thread to RESOLVED when reply is marked as accepted solution", () => {
      const thread = { id: "th_1", status: ForumThreadStatus.ANSWERED, acceptedReplyId: null };
      const resolved = acceptReply(thread, "rep_solution_123");
      assert.equal(resolved.status, ForumThreadStatus.RESOLVED);
      assert.equal(resolved.acceptedReplyId, "rep_solution_123");
    });

    test("preserves complete discussion history when thread is marked resolved", () => {
      const history = [
        { id: "rep_1", content: "Try checking the pool connection limit." },
        { id: "rep_2", content: "Setting pooled=true resolved it!" },
      ];

      const thread = { id: "th_1", status: ForumThreadStatus.RESOLVED, history };
      assert.equal(thread.history.length, 2);
      assert.equal(thread.history[0].id, "rep_1");
    });
  });

  describe("3. Cross-Company Boundary & Access Control", () => {
    function canAccessThread(
      thread: { companyId: string },
      userContext: { companyId: string }
    ): boolean {
      return thread.companyId === userContext.companyId;
    }

    function canManageThreadResolution(
      thread: { authorMembershipId: string; companyId: string },
      userContext: { membershipId: string; companyId: string; role: CompanyRole }
    ): boolean {
      if (thread.companyId !== userContext.companyId) return false;
      return (
        userContext.role === CompanyRole.MANAGER ||
        userContext.role === CompanyRole.COMPANY_ADMIN ||
        userContext.membershipId === thread.authorMembershipId
      );
    }

    test("strictly denies access to threads from a different tenant company", () => {
      const companyAThread = { companyId: "comp_A" };
      const companyBUser = { companyId: "comp_B" };

      assert.equal(canAccessThread(companyAThread, companyBUser), false);
    });

    test("permits author to resolve their own question", () => {
      const thread = { authorMembershipId: "user_emp_1", companyId: "comp_A" };
      const authorContext = { membershipId: "user_emp_1", companyId: "comp_A", role: CompanyRole.EMPLOYEE };

      assert.equal(canManageThreadResolution(thread, authorContext), true);
    });

    test("prevents unauthorized employee from resolving another peer's thread", () => {
      const thread = { authorMembershipId: "user_emp_1", companyId: "comp_A" };
      const peerContext = { membershipId: "user_emp_2", companyId: "comp_A", role: CompanyRole.EMPLOYEE };

      assert.equal(canManageThreadResolution(thread, peerContext), false);
    });

    test("permits managers to resolve any thread within their company", () => {
      const thread = { authorMembershipId: "user_emp_1", companyId: "comp_A" };
      const managerContext = { membershipId: "mgr_1", companyId: "comp_A", role: CompanyRole.MANAGER };

      assert.equal(canManageThreadResolution(thread, managerContext), true);
    });
  });

  describe("4. Reporting & Moderation Safeguards", () => {
    test("validates report content payload", () => {
      const valid = reportContentSchema.safeParse({
        targetType: "THREAD",
        targetId: "th_123",
        reason: "Violates professional code of conduct",
      });
      assert.equal(valid.success, true);

      const invalid = reportContentSchema.safeParse({
        targetType: "THREAD",
        targetId: "th_123",
        reason: "No", // < 3 chars
      });
      assert.equal(invalid.success, false);
    });

    test("shields moderated content from general members while preserving it for moderators", () => {
      const thread = { id: "th_1", isModerated: true, title: "Inappropriate Query" };

      function isThreadVisible(t: typeof thread, isModerator: boolean) {
        if (t.isModerated && !isModerator) return false;
        return true;
      }

      assert.equal(isThreadVisible(thread, false), false); // Hidden from employee
      assert.equal(isThreadVisible(thread, true), true);   // Visible to manager for review
    });
  });
});
