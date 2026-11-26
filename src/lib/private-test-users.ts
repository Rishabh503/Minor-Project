import type { TestPersona } from "./test-users";

// Kept separate from the public persona list and only sent to the test-login UI
// after the private simulation passphrase has been accepted.
export const PRIVATE_SIMULATION_PERSONAS: TestPersona[] = [
  {
    idKey: "simulation_admin",
    email: "demo.admin@ascent.test",
    firstName: "Avery",
    lastName: "Admin",
    role: "COMPANY_ADMIN",
    globalRole: "USER",
    title: "Demo Company Administrator",
    department: "Demo Operations",
    companyName: "Ascent Demo Workspace",
    onboardingStatus: "COMPLETED",
    badgeVariant: "editorial",
    avatarInitials: "AA",
    description: "Admin for an isolated one-company simulation. Add onboarding knowledge and inspect the company dashboard.",
    highlightWorkflows: [
      "Add company policy and FAQ text to the knowledge base",
      "Review the company dashboard and analytics",
      "Switch to the demo employee to test grounded assistant answers",
    ],
  },
  {
    idKey: "simulation_employee",
    email: "demo.user@ascent.test",
    firstName: "Taylor",
    lastName: "Trainee",
    role: "EMPLOYEE",
    globalRole: "USER",
    title: "Demo New Hire",
    department: "Demo Operations",
    companyName: "Ascent Demo Workspace",
    onboardingStatus: "IN_PROGRESS",
    badgeVariant: "neutral",
    avatarInitials: "TT",
    description: "Employee in the same isolated demo company. Ask questions about material added by the demo admin.",
    highlightWorkflows: [
      "Ask the AI onboarding assistant about company material",
      "View the employee dashboard and onboarding status",
    ],
  },
];

export const SIMULATION_TEST_PASSWORD = process.env.SIMULATION_TEST_PASSWORD;
