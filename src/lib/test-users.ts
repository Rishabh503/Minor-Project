export interface TestPersona {
  idKey: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "PLATFORM_ADMIN" | "COMPANY_ADMIN" | "MANAGER" | "EMPLOYEE";
  globalRole: "PLATFORM_ADMIN" | "USER";
  title: string;
  department: string;
  companyName: string;
  onboardingStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  badgeVariant: "editorial" | "coral" | "warning" | "neutral" | "success";
  avatarInitials: string;
  description: string;
  highlightWorkflows: string[];
}

export const TEST_ACCESS_PASSWORD = process.env.TEST_ACCESS_PASSWORD || "minorproject";

export const TEST_PERSONAS: TestPersona[] = [
  {
    idKey: "platform_admin",
    email: "admin@ascent-platform.internal",
    firstName: "Platform",
    lastName: "SuperAdmin",
    role: "PLATFORM_ADMIN",
    globalRole: "PLATFORM_ADMIN",
    title: "Global Systems Director",
    department: "Platform Infrastructure",
    companyName: "Ascent Platform (Cross-Tenant)",
    badgeVariant: "warning",
    avatarInitials: "SA",
    description: "Full platform super-admin access. Inspect tenant organizations, platform metrics, and system-wide audit trails.",
    highlightWorkflows: [
      "Multi-tenant organization monitor",
      "Global platform metrics",
      "System audit log inspector",
    ],
  },
  {
    idKey: "company_admin",
    email: "sarah.admin@acme.tech",
    firstName: "Sarah",
    lastName: "Connor",
    role: "COMPANY_ADMIN",
    globalRole: "USER",
    title: "VP of People & Culture",
    department: "People Operations & HR",
    companyName: "Acme Technologies",
    onboardingStatus: "COMPLETED",
    badgeVariant: "editorial",
    avatarInitials: "SC",
    description: "Company executive & HR Administrator. Oversees departments, sends employee invitations, configures training tracks, and monitors company analytics.",
    highlightWorkflows: [
      "Department and track configuration",
      "Employee roster & member invitation flow",
      "Company-wide leaderboard & audit trail",
    ],
  },
  {
    idKey: "engineering_manager",
    email: "alex.manager@acme.tech",
    firstName: "Alex",
    lastName: "Rivera",
    role: "MANAGER",
    globalRole: "USER",
    title: "Engineering Lead",
    department: "Engineering & Architecture",
    companyName: "Acme Technologies",
    onboardingStatus: "COMPLETED",
    badgeVariant: "coral",
    avatarInitials: "AR",
    description: "Engineering team leader & reviewer. Assigns tasks, reviews submissions with feedback, builds worksheets, evaluates assessments, and schedules training sessions.",
    highlightWorkflows: [
      "Task assignment & review queue (Approve / Request changes)",
      "Worksheet assessment creator & rubrics grading",
      "Calendar meeting scheduler & doubt-to-meeting conversion",
      "Discussion forum accepted-solution solver",
    ],
  },
  {
    idKey: "product_manager",
    email: "maya.manager@acme.tech",
    firstName: "Maya",
    lastName: "Lin",
    role: "MANAGER",
    globalRole: "USER",
    title: "Product Operations Lead",
    department: "People Operations & HR",
    companyName: "Acme Technologies",
    onboardingStatus: "COMPLETED",
    badgeVariant: "coral",
    avatarInitials: "ML",
    description: "Product & Operations manager. Manages product onboarding tracks, schedules cross-functional syncs, and guides associate PMs.",
    highlightWorkflows: [
      "Cross-department team management",
      "Product checklist sign-offs",
      "Mentorship 1-on-1 scheduling",
    ],
  },
  {
    idKey: "employee_top_scorer",
    email: "jordan.hire@acme.tech",
    firstName: "Jordan",
    lastName: "Kim",
    role: "EMPLOYEE",
    globalRole: "USER",
    title: "Junior Cloud Architect",
    department: "Engineering & Architecture",
    companyName: "Acme Technologies",
    onboardingStatus: "COMPLETED",
    badgeVariant: "success",
    avatarInitials: "JK",
    description: "Top-performing new engineer (#1 on leaderboard). Completed all tasks on-time with 92% assessment score, released evaluation, and resolved doubts.",
    highlightWorkflows: [
      "View #1 ranked analytics & leaderboard badge",
      "Inspect approved task submissions with manager reviews",
      "Review graded worksheet answers & released feedback",
    ],
  },
  {
    idKey: "employee_active_dev",
    email: "marcus.dev@acme.tech",
    firstName: "Marcus",
    lastName: "Vance",
    role: "EMPLOYEE",
    globalRole: "USER",
    title: "Full Stack Developer",
    department: "Engineering & Architecture",
    companyName: "Acme Technologies",
    onboardingStatus: "IN_PROGRESS",
    badgeVariant: "neutral",
    avatarInitials: "MV",
    description: "Active mid-onboarding developer. Has tasks in-progress, one task with CHANGES_REQUESTED (test the resubmit workflow!), and a scheduled doubt clinic.",
    highlightWorkflows: [
      "Resubmit task with changes requested by manager",
      "Submit pending tasks with GitHub links & notes",
      "View scheduled doubt meeting on calendar",
    ],
  },
  {
    idKey: "employee_new_hire",
    email: "elena.rookie@acme.tech",
    firstName: "Elena",
    lastName: "Rostova",
    role: "EMPLOYEE",
    globalRole: "USER",
    title: "Junior Frontend Developer",
    department: "Engineering & Architecture",
    companyName: "Acme Technologies",
    onboardingStatus: "IN_PROGRESS",
    badgeVariant: "neutral",
    avatarInitials: "ER",
    description: "Fresh new hire. Just started their onboarding journey. Perfect for testing fresh task checklists, pending assessments, and asking forum questions.",
    highlightWorkflows: [
      "Complete Day 1 onboarding checklist",
      "Take pending high-availability worksheet",
      "Post a new question on the discussion forum",
    ],
  },
  {
    idKey: "employee_apm",
    email: "liam.chen@acme.tech",
    firstName: "Liam",
    lastName: "Chen",
    role: "EMPLOYEE",
    globalRole: "USER",
    title: "Associate Product Manager",
    department: "People Operations & HR",
    companyName: "Acme Technologies",
    onboardingStatus: "IN_PROGRESS",
    badgeVariant: "neutral",
    avatarInitials: "LC",
    description: "Associate PM undergoing product track training. Demonstrates multi-department onboarding flows under Maya Lin.",
    highlightWorkflows: [
      "Product track onboarding progress",
      "Review company policy and stipend guidelines",
      "Interactive 1-on-1 calendar RSVPs",
    ],
  },
];
