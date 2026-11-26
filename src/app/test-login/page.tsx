import { cookies } from "next/headers";
import Link from "next/link";
import { db } from "@/lib/db";
import { TestLoginForm } from "./TestLoginForm";
import { PRIVATE_SIMULATION_PERSONAS } from "@/lib/private-test-users";
import { ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Test Sign-In Portal | Ascent Onboarding Platform",
  description: "Password-protected testing sign-in portal for verifying role workflows across all identities.",
};

export default async function TestLoginPage() {
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get("ascent_test_unlocked")?.value === "true";
  const simulationUnlocked = cookieStore.get("ascent_simulation_unlocked")?.value === "true";
  const testUserId = cookieStore.get("ascent_test_user")?.value;

  let currentTestUserEmail: string | null = null;
  if (testUserId) {
    const user = await db.user.findFirst({
      where: {
        OR: [{ id: testUserId }, { email: testUserId }, { clerkId: testUserId }],
      },
      select: { email: true },
    });
    if (user) {
      currentTestUserEmail = user.email;
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-surface-border bg-surface px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight text-editorial-900 hover:text-editorial-700 transition-colors"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-editorial-800 text-xs font-bold text-white shadow-sm">
              A
            </span>
            <span>Ascent Onboarding</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-editorial-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
            <span className="text-surface-border">|</span>
            <Link
              href="/sign-in"
              className="text-xs font-medium text-brand-muted hover:text-editorial-900 transition-colors"
            >
              Standard Clerk Sign-In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 flex flex-col justify-center w-full">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-editorial-100 px-3 py-1 text-xs font-semibold text-editorial-800">
            <Sparkles className="w-3.5 h-3.5 text-coral-500" />
            <span>Academic Minor Project • Multi-Role Testing Suite</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-editorial-900">
            Rapid Role Testing & Demonstration Portal
          </h1>
          <p className="text-sm text-brand-muted max-w-xl mx-auto">
            Switch between Platform SuperAdmin, Company Admin, Engineering & Product Managers,
            and New Hires with one click to test end-to-end multi-tenant workflows.
          </p>
        </div>

        <TestLoginForm
          isUnlocked={isUnlocked}
          simulationUnlocked={simulationUnlocked}
          simulationPersonas={simulationUnlocked ? PRIVATE_SIMULATION_PERSONAS : []}
          currentTestUserEmail={currentTestUserEmail}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface py-5 px-6 text-center text-xs text-brand-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Ascent Onboarding Platform • Testing Sandbox</p>
        </div>
      </footer>
    </div>
  );
}
