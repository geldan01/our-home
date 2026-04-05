import Link from "next/link";
import { auth } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import { Role } from "@/generated/prisma";

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-amber-200/60 bg-background dark:border-amber-900/30">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/dashboard"
          className="text-2xl font-bold tracking-tight text-amber-950 dark:text-amber-50"
        >
          {process.env.NEXT_PUBLIC_SITE_TITLE ?? "Oracle"}
        </Link>

        {session?.user && (
          <div className="flex items-center gap-3">
            {session.user.role === Role.ADMIN && (
              <Link
                href="/admin"
                className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-stone-900 dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-300 dark:hover:bg-stone-700"
              >
                Admin
              </Link>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-sm font-medium text-stone-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-stone-900 dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-300 dark:hover:bg-stone-700"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
