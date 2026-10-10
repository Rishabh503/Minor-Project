import * as React from "react";
import { requireActiveCompanyContext } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireActiveCompanyContext();

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Header
        user={{
          firstName: context.dbUser.firstName,
          lastName: context.dbUser.lastName,
          email: context.dbUser.email,
          imageUrl: context.dbUser.imageUrl,
        }}
        company={context.company}
        role={context.membership?.role}
        isPlatformAdmin={context.isPlatformAdmin}
      />

      <div className="flex flex-1">
        <Sidebar
          role={context.membership?.role}
          isPlatformAdmin={context.isPlatformAdmin}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
