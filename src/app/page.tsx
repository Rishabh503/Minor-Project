import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldCheck,
  Building2,
  Users,
  FolderTree,
  ArrowRight,
  Lock,
  Sparkles,
} from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b border-surface-border bg-surface px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 font-heading text-xl font-bold tracking-tight text-editorial-900">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-editorial-800 text-sm font-bold text-white">
              A
            </span>
            <span>Ascent Onboarding</span>
          </div>

          <div className="flex items-center gap-4">
            {userId ? (
              <Link href="/dashboard">
                <Button variant="primary" size="sm" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="accent" size="sm" className="gap-2">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-editorial-100 px-3.5 py-1 text-xs font-semibold text-editorial-800">
            <Sparkles className="w-3.5 h-3.5 text-coral-500" />
            <span>Phase 1 Foundation • Production-Minded Architecture</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-editorial-900 leading-tight">
            Streamlined Employee Onboarding & Compliance Management
          </h1>

          <p className="text-base sm:text-lg text-brand-muted leading-relaxed">
            A multi-tenant governance platform engineered for seamless new hire onboarding, departmental role allocation, and auditable employee milestones.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href={userId ? "/dashboard" : "/sign-up"}>
              <Button variant="primary" size="lg" className="gap-2.5">
                {userId ? "Access Workplace Dashboard" : "Register Organization"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg">
                Sign In to Existing Tenant
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
          <div className="rounded-lg border border-surface-border bg-surface p-6 shadow-warm">
            <div className="h-10 w-10 rounded-md bg-canvas-subtle flex items-center justify-center text-editorial-800 mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-editorial-900">
              Multi-Tenant Architecture
            </h3>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              Company-isolated memberships and workspace contexts ensuring no cross-tenant leakage.
            </p>
          </div>

          <div className="rounded-lg border border-surface-border bg-surface p-6 shadow-warm">
            <div className="h-10 w-10 rounded-md bg-canvas-subtle flex items-center justify-center text-editorial-800 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-editorial-900">
              Server-Enforced RBAC
            </h3>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              Granular role verification across Platform Admin, Company Admin, Manager, and Employee tiers.
            </p>
          </div>

          <div className="rounded-lg border border-surface-border bg-surface p-6 shadow-warm">
            <div className="h-10 w-10 rounded-md bg-canvas-subtle flex items-center justify-center text-editorial-800 mb-4">
              <FolderTree className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-editorial-900">
              Department Alignment
            </h3>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              Structured department hierarchies for tailored onboarding paths and direct reporting.
            </p>
          </div>

          <div className="rounded-lg border border-surface-border bg-surface p-6 shadow-warm">
            <div className="h-10 w-10 rounded-md bg-canvas-subtle flex items-center justify-center text-coral-500 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-editorial-900">
              Comprehensive Audit Trail
            </h3>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              Every invitation, role assignment, and profile completion is permanently recorded in Neon PostgreSQL.
            </p>
          </div>
        </div>

        {/* Roles Supported Banner */}
        <div className="rounded-xl border border-surface-border bg-surface-raised p-6 text-center space-y-4">
          <p className="text-xs uppercase font-bold tracking-wider text-brand-muted">
            Role-Specific Dashboard Shells
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge variant="warning">PLATFORM_ADMIN</Badge>
            <Badge variant="editorial">COMPANY_ADMIN</Badge>
            <Badge variant="coral">MANAGER</Badge>
            <Badge variant="neutral">EMPLOYEE</Badge>
          </div>
          <p className="text-xs text-brand-muted max-w-xl mx-auto">
            Each role receives a tailored workspace shell with strict server-validated route isolation.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface py-6 px-6 text-center text-xs text-brand-muted">
        <p>© 2026 Ascent Onboarding Platform. Built with Next.js, Clerk, Neon PostgreSQL, and Prisma.</p>
      </footer>
    </div>
  );
}
