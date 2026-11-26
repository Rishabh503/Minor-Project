import {
  PrismaClient,
  GlobalRole,
  CompanyRole,
  OnboardingStatus,
  TaskType,
  TaskPriority,
  AssignmentStatus,
  ReviewDecision,
  MeetingType,
  MeetingStatus,
  AttendanceStatus,
  DoubtStatus,
  QuestionType,
  AssessmentStatus,
  AssessmentSubmissionStatus,
  EvaluationStatus,
  ForumCategory,
  ForumThreadStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive Ascent database seed...");

  // ==========================================
  // 1. Platform SuperAdmin
  // ==========================================
  const platformAdmin = await prisma.user.upsert({
    where: { email: "admin@ascent-platform.internal" },
    update: {
      firstName: "Platform",
      lastName: "SuperAdmin",
      globalRole: GlobalRole.PLATFORM_ADMIN,
    },
    create: {
      clerkId: "clerk_platform_admin_001",
      email: "admin@ascent-platform.internal",
      firstName: "Platform",
      lastName: "SuperAdmin",
      globalRole: GlobalRole.PLATFORM_ADMIN,
    },
  });
  console.log("✓ Platform SuperAdmin created:", platformAdmin.email);

  // ==========================================
  // 2. Multi-Tenant Companies
  // ==========================================
  const acmeCompany = await prisma.company.upsert({
    where: { slug: "acme-technologies" },
    update: {
      name: "Acme Technologies",
      domain: "acme.tech",
    },
    create: {
      name: "Acme Technologies",
      slug: "acme-technologies",
      domain: "acme.tech",
    },
  });

  // Secondary tenant to showcase Platform Admin multi-tenancy!
  const nexusCompany = await prisma.company.upsert({
    where: { slug: "nexus-cloud" },
    update: {
      name: "Nexus Cloud Systems",
      domain: "nexuscloud.io",
    },
    create: {
      name: "Nexus Cloud Systems",
      slug: "nexus-cloud",
      domain: "nexuscloud.io",
    },
  });
  console.log("✓ Companies verified: Acme Technologies & Nexus Cloud Systems");

  const simulationCompany = await prisma.company.upsert({
    where: { slug: "ascent-demo-workspace" },
    update: { name: "Ascent Demo Workspace", domain: "ascent.test" },
    create: {
      name: "Ascent Demo Workspace",
      slug: "ascent-demo-workspace",
      domain: "ascent.test",
    },
  });

  // ==========================================
  // 3. Acme Departments
  // ==========================================
  const engDept = await prisma.department.upsert({
    where: {
      companyId_name: {
        companyId: acmeCompany.id,
        name: "Engineering & Architecture",
      },
    },
    update: {
      code: "ENG",
      description: "Cloud infrastructure, application development, and security engineering",
    },
    create: {
      companyId: acmeCompany.id,
      name: "Engineering & Architecture",
      code: "ENG",
      description: "Cloud infrastructure, application development, and security engineering",
    },
  });

  const opsDept = await prisma.department.upsert({
    where: {
      companyId_name: {
        companyId: acmeCompany.id,
        name: "People Operations & HR",
      },
    },
    update: {
      code: "P-OPS",
      description: "Talent acquisition, employee welfare, performance governance, and compliance",
    },
    create: {
      companyId: acmeCompany.id,
      name: "People Operations & HR",
      code: "P-OPS",
      description: "Talent acquisition, employee welfare, performance governance, and compliance",
    },
  });

  const prodDept = await prisma.department.upsert({
    where: {
      companyId_name: {
        companyId: acmeCompany.id,
        name: "Product & Design",
      },
    },
    update: {
      code: "PROD",
      description: "Product strategy, user experience research, design systems, and roadmaps",
    },
    create: {
      companyId: acmeCompany.id,
      name: "Product & Design",
      code: "PROD",
      description: "Product strategy, user experience research, design systems, and roadmaps",
    },
  });

  const simulationDept = await prisma.department.upsert({
    where: {
      companyId_name: {
        companyId: simulationCompany.id,
        name: "Demo Operations",
      },
    },
    update: { code: "DEMO", description: "Department for the isolated single-company test simulation" },
    create: {
      companyId: simulationCompany.id,
      name: "Demo Operations",
      code: "DEMO",
      description: "Department for the isolated single-company test simulation",
    },
  });

  // ==========================================
  // 4. Training Batches
  // ==========================================
  const engBatch = await prisma.trainingBatch.upsert({
    where: {
      companyId_name: {
        companyId: acmeCompany.id,
        name: "Spring 2026 Engineering Cohort",
      },
    },
    update: {
      code: "ENG-2026-Q1",
      description: "Full-stack cloud orientation, PostgreSQL resilience, microservices, and CI/CD pipelines",
    },
    create: {
      companyId: acmeCompany.id,
      name: "Spring 2026 Engineering Cohort",
      code: "ENG-2026-Q1",
      description: "Full-stack cloud orientation, PostgreSQL resilience, microservices, and CI/CD pipelines",
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });

  const gradBatch = await prisma.trainingBatch.upsert({
    where: {
      companyId_name: {
        companyId: acmeCompany.id,
        name: "2026 Graduate Fast-Track",
      },
    },
    update: {
      code: "GRAD-2026",
      description: "Intensive 90-day accelerator program for high-potential college graduates and junior hires",
    },
    create: {
      companyId: acmeCompany.id,
      name: "2026 Graduate Fast-Track",
      code: "GRAD-2026",
      description: "Intensive 90-day accelerator program for high-potential college graduates and junior hires",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // 5. Identities: Company Admin (HR / Executive)
  // ==========================================
  const sarahUser = await prisma.user.upsert({
    where: { email: "sarah.admin@acme.tech" },
    update: { firstName: "Sarah", lastName: "Connor" },
    create: {
      clerkId: "clerk_company_admin_002",
      email: "sarah.admin@acme.tech",
      firstName: "Sarah",
      lastName: "Connor",
      globalRole: GlobalRole.USER,
    },
  });

  const sarahMembership = await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: sarahUser.id,
        companyId: acmeCompany.id,
      },
    },
    update: { role: CompanyRole.COMPANY_ADMIN, status: "ACTIVE" },
    create: {
      userId: sarahUser.id,
      companyId: acmeCompany.id,
      role: CompanyRole.COMPANY_ADMIN,
      status: "ACTIVE",
    },
  });

  await prisma.employeeProfile.upsert({
    where: { membershipId: sarahMembership.id },
    update: {
      departmentId: opsDept.id,
      jobTitle: "VP of People & Culture",
      location: "San Francisco, CA",
      onboardingStatus: OnboardingStatus.COMPLETED,
    },
    create: {
      membershipId: sarahMembership.id,
      departmentId: opsDept.id,
      jobTitle: "VP of People & Culture",
      location: "San Francisco, CA",
      onboardingStatus: OnboardingStatus.COMPLETED,
      onboardingCompletedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // 5a. Isolated one-company simulation identities
  // ==========================================
  const simulationAdminUser = await prisma.user.upsert({
    where: { email: "demo.admin@ascent.test" },
    update: { firstName: "Avery", lastName: "Admin", globalRole: GlobalRole.USER },
    create: {
      clerkId: "clerk_demo_admin_001",
      email: "demo.admin@ascent.test",
      firstName: "Avery",
      lastName: "Admin",
      globalRole: GlobalRole.USER,
    },
  });
  const simulationAdminMembership = await prisma.companyMembership.upsert({
    where: { userId_companyId: { userId: simulationAdminUser.id, companyId: simulationCompany.id } },
    update: { role: CompanyRole.COMPANY_ADMIN, status: "ACTIVE" },
    create: {
      userId: simulationAdminUser.id,
      companyId: simulationCompany.id,
      role: CompanyRole.COMPANY_ADMIN,
      status: "ACTIVE",
    },
  });
  await prisma.employeeProfile.upsert({
    where: { membershipId: simulationAdminMembership.id },
    update: {
      departmentId: simulationDept.id,
      jobTitle: "Demo Company Administrator",
      onboardingStatus: OnboardingStatus.COMPLETED,
    },
    create: {
      membershipId: simulationAdminMembership.id,
      departmentId: simulationDept.id,
      jobTitle: "Demo Company Administrator",
      onboardingStatus: OnboardingStatus.COMPLETED,
      onboardingCompletedAt: new Date(),
    },
  });

  const simulationEmployeeUser = await prisma.user.upsert({
    where: { email: "demo.user@ascent.test" },
    update: { firstName: "Taylor", lastName: "Trainee", globalRole: GlobalRole.USER },
    create: {
      clerkId: "clerk_demo_user_001",
      email: "demo.user@ascent.test",
      firstName: "Taylor",
      lastName: "Trainee",
      globalRole: GlobalRole.USER,
    },
  });
  const simulationEmployeeMembership = await prisma.companyMembership.upsert({
    where: { userId_companyId: { userId: simulationEmployeeUser.id, companyId: simulationCompany.id } },
    update: { role: CompanyRole.EMPLOYEE, status: "ACTIVE" },
    create: {
      userId: simulationEmployeeUser.id,
      companyId: simulationCompany.id,
      role: CompanyRole.EMPLOYEE,
      status: "ACTIVE",
    },
  });
  await prisma.employeeProfile.upsert({
    where: { membershipId: simulationEmployeeMembership.id },
    update: {
      departmentId: simulationDept.id,
      jobTitle: "Demo New Hire",
      onboardingStatus: OnboardingStatus.IN_PROGRESS,
    },
    create: {
      membershipId: simulationEmployeeMembership.id,
      departmentId: simulationDept.id,
      jobTitle: "Demo New Hire",
      onboardingStatus: OnboardingStatus.IN_PROGRESS,
    },
  });

  // ==========================================
  // 6. Identities: Engineering Lead (Manager)
  // ==========================================
  const alexUser = await prisma.user.upsert({
    where: { email: "alex.manager@acme.tech" },
    update: { firstName: "Alex", lastName: "Rivera" },
    create: {
      clerkId: "clerk_manager_003",
      email: "alex.manager@acme.tech",
      firstName: "Alex",
      lastName: "Rivera",
      globalRole: GlobalRole.USER,
    },
  });

  const alexMembership = await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: alexUser.id,
        companyId: acmeCompany.id,
      },
    },
    update: { role: CompanyRole.MANAGER, status: "ACTIVE" },
    create: {
      userId: alexUser.id,
      companyId: acmeCompany.id,
      role: CompanyRole.MANAGER,
      status: "ACTIVE",
    },
  });

  await prisma.employeeProfile.upsert({
    where: { membershipId: alexMembership.id },
    update: {
      departmentId: engDept.id,
      jobTitle: "Engineering Lead",
      location: "Austin, TX (Remote)",
      onboardingStatus: OnboardingStatus.COMPLETED,
    },
    create: {
      membershipId: alexMembership.id,
      departmentId: engDept.id,
      jobTitle: "Engineering Lead",
      location: "Austin, TX (Remote)",
      onboardingStatus: OnboardingStatus.COMPLETED,
      onboardingCompletedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // 7. Identities: Product Manager (Manager)
  // ==========================================
  const mayaUser = await prisma.user.upsert({
    where: { email: "maya.manager@acme.tech" },
    update: { firstName: "Maya", lastName: "Lin" },
    create: {
      clerkId: "clerk_manager_005",
      email: "maya.manager@acme.tech",
      firstName: "Maya",
      lastName: "Lin",
      globalRole: GlobalRole.USER,
    },
  });

  const mayaMembership = await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: mayaUser.id,
        companyId: acmeCompany.id,
      },
    },
    update: { role: CompanyRole.MANAGER, status: "ACTIVE" },
    create: {
      userId: mayaUser.id,
      companyId: acmeCompany.id,
      role: CompanyRole.MANAGER,
      status: "ACTIVE",
    },
  });

  await prisma.employeeProfile.upsert({
    where: { membershipId: mayaMembership.id },
    update: {
      departmentId: prodDept.id,
      jobTitle: "Product Operations Lead",
      location: "New York, NY",
      onboardingStatus: OnboardingStatus.COMPLETED,
    },
    create: {
      membershipId: mayaMembership.id,
      departmentId: prodDept.id,
      jobTitle: "Product Operations Lead",
      location: "New York, NY",
      onboardingStatus: OnboardingStatus.COMPLETED,
      onboardingCompletedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // 8. Identities: Employee 1 - Jordan Kim (Star Performer, Top Ranked)
  // ==========================================
  const jordanUser = await prisma.user.upsert({
    where: { email: "jordan.hire@acme.tech" },
    update: { firstName: "Jordan", lastName: "Kim" },
    create: {
      clerkId: "clerk_employee_004",
      email: "jordan.hire@acme.tech",
      firstName: "Jordan",
      lastName: "Kim",
      globalRole: GlobalRole.USER,
    },
  });

  const jordanMembership = await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: jordanUser.id,
        companyId: acmeCompany.id,
      },
    },
    update: { role: CompanyRole.EMPLOYEE, status: "ACTIVE" },
    create: {
      userId: jordanUser.id,
      companyId: acmeCompany.id,
      role: CompanyRole.EMPLOYEE,
      status: "ACTIVE",
    },
  });

  await prisma.employeeProfile.upsert({
    where: { membershipId: jordanMembership.id },
    update: {
      departmentId: engDept.id,
      batchId: engBatch.id,
      managerMembershipId: alexMembership.id,
      jobTitle: "Junior Cloud Architect",
      location: "Seattle, WA",
      onboardingStatus: OnboardingStatus.COMPLETED,
      onboardingCompletedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    create: {
      membershipId: jordanMembership.id,
      departmentId: engDept.id,
      batchId: engBatch.id,
      managerMembershipId: alexMembership.id,
      jobTitle: "Junior Cloud Architect",
      location: "Seattle, WA",
      onboardingStatus: OnboardingStatus.COMPLETED,
      onboardingCompletedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // 9. Identities: Employee 2 - Marcus Vance (Mid-Onboarding Developer)
  // ==========================================
  const marcusUser = await prisma.user.upsert({
    where: { email: "marcus.dev@acme.tech" },
    update: { firstName: "Marcus", lastName: "Vance" },
    create: {
      clerkId: "clerk_employee_006",
      email: "marcus.dev@acme.tech",
      firstName: "Marcus",
      lastName: "Vance",
      globalRole: GlobalRole.USER,
    },
  });

  const marcusMembership = await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: marcusUser.id,
        companyId: acmeCompany.id,
      },
    },
    update: { role: CompanyRole.EMPLOYEE, status: "ACTIVE" },
    create: {
      userId: marcusUser.id,
      companyId: acmeCompany.id,
      role: CompanyRole.EMPLOYEE,
      status: "ACTIVE",
    },
  });

  await prisma.employeeProfile.upsert({
    where: { membershipId: marcusMembership.id },
    update: {
      departmentId: engDept.id,
      batchId: engBatch.id,
      managerMembershipId: alexMembership.id,
      jobTitle: "Full Stack Developer",
      location: "Denver, CO",
      onboardingStatus: OnboardingStatus.IN_PROGRESS,
    },
    create: {
      membershipId: marcusMembership.id,
      departmentId: engDept.id,
      batchId: engBatch.id,
      managerMembershipId: alexMembership.id,
      jobTitle: "Full Stack Developer",
      location: "Denver, CO",
      onboardingStatus: OnboardingStatus.IN_PROGRESS,
    },
  });

  // ==========================================
  // 10. Identities: Employee 3 - Elena Rostova (Fresh New Hire)
  // ==========================================
  const elenaUser = await prisma.user.upsert({
    where: { email: "elena.rookie@acme.tech" },
    update: { firstName: "Elena", lastName: "Rostova" },
    create: {
      clerkId: "clerk_employee_007",
      email: "elena.rookie@acme.tech",
      firstName: "Elena",
      lastName: "Rostova",
      globalRole: GlobalRole.USER,
    },
  });

  const elenaMembership = await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: elenaUser.id,
        companyId: acmeCompany.id,
      },
    },
    update: { role: CompanyRole.EMPLOYEE, status: "ACTIVE" },
    create: {
      userId: elenaUser.id,
      companyId: acmeCompany.id,
      role: CompanyRole.EMPLOYEE,
      status: "ACTIVE",
    },
  });

  await prisma.employeeProfile.upsert({
    where: { membershipId: elenaMembership.id },
    update: {
      departmentId: engDept.id,
      batchId: gradBatch.id,
      managerMembershipId: alexMembership.id,
      jobTitle: "Junior Frontend Developer",
      location: "Boston, MA",
      onboardingStatus: OnboardingStatus.IN_PROGRESS,
    },
    create: {
      membershipId: elenaMembership.id,
      departmentId: engDept.id,
      batchId: gradBatch.id,
      managerMembershipId: alexMembership.id,
      jobTitle: "Junior Frontend Developer",
      location: "Boston, MA",
      onboardingStatus: OnboardingStatus.IN_PROGRESS,
    },
  });

  // ==========================================
  // 11. Identities: Employee 4 - Liam Chen (Associate PM)
  // ==========================================
  const liamUser = await prisma.user.upsert({
    where: { email: "liam.chen@acme.tech" },
    update: { firstName: "Liam", lastName: "Chen" },
    create: {
      clerkId: "clerk_employee_008",
      email: "liam.chen@acme.tech",
      firstName: "Liam",
      lastName: "Chen",
      globalRole: GlobalRole.USER,
    },
  });

  const liamMembership = await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: liamUser.id,
        companyId: acmeCompany.id,
      },
    },
    update: { role: CompanyRole.EMPLOYEE, status: "ACTIVE" },
    create: {
      userId: liamUser.id,
      companyId: acmeCompany.id,
      role: CompanyRole.EMPLOYEE,
      status: "ACTIVE",
    },
  });

  await prisma.employeeProfile.upsert({
    where: { membershipId: liamMembership.id },
    update: {
      departmentId: prodDept.id,
      batchId: gradBatch.id,
      managerMembershipId: mayaMembership.id,
      jobTitle: "Associate Product Manager",
      location: "Chicago, IL",
      onboardingStatus: OnboardingStatus.IN_PROGRESS,
    },
    create: {
      membershipId: liamMembership.id,
      departmentId: prodDept.id,
      batchId: gradBatch.id,
      managerMembershipId: mayaMembership.id,
      jobTitle: "Associate Product Manager",
      location: "Chicago, IL",
      onboardingStatus: OnboardingStatus.IN_PROGRESS,
    },
  });

  console.log("✓ All custom users and profiles seeded successfully.");

  // ==========================================
  // 12. Realistic Workflow: Tasks
  // ==========================================
  const securityTask = await prisma.task.upsert({
    where: { id: "seed_task_security_001" },
    update: {},
    create: {
      id: "seed_task_security_001",
      companyId: acmeCompany.id,
      creatorMembershipId: alexMembership.id,
      title: "Workplace Security & IT Hygiene Sign-off",
      description: "Review enterprise zero-trust protocols, enroll in hardware 2FA, and configure password vault.",
      instructions: "1. Read IT Security Manual.\n2. Configure 1Password vault.\n3. Enable 2FA on laptop & corporate mobile.",
      type: TaskType.DAILY_TASK,
      priority: TaskPriority.HIGH,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  const cloudTask = await prisma.task.upsert({
    where: { id: "seed_task_cloud_002" },
    update: {},
    create: {
      id: "seed_task_cloud_002",
      companyId: acmeCompany.id,
      creatorMembershipId: alexMembership.id,
      title: "Cloud Infrastructure Architecture Orientation",
      description: "Hands-on walkthrough of company PostgreSQL Neon clusters, API gateways, and deployment pipelines.",
      instructions: "Clone repository, run migrations locally, and verify connection to dev database.",
      type: TaskType.TRAINING_ACTIVITY,
      priority: TaskPriority.URGENT,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  const apiTask = await prisma.task.upsert({
    where: { id: "seed_task_api_004" },
    update: {},
    create: {
      id: "seed_task_api_004",
      companyId: acmeCompany.id,
      creatorMembershipId: alexMembership.id,
      title: "Production Microservices & API Gateway Setup",
      description: "Configure local docker-compose microservices with rate limiting, logging, and health probe endpoints.",
      instructions: "1. Pull backend container registry.\n2. Ensure docker-compose exposes port 4000.\n3. Submit test health ping log.",
      type: TaskType.TRAINING_ACTIVITY,
      priority: TaskPriority.HIGH,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
  });

  const secretsTask = await prisma.task.upsert({
    where: { id: "seed_task_secrets_005" },
    update: {},
    create: {
      id: "seed_task_secrets_005",
      companyId: acmeCompany.id,
      creatorMembershipId: alexMembership.id,
      title: "Enterprise Zero-Trust & Secrets Management",
      description: "Learn how to fetch staging secrets via Doppler / Infisical without hardcoding tokens in repositories.",
      instructions: "Run CLI secrets audit and link your developer machine machine ID.",
      type: TaskType.DAILY_TASK,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
  });

  const historicalTask = await prisma.task.upsert({
    where: { id: "seed_task_historical_003" },
    update: {},
    create: {
      id: "seed_task_historical_003",
      companyId: acmeCompany.id,
      creatorMembershipId: alexMembership.id,
      title: "Foundational Engineering Certification 2025",
      description: "Legacy training track imported for historical verification.",
      type: TaskType.HISTORICAL_RECORD,
      isHistorical: true,
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  const productTask = await prisma.task.upsert({
    where: { id: "seed_task_product_006" },
    update: {},
    create: {
      id: "seed_task_product_006",
      companyId: acmeCompany.id,
      creatorMembershipId: mayaMembership.id,
      title: "Product Requirements & Sprint Backlog Orientation",
      description: "Learn PRD template structure, Linear project tracking conventions, and user story acceptance criteria.",
      instructions: "Draft sample feature spec in Notion and submit link.",
      type: TaskType.TRAINING_ACTIVITY,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  // ----------------------------------------------------
  // Jordan Kim Task Assignments (COMPLETED / APPROVED)
  // ----------------------------------------------------
  const jordanSecAssign = await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: securityTask.id,
        employeeMembershipId: jordanMembership.id,
      },
    },
    update: { status: AssignmentStatus.COMPLETED, completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    create: {
      taskId: securityTask.id,
      employeeMembershipId: jordanMembership.id,
      assignedByMembershipId: alexMembership.id,
      status: AssignmentStatus.COMPLETED,
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  const jordanSecSub = await prisma.taskSubmission.upsert({
    where: { id: "sub_jordan_sec_001" },
    update: {},
    create: {
      id: "sub_jordan_sec_001",
      assignmentId: jordanSecAssign.id,
      submissionNumber: 1,
      submissionText: "All 2FA credentials configured on laptop and mobile devices. Security policies acknowledged.",
      links: [{ title: "IT Checklist Confirmation", url: "https://docs.acme.tech/it-signoff" }],
      submittedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.taskReview.upsert({
    where: { id: "rev_jordan_sec_001" },
    update: {},
    create: {
      id: "rev_jordan_sec_001",
      assignmentId: jordanSecAssign.id,
      submissionId: jordanSecSub.id,
      reviewerMembershipId: alexMembership.id,
      decision: ReviewDecision.APPROVED,
      feedback: "Great job completing the security setup ahead of deadline! Zero-trust verification verified in IdP.",
      reviewedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  const jordanCloudAssign = await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: cloudTask.id,
        employeeMembershipId: jordanMembership.id,
      },
    },
    update: { status: AssignmentStatus.COMPLETED, completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    create: {
      taskId: cloudTask.id,
      employeeMembershipId: jordanMembership.id,
      assignedByMembershipId: alexMembership.id,
      status: AssignmentStatus.COMPLETED,
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  const jordanCloudSub = await prisma.taskSubmission.upsert({
    where: { id: "sub_jordan_cloud_001" },
    update: {},
    create: {
      id: "sub_jordan_cloud_001",
      assignmentId: jordanCloudAssign.id,
      submissionNumber: 1,
      submissionText: "Local Prisma migrations tested with Neon dev instance. PgBouncer pool connection verified.",
      links: [{ title: "Local Dev Setup Verified", url: "https://github.com/acme/dev-logs" }],
      submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.taskReview.upsert({
    where: { id: "rev_jordan_cloud_001" },
    update: {},
    create: {
      id: "rev_jordan_cloud_001",
      assignmentId: jordanCloudAssign.id,
      submissionId: jordanCloudSub.id,
      reviewerMembershipId: alexMembership.id,
      decision: ReviewDecision.APPROVED,
      feedback: "Excellent understanding of serverless pooling and Prisma directUrl semantics.",
      reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: historicalTask.id,
        employeeMembershipId: jordanMembership.id,
      },
    },
    update: {},
    create: {
      taskId: historicalTask.id,
      employeeMembershipId: jordanMembership.id,
      assignedByMembershipId: alexMembership.id,
      status: AssignmentStatus.COMPLETED,
      completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  // ----------------------------------------------------
  // Marcus Vance Task Assignments (IN_PROGRESS & CHANGES_REQUESTED for workflow testing!)
  // ----------------------------------------------------
  const marcusSecAssign = await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: securityTask.id,
        employeeMembershipId: marcusMembership.id,
      },
    },
    update: { status: AssignmentStatus.SUBMITTED },
    create: {
      taskId: securityTask.id,
      employeeMembershipId: marcusMembership.id,
      assignedByMembershipId: alexMembership.id,
      status: AssignmentStatus.SUBMITTED,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.taskSubmission.upsert({
    where: { id: "sub_marcus_sec_001" },
    update: {},
    create: {
      id: "sub_marcus_sec_001",
      assignmentId: marcusSecAssign.id,
      submissionNumber: 1,
      submissionText: "Enrolled in YubiKey 2FA and imported company passwords to vault. Awaiting manager approval.",
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Task with CHANGES_REQUESTED -> enables testing the manager feedback and employee resubmission loop!
  const marcusApiAssign = await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: apiTask.id,
        employeeMembershipId: marcusMembership.id,
      },
    },
    update: { status: AssignmentStatus.CHANGES_REQUESTED },
    create: {
      taskId: apiTask.id,
      employeeMembershipId: marcusMembership.id,
      assignedByMembershipId: alexMembership.id,
      status: AssignmentStatus.CHANGES_REQUESTED,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
  });

  const marcusApiSub = await prisma.taskSubmission.upsert({
    where: { id: "sub_marcus_api_001" },
    update: {},
    create: {
      id: "sub_marcus_api_001",
      assignmentId: marcusApiAssign.id,
      submissionNumber: 1,
      submissionText: "Spun up local containers, but the rate limiter proxy logs warning on port 4000.",
      links: [{ title: "Local Gist", url: "https://gist.github.com/marcus/docker-compose" }],
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.taskReview.upsert({
    where: { id: "rev_marcus_api_001" },
    update: {},
    create: {
      id: "rev_marcus_api_001",
      assignmentId: marcusApiAssign.id,
      submissionId: marcusApiSub.id,
      reviewerMembershipId: alexMembership.id,
      decision: ReviewDecision.CHANGES_REQUESTED,
      feedback: "Please update your docker-compose.yml to use the shared redis network bridge (redis:6379), then test health ping again and resubmit.",
      reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: secretsTask.id,
        employeeMembershipId: marcusMembership.id,
      },
    },
    update: {},
    create: {
      taskId: secretsTask.id,
      employeeMembershipId: marcusMembership.id,
      assignedByMembershipId: alexMembership.id,
      status: AssignmentStatus.IN_PROGRESS,
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
  });

  // ----------------------------------------------------
  // Elena Rostova Task Assignments (FRESH NEW HIRE)
  // ----------------------------------------------------
  await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: securityTask.id,
        employeeMembershipId: elenaMembership.id,
      },
    },
    update: {},
    create: {
      taskId: securityTask.id,
      employeeMembershipId: elenaMembership.id,
      assignedByMembershipId: alexMembership.id,
      status: AssignmentStatus.IN_PROGRESS,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: secretsTask.id,
        employeeMembershipId: elenaMembership.id,
      },
    },
    update: {},
    create: {
      taskId: secretsTask.id,
      employeeMembershipId: elenaMembership.id,
      assignedByMembershipId: alexMembership.id,
      status: AssignmentStatus.NOT_STARTED,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  // ----------------------------------------------------
  // Liam Chen Task Assignment (PRODUCT TRACK)
  // ----------------------------------------------------
  const liamAssign = await prisma.taskAssignment.upsert({
    where: {
      taskId_employeeMembershipId: {
        taskId: productTask.id,
        employeeMembershipId: liamMembership.id,
      },
    },
    update: { status: AssignmentStatus.COMPLETED, completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    create: {
      taskId: productTask.id,
      employeeMembershipId: liamMembership.id,
      assignedByMembershipId: mayaMembership.id,
      status: AssignmentStatus.COMPLETED,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const liamSub = await prisma.taskSubmission.upsert({
    where: { id: "sub_liam_prod_001" },
    update: {},
    create: {
      id: "sub_liam_prod_001",
      assignmentId: liamAssign.id,
      submissionNumber: 1,
      submissionText: "Completed sample user story backlog and PRD alignment documentation.",
      links: [{ title: "Notion PRD Draft", url: "https://notion.so/acme/sample-prd" }],
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.taskReview.upsert({
    where: { id: "rev_liam_prod_001" },
    update: {},
    create: {
      id: "rev_liam_prod_001",
      assignmentId: liamAssign.id,
      submissionId: liamSub.id,
      reviewerMembershipId: mayaMembership.id,
      decision: ReviewDecision.APPROVED,
      feedback: "Crisp problem statement and thorough acceptance criteria. Well done Liam!",
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✓ Tasks, submissions, and review queue seeded.");

  // ==========================================
  // 13. Realistic Workflow: Worksheets & Evaluations
  // ==========================================
  const archWorksheet = await prisma.worksheet.upsert({
    where: { id: "seed_worksheet_001" },
    update: {},
    create: {
      id: "seed_worksheet_001",
      companyId: acmeCompany.id,
      creatorMembershipId: alexMembership.id,
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

  const questions = await prisma.question.findMany({
    where: { worksheetId: archWorksheet.id },
    orderBy: { order: "asc" },
  });

  // ----------------------------------------------------
  // Jordan Kim: Graded 92/100, RELEASED Evaluation (#1 on Leaderboard!)
  // ----------------------------------------------------
  const jordanAssessAssign = await prisma.assessmentAssignment.upsert({
    where: {
      worksheetId_employeeMembershipId: {
        worksheetId: archWorksheet.id,
        employeeMembershipId: jordanMembership.id,
      },
    },
    update: { status: AssessmentStatus.EVALUATED },
    create: {
      companyId: acmeCompany.id,
      worksheetId: archWorksheet.id,
      employeeMembershipId: jordanMembership.id,
      assignedByMembershipId: alexMembership.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: AssessmentStatus.EVALUATED,
      allowResubmission: true,
    },
  });

  const jordanAssessSub = await prisma.assessmentSubmission.upsert({
    where: {
      assignmentId_attemptNumber: {
        assignmentId: jordanAssessAssign.id,
        attemptNumber: 1,
      },
    },
    update: { status: AssessmentSubmissionStatus.SUBMITTED },
    create: {
      assignmentId: jordanAssessAssign.id,
      attemptNumber: 1,
      status: AssessmentSubmissionStatus.SUBMITTED,
      submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      employeeNotes: "Completed assessment reviewing serverless architecture principles.",
    },
  });

  if (questions.length >= 3) {
    await prisma.assessmentAnswer.upsert({
      where: {
        submissionId_questionId: {
          submissionId: jordanAssessSub.id,
          questionId: questions[0].id,
        },
      },
      update: { marksAwarded: 20, autoGraded: true },
      create: {
        submissionId: jordanAssessSub.id,
        questionId: questions[0].id,
        selectedOption: "Probabilistic early expiration",
        marksAwarded: 20,
        autoGraded: true,
        feedback: "Correct! Beta distribution early recomputation avoids cache stampedes.",
      },
    });

    await prisma.assessmentAnswer.upsert({
      where: {
        submissionId_questionId: {
          submissionId: jordanAssessSub.id,
          questionId: questions[1].id,
        },
      },
      update: { marksAwarded: 32 },
      create: {
        submissionId: jordanAssessSub.id,
        questionId: questions[1].id,
        textAnswer: "Serverless functions rapidly scale up concurrent execution environments. Without connection pooling via PgBouncer or Neon compute proxies, database socket exhaustion causes 500 errors.",
        marksAwarded: 32,
        autoGraded: false,
        feedback: "Clear explanation highlighting socket limits and transaction pooler mode.",
      },
    });

    await prisma.assessmentAnswer.upsert({
      where: {
        submissionId_questionId: {
          submissionId: jordanAssessSub.id,
          questionId: questions[2].id,
        },
      },
      update: { marksAwarded: 40 },
      create: {
        submissionId: jordanAssessSub.id,
        questionId: questions[2].id,
        fileUrl: "https://github.com/jordan-kim/ascent-health-probes",
        marksAwarded: 40,
        autoGraded: false,
        feedback: "Solid SIGTERM signal handler implementation closing active clients.",
      },
    });

    await prisma.assessmentEvaluation.upsert({
      where: { submissionId: jordanAssessSub.id },
      update: {
        totalMarksAwarded: 92,
        maxMarks: 100,
        status: EvaluationStatus.RELEASED,
        feedback: "Outstanding work across both theoretical principles and concrete implementation. Passed with distinction!",
      },
      create: {
        submissionId: jordanAssessSub.id,
        evaluatorMembershipId: alexMembership.id,
        totalMarksAwarded: 92,
        maxMarks: 100,
        status: EvaluationStatus.RELEASED,
        feedback: "Outstanding work across both theoretical principles and concrete implementation. Passed with distinction!",
        evaluatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        releasedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ----------------------------------------------------
  // Marcus Vance: Graded 76/100, RELEASED Evaluation (#2 on Leaderboard!)
  // ----------------------------------------------------
  const marcusAssessAssign = await prisma.assessmentAssignment.upsert({
    where: {
      worksheetId_employeeMembershipId: {
        worksheetId: archWorksheet.id,
        employeeMembershipId: marcusMembership.id,
      },
    },
    update: { status: AssessmentStatus.EVALUATED },
    create: {
      companyId: acmeCompany.id,
      worksheetId: archWorksheet.id,
      employeeMembershipId: marcusMembership.id,
      assignedByMembershipId: alexMembership.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: AssessmentStatus.EVALUATED,
      allowResubmission: true,
    },
  });

  const marcusAssessSub = await prisma.assessmentSubmission.upsert({
    where: {
      assignmentId_attemptNumber: {
        assignmentId: marcusAssessAssign.id,
        attemptNumber: 1,
      },
    },
    update: { status: AssessmentSubmissionStatus.SUBMITTED },
    create: {
      assignmentId: marcusAssessAssign.id,
      attemptNumber: 1,
      status: AssessmentSubmissionStatus.SUBMITTED,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      employeeNotes: "Completed assessment, verified answers against architecture guide.",
    },
  });

  if (questions.length >= 3) {
    await prisma.assessmentAnswer.upsert({
      where: {
        submissionId_questionId: {
          submissionId: marcusAssessSub.id,
          questionId: questions[0].id,
        },
      },
      update: { marksAwarded: 20, autoGraded: true },
      create: {
        submissionId: marcusAssessSub.id,
        questionId: questions[0].id,
        selectedOption: "Probabilistic early expiration",
        marksAwarded: 20,
        autoGraded: true,
        feedback: "Correct option selected.",
      },
    });

    await prisma.assessmentAnswer.upsert({
      where: {
        submissionId_questionId: {
          submissionId: marcusAssessSub.id,
          questionId: questions[1].id,
        },
      },
      update: { marksAwarded: 26 },
      create: {
        submissionId: marcusAssessSub.id,
        questionId: questions[1].id,
        textAnswer: "PgBouncer reuses open Postgres connections so thousands of serverless workers do not overwhelm the main database node with TCP handshakes.",
        marksAwarded: 26,
        autoGraded: false,
        feedback: "Accurate point on TCP handshake overhead. Remember to mention memory footprint.",
      },
    });

    await prisma.assessmentAnswer.upsert({
      where: {
        submissionId_questionId: {
          submissionId: marcusAssessSub.id,
          questionId: questions[2].id,
        },
      },
      update: { marksAwarded: 30 },
      create: {
        submissionId: marcusAssessSub.id,
        questionId: questions[2].id,
        fileUrl: "https://github.com/marcus-vance/dev-health-check",
        marksAwarded: 30,
        autoGraded: false,
        feedback: "Functioning health check. Add timeout thresholds for degraded state checks.",
      },
    });

    await prisma.assessmentEvaluation.upsert({
      where: { submissionId: marcusAssessSub.id },
      update: {
        totalMarksAwarded: 76,
        maxMarks: 100,
        status: EvaluationStatus.RELEASED,
        feedback: "Good work Marcus! Solid fundamentals demonstrated across the board.",
      },
      create: {
        submissionId: marcusAssessSub.id,
        evaluatorMembershipId: alexMembership.id,
        totalMarksAwarded: 76,
        maxMarks: 100,
        status: EvaluationStatus.RELEASED,
        feedback: "Good work Marcus! Solid fundamentals demonstrated across the board.",
        evaluatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        releasedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ----------------------------------------------------
  // Elena Rostova: Assigned PENDING (ready to take test!)
  // ----------------------------------------------------
  await prisma.assessmentAssignment.upsert({
    where: {
      worksheetId_employeeMembershipId: {
        worksheetId: archWorksheet.id,
        employeeMembershipId: elenaMembership.id,
      },
    },
    update: { status: AssessmentStatus.PENDING },
    create: {
      companyId: acmeCompany.id,
      worksheetId: archWorksheet.id,
      employeeMembershipId: elenaMembership.id,
      assignedByMembershipId: alexMembership.id,
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      status: AssessmentStatus.PENDING,
      allowResubmission: true,
    },
  });

  console.log("✓ Worksheets, questions, submissions, and evaluations seeded.");

  // ==========================================
  // 14. Realistic Workflow: Calendar Meetings & Doubts
  // ==========================================
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(14, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000);

  const trainingSession = await prisma.meeting.upsert({
    where: { id: "seed_meeting_training_001" },
    update: {},
    create: {
      id: "seed_meeting_training_001",
      companyId: acmeCompany.id,
      organizerMembershipId: alexMembership.id,
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

  // Add attendees
  for (const m of [jordanMembership, marcusMembership, elenaMembership]) {
    await prisma.meetingParticipant.upsert({
      where: {
        meetingId_membershipId: {
          meetingId: trainingSession.id,
          membershipId: m.id,
        },
      },
      update: {},
      create: {
        meetingId: trainingSession.id,
        membershipId: m.id,
        attendanceStatus: AttendanceStatus.ACCEPTED,
      },
    });
  }

  const nextWeek = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  nextWeek.setHours(11, 0, 0, 0);
  const nextWeekEnd = new Date(nextWeek.getTime() + 45 * 60 * 1000);

  const oneOnOne = await prisma.meeting.upsert({
    where: { id: "seed_meeting_oneonone_002" },
    update: {},
    create: {
      id: "seed_meeting_oneonone_002",
      companyId: acmeCompany.id,
      organizerMembershipId: alexMembership.id,
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
        membershipId: jordanMembership.id,
      },
    },
    update: {},
    create: {
      meetingId: oneOnOne.id,
      membershipId: jordanMembership.id,
      attendanceStatus: AttendanceStatus.ACCEPTED,
    },
  });

  // Seed sample employee doubts (OPEN, SCHEDULED, RESOLVED)
  await prisma.employeeDoubt.upsert({
    where: { id: "seed_doubt_001" },
    update: { status: DoubtStatus.RESOLVED },
    create: {
      id: "seed_doubt_001",
      companyId: acmeCompany.id,
      studentMembershipId: jordanMembership.id,
      topic: "PostgreSQL Migration & SSL Modes",
      question: "Could we clarify the recommended SSL mode when connecting Prisma to the staging Neon database?",
      status: DoubtStatus.RESOLVED,
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Marcus Vance doubt scheduled into meeting
  const marcusDoubt = await prisma.employeeDoubt.upsert({
    where: { id: "seed_doubt_002" },
    update: { status: DoubtStatus.SCHEDULED },
    create: {
      id: "seed_doubt_002",
      companyId: acmeCompany.id,
      studentMembershipId: marcusMembership.id,
      topic: "Docker Compose Port Conflict with Staging Proxy",
      question: "Getting bind errors on port 4000 when starting local backend container. Is there a reserve range for macOS?",
      status: DoubtStatus.SCHEDULED,
    },
  });

  const clinicTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  clinicTime.setHours(16, 0, 0, 0);
  const clinicTimeEnd = new Date(clinicTime.getTime() + 30 * 60 * 1000);

  const doubtMeeting = await prisma.meeting.upsert({
    where: { id: "seed_meeting_doubt_clinic_003" },
    update: {},
    create: {
      id: "seed_meeting_doubt_clinic_003",
      companyId: acmeCompany.id,
      organizerMembershipId: alexMembership.id,
      title: "Docker & Local Dev Environment Q&A Clinic",
      description: "Dedicated assistance addressing port collisions and proxy bridging.",
      type: MeetingType.HELP_SESSION,
      status: MeetingStatus.SCHEDULED,
      startTime: clinicTime,
      endTime: clinicTimeEnd,
      meetingUrl: "https://meet.google.com/dev-clinic-help",
      sourceDoubtId: marcusDoubt.id,
    },
  });

  await prisma.meetingParticipant.upsert({
    where: {
      meetingId_membershipId: {
        meetingId: doubtMeeting.id,
        membershipId: marcusMembership.id,
      },
    },
    update: {},
    create: {
      meetingId: doubtMeeting.id,
      membershipId: marcusMembership.id,
      attendanceStatus: AttendanceStatus.ACCEPTED,
    },
  });

  // Elena doubt OPEN
  await prisma.employeeDoubt.upsert({
    where: { id: "seed_doubt_003" },
    update: { status: DoubtStatus.OPEN },
    create: {
      id: "seed_doubt_003",
      companyId: acmeCompany.id,
      studentMembershipId: elenaMembership.id,
      topic: "CI/CD Pipeline Build Secrets Access",
      question: "Which permission group grants GitHub Actions runner tokens to push frontend preview branches?",
      status: DoubtStatus.OPEN,
    },
  });

  console.log("✓ Meetings and employee doubts seeded.");

  // ==========================================
  // 15. Realistic Workflow: Discussion Forum & Doubts
  // ==========================================
  const technicalThread = await prisma.forumThread.upsert({
    where: { id: "seed_thread_001" },
    update: {},
    create: {
      id: "seed_thread_001",
      companyId: acmeCompany.id,
      authorMembershipId: jordanMembership.id,
      title: "Best practices for Prisma connection pool tuning on serverless Neon",
      content: "When deploying our Next.js App Router API routes to Vercel/serverless instances, what is the recommended pool connection limit to prevent exhausting database sockets?",
      category: ForumCategory.TECHNICAL,
      status: ForumThreadStatus.RESOLVED,
      worksheetId: archWorksheet.id,
      attachments: [
        { name: "Neon Pooling Docs", url: "https://neon.com/docs/guides/connection-pooling" },
      ],
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      resolvedByMembershipId: alexMembership.id,
    },
  });

  const reply1 = await prisma.forumReply.upsert({
    where: { id: "seed_reply_001" },
    update: { isAcceptedAnswer: true },
    create: {
      id: "seed_reply_001",
      threadId: technicalThread.id,
      authorMembershipId: alexMembership.id,
      content: "Make sure you use the pooled connection string ending in `-pooler` with `?sslmode=require&pgbouncer=true`. In Prisma schema, configure `directUrl` for migrations and `url` for pooled runtime traffic. Setting `connection_limit=10` per serverless container keeps resource usage completely predictable.",
      isAcceptedAnswer: true,
    },
  });

  // Link accepted reply to thread
  await prisma.forumThread.update({
    where: { id: technicalThread.id },
    data: { acceptedReplyId: reply1.id },
  });

  // Onboarding Thread
  const onboardingThread = await prisma.forumThread.upsert({
    where: { id: "seed_thread_002" },
    update: {},
    create: {
      id: "seed_thread_002",
      companyId: acmeCompany.id,
      authorMembershipId: marcusMembership.id,
      title: "How to set up staging environment variables with .env.local?",
      content: "Does our team have a central repository or vault script to populate developer environment variables for the test suite?",
      category: ForumCategory.ONBOARDING,
      status: ForumThreadStatus.ANSWERED,
    },
  });

  await prisma.forumReply.upsert({
    where: { id: "seed_reply_002" },
    update: {},
    create: {
      id: "seed_reply_002",
      threadId: onboardingThread.id,
      authorMembershipId: jordanMembership.id,
      content: "You can copy `.env.example` to `.env.local` or ask Sarah on People Ops for the 1Password shared team vault where keys are kept updated.",
      isAcceptedAnswer: false,
    },
  });

  // Policy Thread
  const policyThread = await prisma.forumThread.upsert({
    where: { id: "seed_thread_003" },
    update: {},
    create: {
      id: "seed_thread_003",
      companyId: acmeCompany.id,
      authorMembershipId: liamMembership.id,
      title: "Remote Work Equipment Reimbursement & Learning Stipend Guidelines",
      content: "Where do we submit invoices for home office ergonomics and technical certification courses?",
      category: ForumCategory.POLICY,
      status: ForumThreadStatus.RESOLVED,
      resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      resolvedByMembershipId: sarahMembership.id,
    },
  });

  const reply3 = await prisma.forumReply.upsert({
    where: { id: "seed_reply_003" },
    update: { isAcceptedAnswer: true },
    create: {
      id: "seed_reply_003",
      threadId: policyThread.id,
      authorMembershipId: sarahMembership.id,
      content: "You can submit receipts directly in the Brex / Rippling portal under 'Employee Learning & Wellness'. Every full-time hire receives $1,200 annual learning credit starting Day 1!",
      isAcceptedAnswer: true,
    },
  });

  await prisma.forumThread.update({
    where: { id: policyThread.id },
    data: { acceptedReplyId: reply3.id },
  });

  console.log("✓ Discussion forum threads and replies seeded.");

  // ==========================================
  // 16. Comprehensive Audit Logs
  // ==========================================
  await prisma.auditLog.deleteMany({
    where: { companyId: acmeCompany.id },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        companyId: acmeCompany.id,
        actorId: platformAdmin.id,
        action: "COMPANY_INITIALIZED",
        entityType: "Company",
        entityId: acmeCompany.id,
        metadata: { seed: true, slug: acmeCompany.slug },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        companyId: acmeCompany.id,
        actorId: sarahUser.id,
        action: "DEPARTMENTS_CONFIGURED",
        entityType: "Department",
        entityId: engDept.id,
        metadata: { departments: ["ENG", "P-OPS", "PROD"] },
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        companyId: acmeCompany.id,
        actorId: sarahUser.id,
        action: "MEMBERS_INVITED",
        entityType: "CompanyMembership",
        entityId: alexMembership.id,
        metadata: { role: CompanyRole.MANAGER, count: 2 },
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        companyId: acmeCompany.id,
        actorId: alexUser.id,
        action: "BATCH_INITIALIZED",
        entityType: "TrainingBatch",
        entityId: engBatch.id,
        metadata: { name: engBatch.name },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        companyId: acmeCompany.id,
        actorId: alexUser.id,
        action: "TASK_ASSIGNED",
        entityType: "Task",
        entityId: securityTask.id,
        metadata: { title: securityTask.title, recipients: 3 },
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      },
      {
        companyId: acmeCompany.id,
        actorId: alexUser.id,
        action: "TASK_REVIEWED_APPROVED",
        entityType: "TaskAssignment",
        entityId: jordanSecAssign.id,
        metadata: { employee: jordanUser.email, decision: "APPROVED" },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        companyId: acmeCompany.id,
        actorId: alexUser.id,
        action: "TASK_CHANGES_REQUESTED",
        entityType: "TaskAssignment",
        entityId: marcusApiAssign.id,
        metadata: { employee: marcusUser.email, decision: "CHANGES_REQUESTED" },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        companyId: acmeCompany.id,
        actorId: alexUser.id,
        action: "ASSESSMENT_EVALUATION_RELEASED",
        entityType: "AssessmentEvaluation",
        entityId: jordanAssessSub.id,
        metadata: { employee: jordanUser.email, score: 92, max: 100 },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✓ Audit trail populated.");
  console.log("🎉 Seed finished successfully! All identities and workflows are primed for demo testing.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
