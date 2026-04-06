import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma";
import { authConfig } from "@/lib/auth.config";

declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: Role;
    };
  }

  interface User {
    role: Role;
    rememberMe?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    rememberMe?: boolean;
    issuedAt?: number;
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const rememberMe = credentials?.rememberMe === "true";

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        const isValid = await compare(password, user.hashedPassword);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          rememberMe,
        };
      },
    }),
  ],
});
