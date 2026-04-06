import type { NextAuthConfig } from "next-auth";

const SHORT_MAX_AGE = 24 * 60 * 60; // 1 day
const LONG_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: LONG_MAX_AGE,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.issuedAt = Math.floor(Date.now() / 1000);
        token.rememberMe = user.rememberMe ?? false;
      }

      // Expire short sessions after 1 day
      if (!token.rememberMe && token.issuedAt) {
        const age = Math.floor(Date.now() / 1000) - token.issuedAt;
        if (age > SHORT_MAX_AGE) {
          return { ...token, exp: 0 };
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  providers: [], // populated in auth.ts
} satisfies NextAuthConfig;
