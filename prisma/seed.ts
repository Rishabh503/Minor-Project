import { PrismaClient, GlobalRole, CompanyRole, OnboardingStatus, MeetingType, MeetingStatus, AttendanceStatus, DoubtStatus, QuestionType, AssessmentStatus, ForumCategory, ForumThreadStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // 1. Create or ensure Platform Administrator
  const platformAdmin = await prisma.user.upsert({
    where: { email: "admin@ascent-platform.internal" },
    update: {},
    create: {
      clerkId: "clerk_platform_admin_001",
      email: "admin@ascent-platform.internal",
      firstName: "Platform",
      lastName: "SuperAdmin",
      globalRole: GlobalRole.PLATFORM_ADMIN,
    },
  });

  // 2. Create Sample Company
  const company = await prisma.company.upsert({
    where: { slug: "acme-technologies" },
    update: {},
    create: {
      name: "Acme Technologies",
      slug: "acme-technologies",
      domain: "acme.tech",
    },
  });

  // 3. Create Departments
  const engDept = await prisma.department.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: "Engineering & Architecture",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      name: "Engineering & Architecture",
      code: "ENG",
      description: "Cloud infrastructure, application development, and security engineering",
    },
  });

  const opsDept = await prisma.department.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: "People Operations & HR",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      name: "People Operations & HR",
      code: "P-OPS",
      description: "Talent acquisition, employee welfare, and compliance",
    },
  });

  // 4. Create Company Admin user
  const companyAdminUser = await prisma.user.upsert({
    where: { email: "sarah.admin@acme.tech" },
    update: {},
    create: {
      clerkId: "clerk_company_admin_002",
      email: "sarah.admin@acme.tech",
      firstName: "Sarah",
      lastName: "Connor",
      globalRole: GlobalRole.USER,
    },
  });

  const companyAdminMembership = await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: companyAdminUser.id,
        companyId: company.id,
      },
    },
    update: {},
    create: {
      userId: companyAdminUser.id,
      companyId: company.id,
      role: CompanyRole.COMPANY_ADMIN,
      status: "ACTIVE",
    },
  });

  await prisma.employeeProfile.upsert({
    where: { membershipId: companyAdminMembership.id },
    update: {},
    create: {
      membershipId: companyAdminMembership.id,
      departmentId: opsDept.id,
      jobTitle: "VP of People & Culture",
      location: "San Francisco, CA",
      onboardingStatus: OnboardingStatus.COMPLETED,
      onboardingCompletedAt: new Date(),
    },
  });

  // 5. Create Manager user
  const managerUser = await prisma.user.upsert({
    where: { email: "alex.manager@acme.tech" },
    update: {},
    create: {
      clerkId: "clerk_manager_003",
      email: "alex.manager@acme.tech",
      firstName: "Alex",
      lastName: "Rivera",
      globalRole: GlobalRole.USER,
    },
  });

  const managerMembership = await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: managerUser.id,
        companyId: company.id,
      },
    },
    update: {},
    create: {
      userId: managerUser.id,
      companyId: company.id,
      role: CompanyRole.MANAGER,
      status: "ACTIVE",
    },
  });

  await prisma.employeeProfile.upsert({
    where: { membershipId: managerMembership.id },
    update: {},
    create: {
      membershipId: managerMembership.id,
      departmentId: engDept.id,
      jobTitle: "Engineering Lead",
      location: "Austin, TX (Remote)",
      onboardingStatus: OnboardingStatus.COMPLETED,
      onboardingCompletedAt: new Date(),
    },
  });

  // 6. Create Employee user (Direct report)
  const employeeUser = await prisma.user.upsert({
    where: { email: "jordan.hire@acme.tech" },
    update: {},
    create: {
      clerkId: "clerk_employee_004",
      email: "jordan.hire@acme.tech",
      firstName: "Jordan",
      lastName: "Kim",
      globalRole: GlobalRole.USER,
    },
  });

  const employeeMembership = await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: employeeUser.id,
        companyId: company.id,
      },
    },
    update: {},
    create: {
      userId: employeeUser.id,
      companyId: company.id,
      role: CompanyRole.EMPLOYEE,
      status: "ACTIVE",
    },
  });

  await prisma.employeeProfile.upsert({
    where: { membershipId: employeeMembership.id },
    update: {},
    create: {
      membershipId: employeeMembership.id,
      departmentId: engDept.id,
      managerMembershipId: managerMembership.id,
      jobTitle: "Junior Cloud Architect",
      location: "Seattle, WA",
      onboardingStatus: OnboardingStatus.IN_PROGRESS,
    },
  });

  // 7. Create Sample Tasks and Assignments
  const securityTask = await prisma.task.upsert({
    where: { id: "seed_task_security_001" },
    update: {},
    create: {
      id: "seed_task_security_001",
      companyId: company.id,
      creatorMembershipId: managerMembership.id,
      title: "Workplace Security & IT Hygiene Sign-off",
      description: "Review enterprise zero-trust protocols and configure 2FA across corporate devices.",
      instructions: "1. Read IT Security Manual.\n2. Enable hardware or software 2FA.\n3. Submit a confirmation screenshot or note.",
      type: "DAILY_TASK",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  const assignment1 = await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: securityTask.id,
        employeeMembershipId: employeeMembership.id,
      },
    },
    update: {},
    create: {
      taskId: securityTask.id,
      employeeMembershipId: employeeMembership.id,
      assignedByMembershipId: managerMembership.id,
      status: "SUBMITTED",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed sample submission for review queue
  await prisma.taskSubmission.create({
    data: {
      assignmentId: assignment1.id,
      submissionNumber: 1,
      submissionText: "All 2FA credentials configured on laptop and mobile devices. Security policies acknowledged.",
      links: [{ title: "IT Checklist Confirmation", url: "https://docs.acme.tech/it-signoff" }],
    },
  });

  const cloudTask = await prisma.task.upsert({
    where: { id: "seed_task_cloud_002" },
    update: {},
    create: {
      id: "seed_task_cloud_002",
      companyId: company.id,
      creatorMembershipId: managerMembership.id,
      title: "Cloud Infrastructure Architecture Orientation",
      description: "Hands-on walkthrough of company PostgreSQL Neon clusters, API gateways, and deployment pipelines.",
      instructions: "Clone repository, run migrations locally, and verify connection to dev database.",
      type: "TRAINING_ACTIVITY",
      priority: "URGENT",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: cloudTask.id,
        employeeMembershipId: employeeMembership.id,
      },
    },
    update: {},
    create: {
      taskId: cloudTask.id,
      employeeMembershipId: employeeMembership.id,
      assignedByMembershipId: managerMembership.id,
      status: "IN_PROGRESS",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  // 8. Seed Historical Training Activity
  const historicalTask = await prisma.task.upsert({
    where: { id: "seed_task_historical_003" },
    update: {},
    create: {
      id: "seed_task_historical_003",
      companyId: company.id,
      creatorMembershipId: managerMembership.id,
      title: "Foundational Engineering Certification 2025",
      description: "Legacy training track imported for historical verification.",
      type: "HISTORICAL_RECORD",
      isHistorical: true,
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: historicalTask.id,
        employeeMembershipId: employeeMembership.id,
      },
    },
    update: {},
    create: {
      taskId: historicalTask.id,
      employeeMembershipId: employeeMembership.id,
      assignedByMembershipId: managerMembership.id,
      status: "COMPLETED",
      completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 9. Seed Phase 4 Calendar Meetings & Doubts
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(14, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000);

  const trainingSession = await prisma.meeting.upsert({
    where: { id: "seed_meeting_training_001" },
    update: {},
    create: {
      id: "seed_meeting_training_001",
      companyId: company.id,
      organizerMembershipId: managerMembership.id,
      title: "Engineering Onboarding: Architecture & Tooling Workshop",
      description: "Interactive session reviewing repository structures, deployment pipelines, and coding conventions.",
      agenda: "1. Welcome & Intro\n2. Git branch strategy\n3. Dev environment setup\n4. Q&A",
      type: MeetingType.TRAINING_SESSION,
      status: MeetingStatus.SCHEDULED,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      meetingUrl: "https://meet.google.com/ascent-eng-workshop",
      location: "Virtual Room A / Main Hall",
      meetingNotes: "Pre-reading: Review the architecture documentation in /docs.",
      actionItems: [
        { item: "Clone backend repository and test Docker compose", completed: false },
        { item: "Request production read-only credentials", completed: false },
      ],
    },
  });

  await prisma.meetingParticipant.upsert({
    where: {
      meetingId_membershipId: {
        meetingId: trainingSession.id,
        membershipId: employeeMembership.id,
      },
    },
    update: {},
    create: {
      meetingId: trainingSession.id,
      membershipId: employeeMembership.id,
      attendanceStatus: AttendanceStatus.ACCEPTED,
    },
  });

  const nextWeek = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  nextWeek.setHours(11, 0, 0, 0);
  const nextWeekEnd = new Date(nextWeek.getTime() + 45 * 60 * 1000);

  const oneOnOne = await prisma.meeting.upsert({
    where: { id: "seed_meeting_oneonone_002" },
    update: {},
    create: {
      id: "seed_meeting_oneonone_002",
      companyId: company.id,
      organizerMembershipId: managerMembership.id,
      title: "Week 1 Mentorship & Progress Alignment Check-in",
      description: "1-on-1 discussion to address initial blocker questions, milestones, and personal development goals.",
      type: MeetingType.ONE_ON_ONE,
      status: MeetingStatus.SCHEDULED,
      startTime: nextWeek,
      endTime: nextWeekEnd,
      meetingUrl: "https://meet.google.com/ascent-oneonone-checkin",
      location: "Manager Office / Zoom",
    },
  });

  await prisma.meetingParticipant.upsert({
    where: {
      meetingId_membershipId: {
        meetingId: oneOnOne.id,
        membershipId: employeeMembership.id,
      },
    },
    update: {},
    create: {
      meetingId: oneOnOne.id,
      membershipId: employeeMembership.id,
      attendanceStatus: AttendanceStatus.ACCEPTED,
    },
  });

  // Seed sample employee doubt
  await prisma.employeeDoubt.upsert({
    where: { id: "seed_doubt_001" },
    update: {},
    create: {
      id: "seed_doubt_001",
      companyId: company.id,
      studentMembershipId: employeeMembership.id,
      topic: "PostgreSQL Migration & SSL Modes",
      question: "Could we clarify the recommended SSL mode when connecting Prisma to the staging Neon database?",
      status: DoubtStatus.OPEN,
    },
  });

  // 10. Seed Phase 5 Worksheets, Questions & Assessments
  const sampleWorksheet = await prisma.worksheet.upsert({
    where: { id: "seed_worksheet_001" },
    update: {},
    create: {
      id: "seed_worksheet_001",
      companyId: company.id,
      creatorMembershipId: managerMembership.id,
      title: "Production Architecture & High-Availability Assessment",
      description: "Foundational verification of cloud reliability, database connection pooling, and resilient system design.",
      instructions: "Answer all questions. For MCQ, choose the optimal architecture practice. For subjective prompts, provide concise, concrete trade-offs.",
      resources: "https://neon.com/docs/guides/connection-pooling",
      maxMarks: 100,
      passMarks: 60,
      allowResubmission: true,
      version: 1,
      isPublished: true,
      questions: {
        create: [
          {
            type: QuestionType.MCQ,
            questionText: "What caching strategy prevents thundering herd problems during database failovers?",
            options: ["Probabilistic early expiration", "Unbounded in-memory buffering", "Synchronous blocking IO", "Pure random dropping"],
            correctOption: "Probabilistic early expiration",
            maxMarks: 20,
            order: 1,
            rubric: "20 marks for selecting probabilistic early expiration",
          },
          {
            type: QuestionType.SHORT_ANSWER,
            questionText: "Explain the architectural rationale for using PgBouncer or Neon serverless connection poolers in serverless microservices.",
            maxMarks: 35,
            order: 2,
            rubric: "Must discuss concurrent connection exhaustion, thread limits, and ephemeral lambdas",
          },
          {
            type: QuestionType.FILE_UPLOAD,
            questionText: "Provide public repository URL with your implementation of automated health checks and graceful database shutdowns.",
            maxMarks: 45,
            order: 3,
            rubric: "Must demonstrate signal handling (SIGTERM) and cleanly closing pool instances",
          },
        ],
      },
    },
  });

  await prisma.assessmentAssignment.upsert({
    where: {
      worksheetId_employeeMembershipId: {
        worksheetId: sampleWorksheet.id,
        employeeMembershipId: employeeMembership.id,
      },
    },
    update: {},
    create: {
      companyId: company.id,
      worksheetId: sampleWorksheet.id,
      employeeMembershipId: employeeMembership.id,
      assignedByMembershipId: managerMembership.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: AssessmentStatus.PENDING,
      allowResubmission: true,
    },
  });

  // 11. Seed Phase 6 Discussion Forum Threads & Replies
  const sampleThread = await prisma.forumThread.upsert({
    where: { id: "seed_thread_001" },
    update: {},
    create: {
      id: "seed_thread_001",
      companyId: company.id,
      authorMembershipId: employeeMembership.id,
      title: "Best practices for Prisma connection pool tuning on serverless Neon",
      content: "When deploying our Next.js App Router API routes to Vercel/serverless instances, what is the recommended pool connection limit to prevent exhausting database sockets?",
      category: ForumCategory.TECHNICAL,
      status: ForumThreadStatus.ANSWERED,
      worksheetId: sampleWorksheet.id,
      attachments: [
        { name: "Neon Pooling Docs", url: "https://neon.com/docs/guides/connection-pooling" },
      ],
    },
  });

  await prisma.forumReply.upsert({
    where: { id: "seed_reply_001" },
    update: {},
    create: {
      id: "seed_reply_001",
      threadId: sampleThread.id,
      authorMembershipId: managerMembership.id,
      content: "Make sure you use the pooled connection string ending in `-pooler` with `?sslmode=require&pgbouncer=true`. In Prisma schema, configure `directUrl` for migrations and `url` for pooled runtime traffic. Setting `connection_limit=10` per serverless container keeps resource usage completely predictable.",
      isAcceptedAnswer: false,
    },
  });

  // 12. Seed Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        companyId: company.id,
        actorId: platformAdmin.id,
        action: "COMPANY_INITIALIZED",
        entityType: "Company",
        entityId: company.id,
        metadata: { seed: true, slug: company.slug },
      },
      {
        companyId: company.id,
        actorId: companyAdminUser.id,
        action: "DEPARTMENT_CREATED",
        entityType: "Department",
        entityId: engDept.id,
        metadata: { code: engDept.code },
      },
      {
        companyId: company.id,
        actorId: companyAdminUser.id,
        action: "MEMBER_INVITED",
        entityType: "CompanyMembership",
        entityId: employeeMembership.id,
        metadata: { role: CompanyRole.EMPLOYEE, email: employeeUser.email },
      },
      {
        companyId: company.id,
        actorId: managerUser.id,
        action: "TASK_CREATED_AND_ASSIGNED",
        entityType: "Task",
        entityId: securityTask.id,
        metadata: { title: securityTask.title },
      },
    ],
  });

  console.log("Database seeded successfully with demo tenancy and roles.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
