"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { unlockTestPortal, unlockSimulationPortal, loginAsTestUser, exitTestSession, lockTestPortal } from "./actions";
import { TEST_PERSONAS, TestPersona } from "@/lib/test-users";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface TestLoginFormProps {
  isUnlocked: boolean;
  simulationUnlocked: boolean;
  simulationPersonas: TestPersona[];
  currentTestUserEmail?: string | null;
}

export function TestLoginForm({
  isUnlocked: initialUnlocked,
  simulationUnlocked: initialSimulationUnlocked,
  simulationPersonas,
  currentTestUserEmail,
}: TestLoginFormProps) {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = React.useState(initialUnlocked);
  const [isSimulationUnlocked, setIsSimulationUnlocked] = React.useState(initialSimulationUnlocked);
  const [password, setPassword] = React.useState("");
  const [simulationPassword, setSimulationPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [simulationError, setSimulationError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [selectedRoleFilter, setSelectedRoleFilter] = React.useState<string>("ALL");
  const [signingInEmail, setSigningInEmail] = React.useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("password", password);

    startTransition(async () => {
      const result = await unlockTestPortal(formData);
      if (result.success) {
        setIsUnlocked(true);
      } else {
        setError(result.error || "Incorrect password.");
      }
    });
  };

  const handleUnlockSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulationError(null);
    const formData = new FormData();
    formData.append("password", simulationPassword);

    startTransition(async () => {
      const result = await unlockSimulationPortal(formData);
      if (result.success) {
        setIsSimulationUnlocked(true);
        setSimulationPassword("");
        router.refresh();
      } else {
        setSimulationError(result.error || "Could not unlock private simulation access.");
      }
    });
  };

  const handleSignIn = (email: string) => {
    setSigningInEmail(email);
    startTransition(async () => {
      try {
        await loginAsTestUser(email);
      } catch (err: any) {
        setError(err.message || "Failed to sign in as test user.");
        setSigningInEmail(null);
      }
    });
  };

  const availablePersonas = isSimulationUnlocked
    ? [...TEST_PERSONAS, ...simulationPersonas]
    : TEST_PERSONAS;
  const filteredPersonas = availablePersonas.filter((p) => {
    if (selectedRoleFilter === "ALL") return true;
    return p.role === selectedRoleFilter;
  });

  const currentPersona = availablePersonas.find(
    (p) => p.email === currentTestUserEmail
  );
  const countRole = (role: string) => availablePersonas.filter((persona) => persona.role === role).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Active Session Alert if already signed in */}
      {currentPersona && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-warm backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
              {currentPersona.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-editorial-900 text-sm">
                  Active Test Session: {currentPersona.firstName} {currentPersona.lastName}
                </span>
                <Badge variant={currentPersona.badgeVariant as any}>
                  {currentPersona.role.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-brand-muted mt-0.5">
                {currentPersona.email} • {currentPersona.title} ({currentPersona.department})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <a href="/dashboard">
              <Button variant="primary" size="sm" className="gap-1.5">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startTransition(async () => exitTestSession())}
              disabled={isPending}
              className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit Session
            </Button>
          </div>
        </div>
      )}

      {!isUnlocked ? (
        /* PASSWORD GATE */
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-surface-border bg-surface p-8 shadow-warm space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-editorial-100 text-editorial-800">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-editorial-900">
                Test Sign-In Access
              </h2>
              <p className="text-xs text-brand-muted leading-relaxed">
                This testing sign-in portal is password protected for project evaluation.
                Enter the designated test passcode to unlock role personas.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Test Passcode
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-brand-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter test passcode"
                    className="w-full rounded-lg border border-surface-border bg-canvas pl-9 pr-3 py-2 text-sm text-editorial-900 placeholder:text-brand-muted focus:border-editorial-800 focus:outline-none focus:ring-1 focus:ring-editorial-800"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full gap-2"
                isLoading={isPending}
              >
                <Unlock className="w-4 h-4" />
                Unlock Test Personas
              </Button>
            </form>

          </div>
        </div>
      ) : (
        /* UNLOCKED PERSONA GRID */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Test Access Unlocked
                </span>
                <span className="text-xs text-brand-muted">• {availablePersonas.length} Ready Identities</span>
              </div>
              <h2 className="font-heading text-2xl font-bold text-editorial-900 mt-1">
                Select a Test Identity to Sign In
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Click any persona below to instantaneously authenticate as that user with complete role-tailored dashboards and workflows.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => startTransition(async () => lockTestPortal())}
                disabled={isPending}
                className="gap-1.5 text-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                Lock Portal
              </Button>
            </div>
          </div>

          {!isSimulationUnlocked ? (
            <form onSubmit={handleUnlockSimulation} className="max-w-md space-y-3 rounded-lg border border-surface-border bg-surface p-4">
              <div>
                <h3 className="text-sm font-semibold text-editorial-900">Private company simulation</h3>
                <p className="mt-1 text-xs text-brand-muted">Simulation profiles are hidden. Enter the private server-configured passphrase to reveal them.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  value={simulationPassword}
                  onChange={(event) => setSimulationPassword(event.target.value)}
                  autoComplete="off"
                  aria-label="Private simulation passphrase"
                  placeholder="Private passphrase"
                  className="min-w-0 flex-1 rounded-md border border-surface-border bg-canvas px-3 py-2 text-sm text-editorial-900"
                  required
                />
                <Button type="submit" variant="outline" size="sm" disabled={isPending}>
                  Unlock simulation
                </Button>
              </div>
              {simulationError && <p role="alert" className="text-xs text-red-700">{simulationError}</p>}
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-editorial-200 bg-editorial-50 p-3">
              <p className="text-xs font-medium text-editorial-800">Private simulation unlocked for this browser session.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => startTransition(async () => lockTestPortal())} disabled={isPending}>
                Hide and lock personas
              </Button>
            </div>
          )}

          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: `All Personas (${availablePersonas.length})` },
              { id: "PLATFORM_ADMIN", label: `Platform Admin (${countRole("PLATFORM_ADMIN")})` },
              { id: "COMPANY_ADMIN", label: `Company Admin (${countRole("COMPANY_ADMIN")})` },
              { id: "MANAGER", label: `Managers (${countRole("MANAGER")})` },
              { id: "EMPLOYEE", label: `Employees (${countRole("EMPLOYEE")})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedRoleFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedRoleFilter === tab.id
                    ? "bg-editorial-800 text-white shadow-sm"
                    : "bg-surface text-brand-muted hover:bg-canvas-muted hover:text-editorial-900 border border-surface-border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Personas Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPersonas.map((persona) => {
              const isCurrent = persona.email === currentTestUserEmail;
              const isSigningInThis = signingInEmail === persona.email;

              return (
                <div
                  key={persona.idKey}
                  className={`relative rounded-xl border p-5 transition-all flex flex-col justify-between ${
                    isCurrent
                      ? "border-emerald-500 bg-emerald-50/30 shadow-md ring-1 ring-emerald-500"
                      : "border-surface-border bg-surface hover:shadow-warm hover:border-editorial-600"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-editorial-800 text-white font-bold text-sm shadow-sm">
                          {persona.avatarInitials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-editorial-900 text-base leading-tight">
                              {persona.firstName} {persona.lastName}
                            </h3>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 rounded px-1.5 py-0.2">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-brand-muted">
                            {persona.title}
                          </p>
                          <p className="text-[11px] text-brand-muted">
                            {persona.department} • {persona.companyName}
                          </p>
                        </div>
                      </div>

                      <Badge variant={persona.badgeVariant as any}>
                        {persona.role.replace("_", " ")}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-brand-muted leading-relaxed">
                      {persona.description}
                    </p>

                    {/* Highlight Workflows */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                        Workflows to Test:
                      </p>
                      <ul className="space-y-1">
                        {persona.highlightWorkflows.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-xs text-editorial-800"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-5 border-t border-surface-border mt-4 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-brand-muted">
                      {persona.email}
                    </span>

                    <Button
                      variant={isCurrent ? "outline" : "primary"}
                      size="sm"
                      onClick={() => handleSignIn(persona.email)}
                      disabled={isPending}
                      isLoading={isSigningInThis}
                      className="gap-1.5"
                    >
                      {isCurrent ? "Continue as " : "Sign In as "}
                      {persona.firstName}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
