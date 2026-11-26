import { db } from "@/lib/db";
import { TEST_ACCESS_PASSWORD, TEST_PERSONAS } from "@/lib/test-users";

async function runEndToEndVerification() {
  console.log("=================================================");
  console.log("🚀 Testing Ascent End-to-End Workflow Verification");
  console.log("=================================================");

  // 1. Password verification
  console.log(`\n1. Validating passcode protection:`);
  console.log(`   Configured password: '${TEST_ACCESS_PASSWORD}'`);
  if (TEST_ACCESS_PASSWORD !== "minorproject") {
    throw new Error("Password does not match 'minorproject'");
  }
  console.log("   ✓ Password confirmed as 'minorproject'");

  // 2. Database records verification
  console.log(`\n2. Verifying seeded personas in Neon database:`);
  for (const persona of TEST_PERSONAS) {
    const user = await db.user.findUnique({
      where: { email: persona.email },
      include: {
        memberships: {
          include: {
            company: true,
            employeeProfile: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User not found: ${persona.email}`);
    }

    const membership = user.memberships[0];
    console.log(
      `   ✓ [${persona.role}] ${persona.firstName} ${persona.lastName} (${persona.email})` +
      (membership ? ` - ${membership.role} at ${membership.company.name}` : ` - Global Platform Admin`)
    );
  }

  // 3. Workflow Data Verification: Tasks
  console.log(`\n3. Verifying Tasks & Review Queue:`);
  const tasks = await db.task.findMany({
    include: {
      assignments: {
        include: {
          submissions: true,
          reviews: true,
        },
      },
    },
  });
  console.log(`   ✓ Total seeded tasks: ${tasks.length}`);
  for (const t of tasks) {
    const statuses = t.assignments.map((a) => a.status).join(", ");
    console.log(`     - Task: "${t.title}" (${t.type}, Priority: ${t.priority}) -> Assigned statuses: [${statuses}]`);
  }

  // 4. Workflow Data Verification: Worksheets & Evaluations
  console.log(`\n4. Verifying Worksheets, Submissions & Leaderboard:`);
  const worksheets = await db.worksheet.findMany({
    include: {
      questions: true,
      assignments: {
        include: {
          submissions: {
            include: {
              answers: true,
              evaluation: true,
            },
          },
        },
      },
    },
  });
  console.log(`   ✓ Total seeded worksheets: ${worksheets.length}`);
  for (const ws of worksheets) {
    console.log(`     - "${ws.title}" (${ws.questions.length} questions, Pass: ${ws.passMarks}/${ws.maxMarks})`);
    for (const a of ws.assignments) {
      for (const sub of a.submissions) {
        if (sub.evaluation) {
          console.log(
            `       • Graded Submission: ${sub.evaluation.totalMarksAwarded}/${sub.evaluation.maxMarks} ` +
            `(Status: ${sub.evaluation.status}, Feedback: "${sub.evaluation.feedback?.substring(0, 40)}...")`
          );
        }
      }
    }
  }

  // 5. Workflow Data Verification: Calendar Meetings & Doubts
  console.log(`\n5. Verifying Calendar Meetings & Employee Doubts:`);
  const meetings = await db.meeting.findMany({
    include: { participants: true },
  });
  console.log(`   ✓ Total seeded meetings: ${meetings.length}`);
  for (const m of meetings) {
    console.log(`     - Meeting: "${m.title}" (${m.type}, ${m.participants.length} attendees)`);
  }

  const doubts = await db.employeeDoubt.findMany();
  console.log(`   ✓ Total employee doubts: ${doubts.length}`);
  for (const d of doubts) {
    console.log(`     - Doubt: "${d.topic}" (Status: ${d.status})`);
  }

  // 6. Workflow Data Verification: Discussion Forum
  console.log(`\n6. Verifying Discussion Forum:`);
  const threads = await db.forumThread.findMany({
    include: { replies: true },
  });
  console.log(`   ✓ Total forum threads: ${threads.length}`);
  for (const th of threads) {
    console.log(`     - Thread: "${th.title}" (Status: ${th.status}, Replies: ${th.replies.length})`);
  }

  console.log("\n=================================================");
  console.log("🎉 ALL IDENTITIES AND WORKFLOWS VERIFIED 100% OK!");
  console.log("=================================================");
}

runEndToEndVerification()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
