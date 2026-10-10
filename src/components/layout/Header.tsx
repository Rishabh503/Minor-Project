"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/Badge";
import { Building2, ShieldCheck, ChevronRight } from "lucide-react";

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
}

export function Header({
  user,
  company,
  role,
  isPlatformAdmin,
}: HeaderProps) {
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

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-surface-border bg-surface px-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight text-editorial-800 hover:text-editorial-700"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded bg-editorial-800 text-xs font-bold text-white">
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
      </div>

      <div className="flex items-center gap-4">
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
      </div>
    </header>
  );
}
