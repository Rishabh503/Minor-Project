"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Building2, ShieldCheck, ChevronRight, LogOut, Users, Sparkles } from "lucide-react";
import { exitTestSession } from "@/app/test-login/actions";

interface HeaderProps {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    imageUrl?: string | null;
  };
  company?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  role?: string;
  isPlatformAdmin?: boolean;
  isTestSession?: boolean;
}

export function Header({
  user,
  company,
  role,
  isPlatformAdmin,
  isTestSession,
}: HeaderProps) {
  const [isExiting, startExit] = React.useTransition();

  const getRoleBadgeVariant = (r?: string) => {
    switch (r) {
      case "COMPANY_ADMIN":
        return "editorial";
      case "MANAGER":
        return "coral";
      case "PLATFORM_ADMIN":
        return "warning";
      default:
        return "neutral";
    }
  };

  const handleExitTest = () => {
    startExit(async () => {
      await exitTestSession();
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-surface-border bg-surface px-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight text-editorial-800 hover:text-editorial-700"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded bg-editorial-800 text-xs font-bold text-white shadow-sm">
            A
          </span>
          <span>Ascent</span>
        </Link>

        {company && (
          <div className="hidden items-center gap-2 text-sm md:flex pl-3 border-l border-surface-border">
            <Building2 className="w-4 h-4 text-brand-muted" />
            <span className="font-medium text-brand-text">{company.name}</span>
            <ChevronRight className="w-3.5 h-3.5 text-brand-muted" />
          </div>
        )}

        {isPlatformAdmin ? (
          <Badge variant="warning" className="gap-1">
            <ShieldCheck className="w-3 h-3" />
            Platform Admin
          </Badge>
        ) : (
          role && (
            <Badge variant={getRoleBadgeVariant(role)}>
              {role.replace("_", " ")}
            </Badge>
          )
        )}

        {isTestSession && (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-100/80 border border-amber-300 px-2 py-0.5 text-[11px] font-bold text-amber-900">
            <Sparkles className="w-3 h-3 text-amber-600" />
            Test Mode
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {isTestSession ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-editorial-900 leading-tight">
                {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email}
              </p>
              <p className="text-[11px] text-brand-muted">{user.email}</p>
            </div>

            {/* Quick Switch Persona Link */}
            <Link href="/test-login">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 px-2.5">
                <Users className="w-3.5 h-3.5 text-editorial-700" />
                <span className="hidden md:inline">Switch Persona</span>
              </Button>
            </Link>

            {/* Exit Session Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExitTest}
              disabled={isExiting}
              className="gap-1.5 text-xs h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Exit Test Mode"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exit</span>
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-brand-text">
                {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email}
              </p>
              <p className="text-[11px] text-brand-muted">{user.email}</p>
            </div>
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full border border-surface-border",
                },
              }}
            />
          </>
        )}
      </div>
    </header>
  );
}
