import { requireActiveCompanyContext } from "@/lib/auth";
import { AssistantChat } from "./AssistantChat";

export default async function OnboardingAssistantPage() {
  const context = await requireActiveCompanyContext();
  return <div className="space-y-6">
    <header><h1 className="font-heading text-2xl font-bold text-editorial-900">Onboarding Assistant</h1><p className="mt-1 text-sm text-brand-muted">Answers are grounded in {context.company!.name}’s indexed onboarding material.</p></header>
    <AssistantChat />
  </div>;
}
