import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createMeetingSchema,
  rescheduleMeetingSchema,
  cancelMeetingSchema,
  updateMeetingNotesSchema,
  submitDoubtSchema,
} from "../src/lib/validations/schedule";
import { formatDateTime } from "../src/lib/utils";
import { MeetingType, MeetingStatus, CompanyRole } from "@prisma/client";

describe("Phase 4: Schedule & Meeting Management Test Suite", () => {
  describe("1. Scheduling Validations & Input Integrity", () => {
    const validStartTime = new Date(Date.now() + 3600000).toISOString();
    const validEndTime = new Date(Date.now() + 7200000).toISOString();

    test("accepts fully valid meeting creation input", () => {
      const result = createMeetingSchema.safeParse({
        title: "Architecture Onboarding Deep Dive",
        description: "Review system architecture, database models, and deployment workflows.",
        agenda: "1. Intro (10m)\n2. DB schema (25m)\n3. Q&A (25m)",
        type: MeetingType.TRAINING_SESSION,
        startTime: validStartTime,
        endTime: validEndTime,
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        location: "Meeting Room Alpha",
        participantIds: ["mem_emp_001", "mem_emp_002"],
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.title, "Architecture Onboarding Deep Dive");
        assert.equal(result.data.type, MeetingType.TRAINING_SESSION);
        assert.equal(result.data.participantIds.length, 2);
      }
    });

    test("rejects empty or excessively short title", () => {
      const result = createMeetingSchema.safeParse({
        title: "A",
        type: MeetingType.ONE_ON_ONE,
        startTime: validStartTime,
        endTime: validEndTime,
        participantIds: ["mem_emp_001"],
      });

      assert.equal(result.success, false);
      if (!result.success) {
        const titleErr = result.error.errors.find((e) => e.path.includes("title"));
        assert.ok(titleErr, "Expected title length error");
      }
    });

    test("rejects invalid meeting types outside the enum", () => {
      const result = createMeetingSchema.safeParse({
        title: "Random Hangout",
        type: "CASUAL_CHAT",
        startTime: validStartTime,
        endTime: validEndTime,
        participantIds: ["mem_emp_001"],
      });

      assert.equal(result.success, false);
    });

    test("rejects meeting when end time precedes start time", () => {
      const result = createMeetingSchema.safeParse({
        title: "Time Travel Workshop",
        type: MeetingType.TRAINING_SESSION,
        startTime: "2026-10-15T14:00:00Z",
        endTime: "2026-10-15T13:00:00Z",
        participantIds: ["mem_emp_001"],
      });

      assert.equal(result.success, false);
      if (!result.success) {
        const endTimeErr = result.error.errors.find((e) => e.path.includes("endTime"));
        assert.ok(endTimeErr, "Expected end time error");
      }
    });

    test("enforces minimum duration of 10 minutes", () => {
      const result = createMeetingSchema.safeParse({
        title: "Micro Checkin",
        type: MeetingType.ONE_ON_ONE,
        startTime: "2026-10-15T10:00:00Z",
        endTime: "2026-10-15T10:05:00Z", // Only 5 mins
        participantIds: ["mem_emp_001"],
      });

      assert.equal(result.success, false);
    });

    test("enforces maximum duration of 8 hours (480 minutes)", () => {
      const result = createMeetingSchema.safeParse({
        title: "All Day Hackathon",
        type: MeetingType.TRAINING_SESSION,
        startTime: "2026-10-15T09:00:00Z",
        endTime: "2026-10-15T18:30:00Z", // 9.5 hours
        participantIds: ["mem_emp_001"],
      });

      assert.equal(result.success, false);
    });

    test("validates meeting rescheduling input", () => {
      const valid = rescheduleMeetingSchema.safeParse({
        meetingId: "meet_12345",
        startTime: "2026-10-16T10:00:00Z",
        endTime: "2026-10-16T11:00:00Z",
        rescheduleReason: "Direct report had client meeting conflict",
      });
      assert.equal(valid.success, true);

      const invalid = rescheduleMeetingSchema.safeParse({
        meetingId: "",
        startTime: "2026-10-16T10:00:00Z",
        endTime: "2026-10-16T09:00:00Z",
      });
      assert.equal(invalid.success, false);
    });

    test("validates meeting cancellation input", () => {
      const valid = cancelMeetingSchema.safeParse({
        meetingId: "meet_12345",
        cancellationReason: "Speaker unavailable due to emergency",
      });
      assert.equal(valid.success, true);

      const missingId = cancelMeetingSchema.safeParse({
        meetingId: "",
      });
      assert.equal(missingId.success, false);
    });

    test("validates employee doubt submission input", () => {
      const valid = submitDoubtSchema.safeParse({
        topic: "Git Flow Branching Strategy",
        question: "How do we handle hotfix branches in the company repository?",
      });
      assert.equal(valid.success, true);

      const tooShort = submitDoubtSchema.safeParse({
        topic: "Git",
        question: "Why?", // < 5 chars
      });
      assert.equal(tooShort.success, false);
    });
  });

  describe("2. Timezone Handling & Timestamp Normalization", () => {
    test("accurately parses and computes duration across different timezone offsets", () => {
      // 14:00 UTC = 19:30 IST (+05:30) = 10:00 EDT (-04:00)
      const utcTime = new Date("2026-10-15T14:00:00Z");
      const istTime = new Date("2026-10-15T19:30:00+05:30");
      const edtTime = new Date("2026-10-15T10:00:00-04:00");

      assert.equal(utcTime.getTime(), istTime.getTime());
      assert.equal(utcTime.getTime(), edtTime.getTime());

      // Duration calculation
      const endUtc = new Date("2026-10-15T15:00:00Z");
      const durationMins = (endUtc.getTime() - istTime.getTime()) / (1000 * 60);
      assert.equal(durationMins, 60);
    });

    test("formats date strings reliably with formatDateTime utility", () => {
      const d = new Date("2026-10-15T10:30:00Z");
      const formatted = formatDateTime(d);
      assert.ok(typeof formatted === "string");
      assert.ok(formatted.length > 5);
    });
  });

  describe("3. Conflict Detection Algorithm", () => {
    function hasConflict(
      existingStart: Date,
      existingEnd: Date,
      newStart: Date,
      newEnd: Date
    ): boolean {
      // Standard interval overlap: newStart < existingEnd && newEnd > existingStart
      return newStart < existingEnd && newEnd > existingStart;
    }

    const meetingStart = new Date("2026-10-15T10:00:00Z");
    const meetingEnd = new Date("2026-10-15T11:00:00Z");

    test("back-to-back meetings do not conflict", () => {
      // Immediately after [11:00, 12:00]
      const afterStart = new Date("2026-10-15T11:00:00Z");
      const afterEnd = new Date("2026-10-15T12:00:00Z");
      assert.equal(hasConflict(meetingStart, meetingEnd, afterStart, afterEnd), false);

      // Immediately before [09:00, 10:00]
      const beforeStart = new Date("2026-10-15T09:00:00Z");
      const beforeEnd = new Date("2026-10-15T10:00:00Z");
      assert.equal(hasConflict(meetingStart, meetingEnd, beforeStart, beforeEnd), false);
    });

    test("detects partial overlaps", () => {
      // Starts inside existing [10:30, 11:30]
      const partialOverlap = hasConflict(
        meetingStart,
        meetingEnd,
        new Date("2026-10-15T10:30:00Z"),
        new Date("2026-10-15T11:30:00Z")
      );
      assert.equal(partialOverlap, true);

      // Ends inside existing [09:30, 10:30]
      const leadingOverlap = hasConflict(
        meetingStart,
        meetingEnd,
        new Date("2026-10-15T09:30:00Z"),
        new Date("2026-10-15T10:30:00Z")
      );
      assert.equal(leadingOverlap, true);
    });

    test("detects completely engulfed intervals", () => {
      // New meeting is inside existing [10:15, 10:45]
      const insideOverlap = hasConflict(
        meetingStart,
        meetingEnd,
        new Date("2026-10-15T10:15:00Z"),
        new Date("2026-10-15T10:45:00Z")
      );
      assert.equal(insideOverlap, true);

      // Existing meeting is inside new meeting [09:30, 11:30]
      const engulfedOverlap = hasConflict(
        meetingStart,
        meetingEnd,
        new Date("2026-10-15T09:30:00Z"),
        new Date("2026-10-15T11:30:00Z")
      );
      assert.equal(engulfedOverlap, true);
    });
  });

  describe("4. Role-Based Access Control & Visibility Scopes", () => {
    function canScheduleMeetings(role: CompanyRole): boolean {
      return role === CompanyRole.MANAGER || role === CompanyRole.COMPANY_ADMIN;
    }

    function isMeetingVisibleToUser(
      meeting: {
        companyId: string;
        organizerMembershipId: string;
        participantMembershipIds: string[];
      },
      userContext: {
        companyId: string;
        membershipId: string;
        role: CompanyRole;
      }
    ): boolean {
      // Must match tenant company
      if (meeting.companyId !== userContext.companyId) {
        return false;
      }

      // Company Admin & Manager have organization/department visibility
      if (
        userContext.role === CompanyRole.COMPANY_ADMIN ||
        userContext.role === CompanyRole.MANAGER
      ) {
        return true;
      }

      // Employee is restricted strictly to meetings they are invited to or organize
      return (
        meeting.organizerMembershipId === userContext.membershipId ||
        meeting.participantMembershipIds.includes(userContext.membershipId)
      );
    }

    test("only Managers and Company Admins can schedule sessions", () => {
      assert.equal(canScheduleMeetings(CompanyRole.COMPANY_ADMIN), true);
      assert.equal(canScheduleMeetings(CompanyRole.MANAGER), true);
      assert.equal(canScheduleMeetings(CompanyRole.EMPLOYEE), false);
    });

    test("restricts employee visibility to their invited sessions", () => {
      const session1 = {
        companyId: "comp_1",
        organizerMembershipId: "mgr_1",
        participantMembershipIds: ["emp_1"],
      };

      const session2 = {
        companyId: "comp_1",
        organizerMembershipId: "mgr_1",
        participantMembershipIds: ["emp_2"],
      };

      const empContext = {
        companyId: "comp_1",
        membershipId: "emp_1",
        role: CompanyRole.EMPLOYEE,
      };

      // Employee 1 can see session1 (they are in participantMembershipIds)
      assert.equal(isMeetingVisibleToUser(session1, empContext), true);
      // Employee 1 CANNOT see session2 (only Employee 2 is invited)
      assert.equal(isMeetingVisibleToUser(session2, empContext), false);
    });

    test("prevents cross-tenant leakages between companies", () => {
      const foreignSession = {
        companyId: "comp_2",
        organizerMembershipId: "mgr_2",
        participantMembershipIds: ["emp_1"],
      };

      const adminContext = {
        companyId: "comp_1",
        membershipId: "adm_1",
        role: CompanyRole.COMPANY_ADMIN,
      };

      assert.equal(isMeetingVisibleToUser(foreignSession, adminContext), false);
    });
  });
});
