"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building,
  GraduationCap,
  Shield,
  FileCheck2,
  FolderTree,
  UserCheck,
  ClipboardList,
  Sparkles,
  Layers,
  Calendar,
  CheckSquare,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

interface SidebarProps {
  role?: string;
  isPlatformAdmin?: boolean;
}

export function Sidebar({ role, isPlatformAdmin }: SidebarProps) {
  const pathname = usePathname();

  const getNavLinks = () => {
    if (isPlatformAdmin) {
      return [
        { href: "/dashboard", label: "Platform Overview", icon: LayoutDashboard },
        { href: "/dashboard/admin/organizations", label: "Organizations", icon: Building },
        { href: "/dashboard/admin/audit-logs", label: "Global Audit Trail", icon: Shield },
      ];
    }

    switch (role) {
      case "COMPANY_ADMIN":
        return [
          { href: "/dashboard", label: "Executive Overview", icon: LayoutDashboard },
          { href: "/dashboard/analytics", label: "Analytics & Rankings", icon: TrendingUp },
          { href: "/dashboard/schedule", label: "Schedule & Meetings", icon: Calendar },
          { href: "/dashboard/assessments", label: "Worksheets & Tests", icon: CheckSquare },
          { href: "/dashboard/forum", label: "Forum & Doubts", icon: MessageSquare },
          { href: "/dashboard/company/members", label: "Team & Invites", icon: Users },
          { href: "/dashboard/tasks", label: "Tasks & Training", icon: Layers },
          { href: "/dashboard/company/departments", label: "Departments", icon: FolderTree },
          { href: "/dashboard/company/tracks", label: "Onboarding Tracks", icon: GraduationCap },
          { href: "/dashboard/company/audit-logs", label: "Security & Audit", icon: Shield },
        ];
      case "MANAGER":
        return [
          { href: "/dashboard", label: "Manager Hub", icon: LayoutDashboard },
          { href: "/dashboard/analytics", label: "Analytics & Rankings", icon: TrendingUp },
          { href: "/dashboard/schedule", label: "Schedule & Meetings", icon: Calendar },
          { href: "/dashboard/assessments", label: "Worksheets & Tests", icon: CheckSquare },
          { href: "/dashboard/forum", label: "Forum & Doubts", icon: MessageSquare },
          { href: "/dashboard/tasks", label: "Tasks & Training", icon: Layers },
          { href: "/dashboard/manager/team", label: "My Direct Reports", icon: UserCheck },
          { href: "/dashboard/manager/reviews", label: "Task Reviews", icon: ClipboardList },
          { href: "/dashboard/manager/progress", label: "Department Progress", icon: FileCheck2 },
        ];
      case "EMPLOYEE":
      default:
        return [
          { href: "/dashboard", label: "My Onboarding Hub", icon: LayoutDashboard },
          { href: "/dashboard/analytics", label: "My Analytics & Rank", icon: TrendingUp },
          { href: "/dashboard/schedule", label: "Schedule & Meetings", icon: Calendar },
          { href: "/dashboard/assessments", label: "Worksheets & Tests", icon: CheckSquare },
          { href: "/dashboard/forum", label: "Forum & Doubts", icon: MessageSquare },
          { href: "/dashboard/employee/tasks", label: "Onboarding Checklist", icon: FileCheck2 },
          { href: "/dashboard/employee/training", label: "Training Modules", icon: GraduationCap },
          { href: "/dashboard/employee/profile", label: "My Profile", icon: Users },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 shrink-0 border-r border-surface-border bg-canvas-subtle p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
            Navigation
          </p>
          <nav className="mt-2 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-editorial-800 text-white shadow-sm"
                      : "text-brand-text hover:bg-canvas-muted"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-brand-muted")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="rounded-lg border border-surface-border bg-surface p-3 shadow-warm">
        <div className="flex items-center gap-2 text-xs font-semibold text-editorial-800">
          <Sparkles className="w-3.5 h-3.5 text-coral-500" />
          <span>Enterprise Guard</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-brand-muted">
          All workspace operations are verified server-side with strict RBAC.
        </p>
      </div>
    </aside>
  );
}
