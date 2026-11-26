import { enforceRole } from "@/lib/auth";
import { CompanyRole } from "@prisma/client";
import { db } from "@/lib/db";
import { KnowledgeManager } from "./KnowledgeManager";

export default async function CompanyKnowledgePage() {
  const context = await enforceRole([CompanyRole.COMPANY_ADMIN, CompanyRole.MANAGER]);
  const rows = await db.companyKnowledgeDocument.findMany({
    where: { companyId: context.company!.id },
    select: { title: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const documents = Array.from(new Map(rows.map((row) => [row.title, row])).values()).map((row) => ({
    ...row,
    chunks: rows.filter((item) => item.title === row.title).length,
  }));

  return <div className="mx-auto max-w-4xl space-y-6">
    <header><h1 className="font-heading text-2xl font-bold text-editorial-900">Company Knowledge Base</h1><p className="mt-1 text-sm text-brand-muted">Manage source material used by the onboarding assistant for {context.company!.name}.</p></header>
    <KnowledgeManager documents={documents} />
  </div>;
}
