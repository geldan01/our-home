"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, signIn, signOut } from "@/lib/auth";

export async function register(
  _prevState: { error: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const name = formData.get("name") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const userCount = await prisma.user.count();
  const role = userCount === 0 ? "ADMIN" : "MEMBER";

  const hashedPassword = await hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: name || null,
      hashedPassword,
      role,
    },
  });

  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  redirect("/dashboard");
}

export async function login(
  _prevState: { error: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const rememberMe = formData.get("rememberMe") === "true";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });
  } catch {
    return { error: "Invalid email or password" };
  }

  redirect("/dashboard");
}

export async function logout() {
  await signOut({ redirect: false });
  redirect("/login");
}

export async function promoteToAdmin(userId: string): Promise<void> {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    throw new Error("User not found");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin");
}

export async function demoteToMember(userId: string): Promise<void> {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  if (session.user.id === userId) {
    throw new Error("You cannot remove your own admin rights");
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    throw new Error("User not found");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "MEMBER" },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin");
}
