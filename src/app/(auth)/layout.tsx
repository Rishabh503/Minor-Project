import * as React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-heading text-2xl font-bold tracking-tight text-editorial-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded bg-editorial-800 text-sm font-bold text-white">
            A
          </span>
          <span>Ascent Onboarding</span>
        </Link>
        <p className="mt-1 text-xs text-brand-muted">
          Enterprise Employee Onboarding & Compliance Platform
        </p>
      </div>

      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
