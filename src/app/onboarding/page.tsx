import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const { dbUser } = await requireAuth();

  // Find user's active membership
  const activeMembership = await db.companyMembership.findFirst({
    where: { userId: dbUser.id, status: "ACTIVE" },
    include: {
      company: {
        include: {
          departments: true,
        },
      },
      employeeProfile: true,
    },
  });

  const hasCompany = Boolean(activeMembership);
  const companyName = activeMembership?.company.name;
  const departments = activeMembership?.company.departments || [];
  const existingProfile = activeMembership?.employeeProfile;

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <OnboardingForm
        user={{
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          email: dbUser.email,
        }}
        hasCompany={hasCompany}
        companyName={companyName}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        existingProfile={
          existingProfile
            ? {
                jobTitle: existingProfile.jobTitle,
                departmentId: existingProfile.departmentId,
                phoneNumber: existingProfile.phoneNumber,
                location: existingProfile.location,
                bio: existingProfile.bio,
              }
            : null
        }
      />
    </div>
  );
}
