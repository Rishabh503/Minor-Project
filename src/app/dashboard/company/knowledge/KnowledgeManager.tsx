"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { addKnowledgeDocumentAction, deleteKnowledgeDocumentAction } from "./actions";

export function KnowledgeManager({ documents }: { documents: Array<{ title: string; chunks: number; updatedAt: Date }> }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(formData: FormData) {
    setError("");
    setSaving(true);
    const result = await addKnowledgeDocumentAction(formData);
    setSaving(false);
    if (result.error) return setError(result.error);
    (document.querySelector("form") as HTMLFormElement)?.reset();
    router.refresh();
  }

  async function remove(title: string) {
    await deleteKnowledgeDocumentAction(title);
    router.refresh();
  }

  return <div className="space-y-6">
    <form action={submit} className="space-y-3 rounded-xl border border-surface-border bg-surface p-5">
      <h2 className="font-semibold text-editorial-900">Add company onboarding material</h2>
      <p className="text-sm text-brand-muted">Paste policies, FAQs, or training guidance. Material is split into chunks and indexed for company-scoped semantic search.</p>
      <input name="title" required minLength={3} maxLength={160} placeholder="Document title" className="w-full rounded-md border border-surface-border bg-canvas px-3 py-2 text-sm" />
      <textarea name="content" required minLength={30} maxLength={50000} rows={8} placeholder="Paste the source text here..." className="w-full rounded-md border border-surface-border bg-canvas px-3 py-2 text-sm" />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Indexing material…" : "Save and index"}</Button>
    </form>
    <section className="space-y-3">
      <h2 className="font-semibold text-editorial-900">Indexed material ({documents.length})</h2>
      {documents.length === 0 ? <p className="text-sm text-brand-muted">No material added yet.</p> : documents.map((doc) => <div key={doc.title} className="flex items-center justify-between rounded-lg border border-surface-border bg-surface p-4">
        <div><p className="font-medium text-editorial-900">{doc.title}</p><p className="text-xs text-brand-muted">{doc.chunks} searchable chunk(s)</p></div>
        <Button type="button" variant="outline" size="sm" onClick={() => remove(doc.title)}>Remove</Button>
      </div>)}
    </section>
  </div>;
}
