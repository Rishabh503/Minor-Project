"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TEST_ACCESS_PASSWORD, TEST_PERSONAS } from "@/lib/test-users";
import { PRIVATE_SIMULATION_PERSONAS, SIMULATION_TEST_PASSWORD } from "@/lib/private-test-users";

export async function unlockTestPortal(formData: FormData) {
  const password = formData.get("password") as string;

  if (!password || password.trim() !== TEST_ACCESS_PASSWORD) {
    return {
      success: false,
      error: "Invalid test passcode.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set("ascent_test_unlocked", "true", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return { success: true };
}

export async function unlockSimulationPortal(formData: FormData) {
  if (!SIMULATION_TEST_PASSWORD) {
    return { success: false, error: "Private simulation access is not configured on this server." };
  }

  const password = String(formData.get("password") || "");
  if (password !== SIMULATION_TEST_PASSWORD) {
    return { success: false, error: "Private simulation passphrase is incorrect." };
  }

  const cookieStore = await cookies();
  cookieStore.set("ascent_simulation_unlocked", "true", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });
  return { success: true };
}

export async function loginAsTestUser(email: string) {
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get("ascent_test_unlocked")?.value === "true";

  if (!isUnlocked) {
    throw new Error("Test portal is locked. Enter the test passcode first.");
  }

  const isPublicPersona = TEST_PERSONAS.some((persona) => persona.email === email);
  const isSimulationPersona = PRIVATE_SIMULATION_PERSONAS.some((persona) => persona.email === email);
  if (!isPublicPersona && !isSimulationPersona) {
    throw new Error("This test identity is not available.");
  }
  if (
    isSimulationPersona &&
    cookieStore.get("ascent_simulation_unlocked")?.value !== "true"
  ) {
    throw new Error("Unlock private simulation access before selecting this identity.");
  }

  // Find user in database
  const user = await db.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    throw new Error(`Test user with email ${email} was not found. Please ensure seed data has been run.`);
  }

  cookieStore.set("ascent_test_user", user.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  redirect("/dashboard");
}

export async function exitTestSession() {
  const cookieStore = await cookies();
  cookieStore.delete("ascent_test_user");
  cookieStore.delete("ascent_simulation_unlocked");
  redirect("/test-login");
}

export async function lockTestPortal() {
  const cookieStore = await cookies();
  cookieStore.delete("ascent_test_user");
  cookieStore.delete("ascent_test_unlocked");
  cookieStore.delete("ascent_simulation_unlocked");
  redirect("/test-login");
}
