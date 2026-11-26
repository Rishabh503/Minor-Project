import "dotenv/config";
import { CompanyRole } from "@prisma/client";
import { db } from "../src/lib/db";
import { embedText, splitIntoChunks } from "../src/lib/ai/gemini";

const demoDocuments = [
  {
    title: "New Hire First Week Guide",
    content: `Ascent Demo Workspace | New Hire First Week Guide

On your first day, sign in to your company account, complete your employee profile, and enroll your laptop and phone in multi-factor authentication (MFA). Complete the account setup checklist before 12:00 noon local time. If you cannot sign in, contact the IT team in #help-it and tell your manager.

Your manager will assign the required security and product orientation modules by the end of your second working day. Finish both modules by the end of your fifth working day. Your onboarding buddy is Morgan Lee. Morgan can help you find team documents and understand the normal work routines, but your manager remains responsible for approvals and priorities.

Meet your manager for a short check-in each Friday during your first month. Bring questions about your role, tools, and goals. Keep onboarding questions in the company workspace so the team can follow up.`,
  },
  {
    title: "Information Security and Device Rules",
    content: `Ascent Demo Workspace | Information Security and Device Rules

Use the company password manager for work credentials. Never share a password, recovery code, or MFA approval with another person, including someone claiming to be a company administrator. MFA is required for company services. Set your screen to lock automatically after five minutes of inactivity.

Report suspected phishing, lost devices, unexpected MFA prompts, or accidental disclosure of company information to security@ascent.test within 15 minutes of noticing the issue. Do not reply to a suspicious message or forward it to coworkers. Preserve the message and include when you noticed it and which account or device may be affected.

Store work files only in company-approved storage. Do not copy confidential files to personal email, personal cloud storage, or removable media. Keep your operating system and browser updated, and contact #help-it if an update or security control prevents you from working.`,
  },
  {
    title: "IT Support, Remote Work, and Time Off FAQ",
    content: `Ascent Demo Workspace | IT Support, Remote Work, and Time Off FAQ

For a normal software, access, or equipment request, post in #help-it. Include the device type, the application affected, what you were trying to do, and the exact error message. Do not include passwords or recovery codes. The IT team aims to respond to normal requests within one business day. A suspected account compromise or lost company device is urgent: report it to security@ascent.test within 15 minutes and notify your manager.

For a planned day off, tell your manager and enter the request in PeopleDesk at least three calendar days before the first day away. For unexpected illness, notify your manager as soon as practical and enter the PeopleDesk request when you are able. Your manager confirms coverage and approval in PeopleDesk.

When working remotely, use your company-managed device and MFA. Connect through the approved company VPN when accessing internal tools from an untrusted network. Avoid discussing confidential work where others can overhear, and lock your screen whenever you step away.`,
  },
];

async function main() {
  const company = await db.company.findUnique({
    where: { slug: "ascent-demo-workspace" },
    select: { id: true, name: true },
  });
  if (!company) throw new Error("Ascent Demo Workspace is not in the database. Run the project seed first.");

  const adminMembership = await db.companyMembership.findFirst({
    where: {
      companyId: company.id,
      role: CompanyRole.COMPANY_ADMIN,
      user: { email: "demo.admin@ascent.test" },
    },
    select: { id: true },
  });
  if (!adminMembership) throw new Error("The demo company admin is missing. Run the project seed first.");

  const indexed = await Promise.all(demoDocuments.flatMap((document) =>
    splitIntoChunks(document.content).map(async (content) => ({
      title: document.title,
      content,
      embedding: await embedText(`${document.title}\n${content}`),
    })),
  ));

  await db.$transaction(async (transaction) => {
    await transaction.companyKnowledgeDocument.deleteMany({
      where: { companyId: company.id, title: { in: demoDocuments.map(({ title }) => title) } },
    });
    await transaction.companyKnowledgeDocument.createMany({
      data: indexed.map((document) => ({
        companyId: company.id,
        creatorMembershipId: adminMembership.id,
        title: document.title,
        content: document.content,
        embedding: document.embedding,
      })),
    });
  });

  console.log(`Indexed ${indexed.length} searchable chunks from ${demoDocuments.length} documents for ${company.name}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
