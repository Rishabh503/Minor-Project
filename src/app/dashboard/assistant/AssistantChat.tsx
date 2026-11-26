"use client";

import { FormEvent, useState } from "react";
import { askOnboardingAssistantAction } from "../company/knowledge/actions";
import { Button } from "@/components/ui/Button";

export function AssistantChat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setAnswer(""); setSources([]);
    const result = await askOnboardingAssistantAction(question);
    setLoading(false);
    if ("error" in result) setError(result.error || "Could not get an answer.");
    else { setAnswer(result.answer); setSources(result.sources); }
  }

  return <div className="max-w-3xl space-y-5">
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-surface-border bg-surface p-5">
      <label htmlFor="assistant-question" className="block text-sm font-semibold text-editorial-900">What do you need help with?</label>
      <textarea id="assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} required minLength={3} maxLength={1000} rows={4} placeholder="Ask about your company’s onboarding policies or training materials…" className="w-full rounded-md border border-surface-border bg-canvas px-3 py-2 text-sm" />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Searching company material…" : "Ask assistant"}</Button>
    </form>
    {answer && <section aria-live="polite" className="rounded-xl border border-surface-border bg-surface p-5">
      <h2 className="font-semibold text-editorial-900">Answer</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-editorial-800">{answer}</p>
      {sources.length > 0 && <p className="mt-4 border-t border-surface-border pt-3 text-xs text-brand-muted">Sources: {sources.join(", ")}</p>}
      <p className="mt-2 text-xs text-brand-muted">AI generated. Check the linked source material or ask your manager if something seems incorrect.</p>
    </section>}
  </div>;
}
