"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { analyzeDoubtsAction } from "./actions";

type Insight = { topic: string; count: number; summary: string; suggestion: string };

export function DoubtInsights() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ overallSummary: string; themes: Insight[]; analyzedCount: number } | null>(null);

  async function analyze() {
    setLoading(true); setError("");
    const response = await analyzeDoubtsAction();
    setLoading(false);
    if ("error" in response) setError(response.error || "Could not analyze questions.");
    else setResult(response);
  }

  return <Card className="border-editorial-200 shadow-warm">
    <CardHeader className="flex flex-row items-center justify-between gap-4">
      <div><CardTitle className="flex items-center gap-2 text-editorial-900"><Sparkles className="h-4 w-4 text-coral-600" />AI Doubt Insights</CardTitle><p className="mt-1 text-xs text-brand-muted">Summarize recurring questions and suggested manager follow-ups.</p></div>
      <Button type="button" variant="outline" size="sm" onClick={analyze} disabled={loading}>{loading ? "Analyzing…" : "Analyze questions"}</Button>
    </CardHeader>
    {error && <CardContent><p role="alert" className="text-sm text-red-700">{error}</p></CardContent>}
    {result && <CardContent className="space-y-4">
      <p className="text-sm text-editorial-800">{result.overallSummary}</p>
      <p className="text-xs text-brand-muted">Analyzed {result.analyzedCount} recent open or answered questions. AI generated; review before acting.</p>
      <div className="grid gap-3 md:grid-cols-2">{result.themes.map((theme, index) => <div key={`${theme.topic}-${index}`} className="rounded-lg border border-surface-border bg-canvas p-4">
        <h3 className="font-semibold text-editorial-900">{theme.topic} <span className="text-xs font-normal text-brand-muted">({theme.count})</span></h3>
        <p className="mt-2 text-sm text-brand-muted">{theme.summary}</p>
        <p className="mt-3 text-sm"><strong>Suggested follow-up:</strong> {theme.suggestion}</p>
      </div>)}</div>
    </CardContent>}
  </Card>;
}
