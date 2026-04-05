import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MiddlewareFn = (req: any) => any;

vi.mock("next-auth", () => {
  return {
    default: () => {
      // NextAuth(config) returns an object with auth that wraps the callback
      return {
        auth: (callback: MiddlewareFn) => callback,
      };
    },
  };
});

vi.mock("@/lib/auth.config", () => ({
  authConfig: {
    pages: { signIn: "/login" },
    session: { strategy: "jwt" },
    callbacks: {},
    providers: [],
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn().mockReturnValue({ type: "next" }),
    redirect: vi.fn((url: URL) => ({ type: "redirect", url: url.toString() })),
  },
}));

// Import after mocks are set up
import middleware from "../middleware";

function makeRequest(pathname: string, auth?: { user?: { role?: string } } | null) {
  return {
    nextUrl: {
      pathname,
      origin: "http://localhost:3000",
    },
    auth: auth ?? null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("middleware", () => {
  describe("public routes", () => {
    it("allows access to /login", () => {
      const req = makeRequest("/login");
      const result = (middleware as MiddlewareFn)(req);
      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: "next" });
    });

    it("allows access to /register", () => {
      const req = makeRequest("/register");
      (middleware as MiddlewareFn)(req);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("allows access to /api/auth routes", () => {
      const req = makeRequest("/api/auth/signin");
      (middleware as MiddlewareFn)(req);
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("protected routes", () => {
    it("redirects unauthenticated users from /dashboard to /login", () => {
      const req = makeRequest("/dashboard", null);
      (middleware as MiddlewareFn)(req);
      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/login");
    });

    it("allows authenticated users to access /dashboard", () => {
      const req = makeRequest("/dashboard", { user: { role: "MEMBER" } });
      const result = (middleware as MiddlewareFn)(req);
      expect(result).toEqual({ type: "next" });
    });

    it("redirects unauthenticated users from /admin to /login", () => {
      const req = makeRequest("/admin", null);
      (middleware as MiddlewareFn)(req);
      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/login");
    });
  });

  describe("admin routes", () => {
    it("redirects non-admin users from /admin to /dashboard", () => {
      const req = makeRequest("/admin", { user: { role: "MEMBER" } });
      (middleware as MiddlewareFn)(req);
      expect(NextResponse.redirect).toHaveBeenCalled();
      const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/dashboard");
    });

    it("allows ADMIN users to access /admin", () => {
      const req = makeRequest("/admin", { user: { role: "ADMIN" } });
      const result = (middleware as MiddlewareFn)(req);
      expect(result).toEqual({ type: "next" });
    });
  });
});
